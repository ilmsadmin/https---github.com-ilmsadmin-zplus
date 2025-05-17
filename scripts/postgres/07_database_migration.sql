-- Script for database migration and upgrades
-- Dùng để cập nhật schema từ phiên bản cũ lên phiên bản mới

-- Kết nối tới system_db
\c system_db

-- Kiểm tra phiên bản schema hiện tại
DO $$
BEGIN
    -- Tạo bảng schema_migrations nếu chưa tồn tại
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_migrations') THEN
        CREATE TABLE schema_migrations (
            version VARCHAR(50) PRIMARY KEY,
            applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO schema_migrations (version) VALUES ('0.0.0');
    END IF;
END $$;

-- Hàm migration version 1.0.0 -> 2.0.0
DO $$
DECLARE
    current_version VARCHAR;
BEGIN
    -- Lấy phiên bản hiện tại
    SELECT version INTO current_version FROM schema_migrations ORDER BY applied_at DESC LIMIT 1;
    
    -- Kiểm tra xem đã migrate lên version 2.0.0 chưa
    IF current_version < '2.0.0' THEN
        RAISE NOTICE 'Migrating from version % to version 2.0.0', current_version;
        
        -- Thêm cột mới vào bảng tenants
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'tenants' AND column_name = 'custom_domain_enabled') THEN
            ALTER TABLE tenants ADD COLUMN custom_domain_enabled BOOLEAN DEFAULT false;
            RAISE NOTICE 'Added custom_domain_enabled column to tenants table';
        END IF;
        
        -- Thêm cột support_email và phone vào tenants
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'tenants' AND column_name = 'support_email') THEN
            ALTER TABLE tenants ADD COLUMN support_email VARCHAR(255);
            ALTER TABLE tenants ADD COLUMN support_phone VARCHAR(50);
            RAISE NOTICE 'Added support contact columns to tenants table';
        END IF;
        
        -- Thêm cột mới vào bảng modules
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'modules' AND column_name = 'is_premium') THEN
            ALTER TABLE modules ADD COLUMN is_premium BOOLEAN DEFAULT false;
            ALTER TABLE modules ADD COLUMN dependencies JSONB DEFAULT '[]';
            RAISE NOTICE 'Added premium flag and dependencies to modules table';
        END IF;
        
        -- Thêm cột mới vào bảng domains
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'domains' AND column_name = 'last_verified_at') THEN
            ALTER TABLE domains ADD COLUMN last_verified_at TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'Added last_verified_at column to domains table';
        END IF;
        
        -- Tạo bảng mới cho module_marketplace
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'module_marketplace') THEN
            CREATE TABLE module_marketplace (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                module_id UUID NOT NULL,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                version VARCHAR(20) DEFAULT '1.0.0',
                price DECIMAL(10, 2),
                is_free BOOLEAN DEFAULT false,
                publisher VARCHAR(100),
                website_url VARCHAR(255),
                documentation_url VARCHAR(255),
                screenshots JSONB DEFAULT '[]',
                category VARCHAR(50),
                tags JSONB DEFAULT '[]',
                rating DECIMAL(3, 2),
                review_count INTEGER DEFAULT 0,
                download_count INTEGER DEFAULT 0,
                published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
            );
            CREATE INDEX idx_module_marketplace_name ON module_marketplace(name);
            CREATE INDEX idx_module_marketplace_category ON module_marketplace(category);
            CREATE INDEX idx_module_marketplace_is_free ON module_marketplace(is_free);
            RAISE NOTICE 'Created module_marketplace table';
        END IF;
        
        -- Tạo bảng module_reviews
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'module_reviews') THEN
            CREATE TABLE module_reviews (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                marketplace_id UUID NOT NULL,
                tenant_id UUID NOT NULL,
                rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
                review_text TEXT,
                reviewer_name VARCHAR(100),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (marketplace_id) REFERENCES module_marketplace(id) ON DELETE CASCADE,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
            );
            CREATE INDEX idx_module_reviews_marketplace_id ON module_reviews(marketplace_id);
            CREATE INDEX idx_module_reviews_tenant_id ON module_reviews(tenant_id);
            RAISE NOTICE 'Created module_reviews table';
        END IF;
        
        -- Tạo bảng api_keys cho system users
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_api_keys') THEN
            CREATE TABLE system_api_keys (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL,
                api_key VARCHAR(255) NOT NULL UNIQUE,
                system_user_id UUID NOT NULL,
                permissions JSONB NOT NULL,
                expires_at TIMESTAMP WITH TIME ZONE,
                last_used_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (system_user_id) REFERENCES system_users(id) ON DELETE CASCADE
            );
            CREATE INDEX idx_system_api_keys_system_user_id ON system_api_keys(system_user_id);
            RAISE NOTICE 'Created system_api_keys table';
        END IF;
        
        -- Cập nhật các tenant schema hiện có
        DECLARE
            tenant_cursor CURSOR FOR SELECT schema_name FROM tenants WHERE status != 'deleted';
            tenant_schema VARCHAR;
        BEGIN
            OPEN tenant_cursor;
            LOOP
                FETCH tenant_cursor INTO tenant_schema;
                EXIT WHEN NOT FOUND;
                
                -- Chỉ thêm các bảng mới nếu tenant schema tồn tại
                IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'tenant_' || tenant_schema) THEN
                    -- Tùy chỉnh schema của tenant hiện có
                    EXECUTE format('
                        -- Thêm bảng cấu hình notification
                        CREATE TABLE IF NOT EXISTS %I.notification_settings (
                            user_id UUID PRIMARY KEY,
                            email_enabled BOOLEAN DEFAULT true,
                            in_app_enabled BOOLEAN DEFAULT true,
                            push_enabled BOOLEAN DEFAULT false,
                            sms_enabled BOOLEAN DEFAULT false,
                            email_digest VARCHAR(20) DEFAULT ''instant'' CHECK (email_digest IN (''instant'', ''daily'', ''weekly'', ''none'')),
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (user_id) REFERENCES %I.users(id) ON DELETE CASCADE
                        );
                        
                        -- Thêm bảng webhooks
                        CREATE TABLE IF NOT EXISTS %I.webhooks (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            name VARCHAR(100) NOT NULL,
                            url VARCHAR(255) NOT NULL,
                            events JSONB NOT NULL,
                            headers JSONB,
                            is_active BOOLEAN DEFAULT true,
                            secret VARCHAR(255),
                            created_by UUID NOT NULL,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (created_by) REFERENCES %I.users(id) ON DELETE RESTRICT
                        );
                        
                        -- Thêm bảng webhook_deliveries
                        CREATE TABLE IF NOT EXISTS %I.webhook_deliveries (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            webhook_id UUID NOT NULL,
                            event_type VARCHAR(100) NOT NULL,
                            payload JSONB NOT NULL,
                            response_code INTEGER,
                            response_body TEXT,
                            delivered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            status VARCHAR(20) CHECK (status IN (''success'', ''failed'', ''pending'')),
                            retry_count INTEGER DEFAULT 0,
                            FOREIGN KEY (webhook_id) REFERENCES %I.webhooks(id) ON DELETE CASCADE
                        );
                        
                        -- Thêm bảng integrations
                        CREATE TABLE IF NOT EXISTS %I.integrations (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            name VARCHAR(100) NOT NULL,
                            provider VARCHAR(50) NOT NULL,
                            config JSONB NOT NULL,
                            auth_data JSONB,
                            is_active BOOLEAN DEFAULT true,
                            created_by UUID NOT NULL,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (created_by) REFERENCES %I.users(id) ON DELETE RESTRICT
                        );
                    ', 
                    'tenant_' || tenant_schema, 'tenant_' || tenant_schema, 
                    'tenant_' || tenant_schema, 'tenant_' || tenant_schema,
                    'tenant_' || tenant_schema, 'tenant_' || tenant_schema,
                    'tenant_' || tenant_schema, 'tenant_' || tenant_schema);
                    
                    RAISE NOTICE 'Updated schema for tenant: %', tenant_schema;
                END IF;
            END LOOP;
            CLOSE tenant_cursor;
        END;
        
        -- Cập nhật phiên bản schema
        INSERT INTO schema_migrations (version) VALUES ('2.0.0');
        RAISE NOTICE 'Migration to version 2.0.0 completed successfully';
    ELSE
        RAISE NOTICE 'Schema is already at version 2.0.0 or higher, no migration needed';
    END IF;
END $$;
