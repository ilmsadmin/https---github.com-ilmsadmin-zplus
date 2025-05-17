-- Hàm tạo schema tenant với các bảng mới
-- Phiên bản 2.0 với bổ sung bảng teams, team_members, notifications, custom_fields
-- Mở rộng users và roles với các field bổ sung (MFA, themes, languages)
-- Thêm phân cấp quyền (hierarchical permissions)

CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_schema_name VARCHAR)
RETURNS VOID AS $$
DECLARE
    schema_name VARCHAR := 'tenant_' || tenant_schema_name;
BEGIN
    EXECUTE format('CREATE SCHEMA %I', schema_name);

    -- Users table with MFA support and more profile fields
    EXECUTE format('
        CREATE TABLE %I.users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            username VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            phone VARCHAR(50),
            role_id UUID NOT NULL,
            is_mfa_enabled BOOLEAN DEFAULT false,
            mfa_secret VARCHAR(255),
            language VARCHAR(10) DEFAULT ''en'',
            theme VARCHAR(20) DEFAULT ''light'',
            timezone VARCHAR(50) DEFAULT ''UTC'',
            avatar_url TEXT,
            status VARCHAR(20) NOT NULL DEFAULT ''active'' CHECK (status IN (''active'', ''suspended'')),
            last_login_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (role_id) REFERENCES %I.roles(id) ON DELETE RESTRICT
        )', schema_name, schema_name);
    EXECUTE format('CREATE INDEX idx_users_email ON %I.users(email)', schema_name);
    EXECUTE format('CREATE INDEX idx_users_status ON %I.users(status)', schema_name);

    -- Enhanced roles with advanced permissions
    EXECUTE format('
        CREATE TABLE %I.roles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL,
            description TEXT,
            permissions JSONB NOT NULL,
            is_system BOOLEAN DEFAULT false,
            parent_role_id UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_role_id) REFERENCES %I.roles(id) ON DELETE SET NULL
        )', schema_name, schema_name);
    EXECUTE format('CREATE INDEX idx_roles_name ON %I.roles(name)', schema_name);
    EXECUTE format('CREATE INDEX idx_roles_is_system ON %I.roles(is_system)', schema_name);

    -- User data with versioning
    EXECUTE format('
        CREATE TABLE %I.user_data (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            module_id UUID NOT NULL,
            data JSONB NOT NULL,
            version INTEGER DEFAULT 1,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES %I.users(id) ON DELETE CASCADE,
            FOREIGN KEY (module_id) REFERENCES system_db.modules(id) ON DELETE RESTRICT
        )', schema_name, schema_name);
    EXECUTE format('CREATE INDEX idx_user_data_user_id ON %I.user_data(user_id)', schema_name);
    EXECUTE format('CREATE INDEX idx_user_data_module_id ON %I.user_data(module_id)', schema_name);
    
    -- Teams for collaboration
    EXECUTE format('
        CREATE TABLE %I.teams (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL,
            description TEXT,
            created_by UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES %I.users(id) ON DELETE RESTRICT
        )', schema_name, schema_name);
    EXECUTE format('CREATE INDEX idx_teams_created_by ON %I.teams(created_by)', schema_name);
    
    -- Team members
    EXECUTE format('
        CREATE TABLE %I.team_members (
            team_id UUID NOT NULL,
            user_id UUID NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT ''member'' CHECK (role IN (''owner'', ''admin'', ''member'')),
            joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (team_id, user_id),
            FOREIGN KEY (team_id) REFERENCES %I.teams(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES %I.users(id) ON DELETE CASCADE
        )', schema_name, schema_name, schema_name);
    EXECUTE format('CREATE INDEX idx_team_members_user_id ON %I.team_members(user_id)', schema_name);
    
    -- Notifications
    EXECUTE format('
        CREATE TABLE %I.notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) NOT NULL,
            is_read BOOLEAN DEFAULT false,
            data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES %I.users(id) ON DELETE CASCADE
        )', schema_name, schema_name);
    EXECUTE format('CREATE INDEX idx_notifications_user_id ON %I.notifications(user_id)', schema_name);
    EXECUTE format('CREATE INDEX idx_notifications_is_read ON %I.notifications(is_read)', schema_name);
    EXECUTE format('CREATE INDEX idx_notifications_created_at ON %I.notifications(created_at)', schema_name);
    
    -- Custom fields definitions
    EXECUTE format('
        CREATE TABLE %I.custom_fields (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            module_id UUID NOT NULL,
            entity_type VARCHAR(100) NOT NULL,
            name VARCHAR(100) NOT NULL,
            label VARCHAR(100) NOT NULL,
            field_type VARCHAR(50) NOT NULL,
            options JSONB,
            is_required BOOLEAN DEFAULT false,
            is_searchable BOOLEAN DEFAULT false,
            created_by UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (module_id) REFERENCES system_db.modules(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES %I.users(id) ON DELETE RESTRICT
        )', schema_name, schema_name);
    EXECUTE format('CREATE INDEX idx_custom_fields_module_id ON %I.custom_fields(module_id)', schema_name);
    EXECUTE format('CREATE INDEX idx_custom_fields_entity_type ON %I.custom_fields(entity_type)', schema_name);
    
    -- Audit Trail for tenant activities
    EXECUTE format('
        CREATE TABLE %I.audit_trail (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID,
            action VARCHAR(50) NOT NULL,
            entity_type VARCHAR(50) NOT NULL,
            entity_id UUID,
            old_values JSONB,
            new_values JSONB,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES %I.users(id) ON DELETE SET NULL
        )', schema_name, schema_name);
    EXECUTE format('CREATE INDEX idx_audit_trail_user_id ON %I.audit_trail(user_id)', schema_name);
    EXECUTE format('CREATE INDEX idx_audit_trail_action ON %I.audit_trail(action)', schema_name);
    EXECUTE format('CREATE INDEX idx_audit_trail_entity_type ON %I.audit_trail(entity_type)', schema_name);
    EXECUTE format('CREATE INDEX idx_audit_trail_created_at ON %I.audit_trail(created_at)', schema_name);
    
    -- API Keys for tenant integrations
    EXECUTE format('
        CREATE TABLE %I.api_keys (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL,
            api_key VARCHAR(255) NOT NULL UNIQUE,
            permissions JSONB NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE,
            created_by UUID NOT NULL,
            last_used_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES %I.users(id) ON DELETE RESTRICT
        )', schema_name, schema_name);
    EXECUTE format('CREATE INDEX idx_api_keys_created_by ON %I.api_keys(created_by)', schema_name);
    
    -- Scheduled Jobs for tenant-specific background tasks
    EXECUTE format('
        CREATE TABLE %I.scheduled_jobs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL,
            cron_expression VARCHAR(100) NOT NULL,
            job_type VARCHAR(50) NOT NULL,
            parameters JSONB,
            is_active BOOLEAN DEFAULT true,
            last_run_at TIMESTAMP WITH TIME ZONE,
            created_by UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES %I.users(id) ON DELETE RESTRICT
        )', schema_name, schema_name);
    EXECUTE format('CREATE INDEX idx_scheduled_jobs_is_active ON %I.scheduled_jobs(is_active)', schema_name);
    
    -- Insert default roles with hierarchical permissions
    EXECUTE format('
        INSERT INTO %I.roles (id, name, description, permissions, is_system)
        VALUES
            (''550e8400-e29b-41d4-a716-446655440006'', ''Admin'', ''Tenant Administrator'', ''{"crm": ["read", "write", "delete", "admin"], "hrm": ["read", "write", "delete", "admin"], "analytics": ["read", "write", "admin"], "settings": ["read", "write", "admin"]}''::jsonb, true),
            (''550e8400-e29b-41d4-a716-446655440007'', ''Manager'', ''Department Manager'', ''{"crm": ["read", "write"], "hrm": ["read", "write"], "analytics": ["read", "write"], "settings": ["read"]}''::jsonb, true),
            (''550e8400-e29b-41d4-a716-446655440008'', ''Staff'', ''Regular Staff'', ''{"crm": ["read", "write"], "hrm": ["read"], "analytics": ["read"]}''::jsonb, true),
            (''550e8400-e29b-41d4-a716-446655440009'', ''User'', ''Basic User'', ''{"crm": ["read"], "hrm": ["read"], "analytics": ["read"]}''::jsonb, true)
    ', schema_name);
    
    -- Child roles with inheritance
    EXECUTE format('
        INSERT INTO %I.roles (name, description, permissions, is_system, parent_role_id)
        VALUES
            (''Sales Manager'', ''Sales Department Manager'', ''{"crm": ["read", "write", "delete"], "sales": ["read", "write", "delete", "admin"]}''::jsonb, true, ''550e8400-e29b-41d4-a716-446655440007''),
            (''HR Manager'', ''HR Department Manager'', ''{"hrm": ["read", "write", "delete", "admin"], "recruitment": ["read", "write", "delete", "admin"]}''::jsonb, true, ''550e8400-e29b-41d4-a716-446655440007''),
            (''Sales Representative'', ''Sales Staff Member'', ''{"crm": ["read", "write"], "sales": ["read", "write"]}''::jsonb, true, ''550e8400-e29b-41d4-a716-446655440008'')
    ', schema_name);
    
    RAISE NOTICE 'Created schema % with all tenant tables', schema_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_tenant_schema IS 'Creates a new tenant schema with all necessary tables including teams, notifications, custom fields, and hierarchical permissions';
