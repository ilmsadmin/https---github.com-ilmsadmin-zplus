-- Connect to system database
\c system_db;

-- Set search path
SET search_path TO system, public;

-- Insert sample packages
INSERT INTO packages (id, name, description, max_users, max_storage_gb, pricing_monthly, pricing_yearly, feature_flags, api_rate_limit)
VALUES
    (uuid_generate_v4(), 'Basic', 'Basic features for small teams', 10, 5, 29.99, 299.90, '{"crm": true, "hrm": false, "analytics": false, "advanced_security": false}', 100),
    (uuid_generate_v4(), 'Pro', 'Professional features for growing businesses', 50, 20, 99.99, 999.90, '{"crm": true, "hrm": true, "analytics": true, "advanced_security": false}', 500),
    (uuid_generate_v4(), 'Enterprise', 'Enterprise-grade features for large organizations', 100, 100, 299.99, 2999.90, '{"crm": true, "hrm": true, "analytics": true, "advanced_security": true}', 2000);

-- Get Enterprise package ID
DO $$
DECLARE
    enterprise_id UUID;
    system_admin_id UUID;
    tenant_id UUID;
BEGIN
    -- Get Enterprise package ID
    SELECT id INTO enterprise_id FROM packages WHERE name = 'Enterprise';
    
    -- Insert system admin user
    INSERT INTO system_users (id, email, password, first_name, last_name, role)
    VALUES (
        uuid_generate_v4(),
        'admin@example.com',
        crypt('Admin@123', gen_salt('bf')),
        'System',
        'Admin',
        'admin'
    )
    RETURNING id INTO system_admin_id;
    
    -- Insert sample tenant
    INSERT INTO tenants (id, name, schema_name, package_id)
    VALUES (
        uuid_generate_v4(),
        'Demo Enterprise',
        'demoenterprise',
        enterprise_id
    )
    RETURNING id INTO tenant_id;
    
    -- Insert domain for tenant
    INSERT INTO domains (tenant_id, domain_name, is_verified, is_default, status)
    VALUES (
        tenant_id,
        'demoenterprise.example.com',
        TRUE,
        TRUE,
        'active'
    );
    
    -- Insert billing information
    INSERT INTO billing (tenant_id, package_id, billing_cycle, next_billing_date, payment_method_id, subscription_id)
    VALUES (
        tenant_id,
        enterprise_id,
        'monthly',
        NOW() + INTERVAL '30 days',
        'pm_sample123456',
        'sub_sample123456'
    );
    
    -- Insert modules
    INSERT INTO modules (id, name, description, is_active, is_core, version)
    VALUES
        (uuid_generate_v4(), 'CRM', 'Customer Relationship Management', TRUE, TRUE, '1.0.0'),
        (uuid_generate_v4(), 'HRM', 'Human Resource Management', TRUE, TRUE, '1.0.0'),
        (uuid_generate_v4(), 'Analytics', 'Business Analytics and Reporting', TRUE, FALSE, '1.0.0'),
        (uuid_generate_v4(), 'Billing', 'Billing and Invoicing', TRUE, TRUE, '1.0.0');
        
    -- Assign modules to tenant
    INSERT INTO tenant_modules (tenant_id, module_id)
    SELECT tenant_id, id FROM modules;
    
    -- Log the tenant creation
    INSERT INTO audit_logs (actor_id, actor_type, tenant_id, action, resource_type, resource_id, new_values)
    VALUES (
        system_admin_id,
        'system_user',
        tenant_id,
        'create',
        'tenant',
        tenant_id,
        jsonb_build_object(
            'name', 'Demo Enterprise',
            'schema_name', 'demoenterprise',
            'package_id', enterprise_id
        )
    );
END $$;
