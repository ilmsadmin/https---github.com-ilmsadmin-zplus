-- Create Billing Service Database Tables

-- Plans Table
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    trial_period_days INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Plan Features Table
CREATE TABLE IF NOT EXISTS plan_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    feature_value VARCHAR(255) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    plan_id UUID NOT NULL REFERENCES plans(id),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'past_due', 'canceled', 'expired')),
    renewal_type VARCHAR(20) NOT NULL DEFAULT 'auto' CHECK (renewal_type IN ('auto', 'manual')),
    canceled_at TIMESTAMP WITH TIME ZONE,
    cancel_reason TEXT,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    external_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    issue_date TIMESTAMP WITH TIME ZONE NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'paid', 'partially_paid', 'overdue', 'canceled', 'void')),
    items JSONB NOT NULL DEFAULT '[]',
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
    discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    pdf_url VARCHAR(255),
    customer_email VARCHAR(255),
    billing_address TEXT,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('credit_card', 'bank_transfer', 'paypal', 'crypto', 'other')),
    transaction_id VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded')),
    payment_provider VARCHAR(50) NOT NULL DEFAULT 'stripe',
    refund_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    refund_date TIMESTAMP WITH TIME ZONE,
    refund_reason TEXT,
    metadata JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Usage Table
CREATE TABLE IF NOT EXISTS usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    recorded_date TIMESTAMP WITH TIME ZONE NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'count',
    source VARCHAR(50),
    user_id UUID,
    description TEXT,
    subscription_id UUID REFERENCES subscriptions(id),
    invoice_id UUID REFERENCES invoices(id),
    billed BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_plan_features_plan_id ON plan_features(plan_id);
CREATE INDEX idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_usage_tenant_id ON usage(tenant_id);
CREATE INDEX idx_usage_resource_type ON usage(resource_type);
CREATE INDEX idx_usage_recorded_date ON usage(recorded_date);
CREATE INDEX idx_usage_billed ON usage(billed);

-- Insert default plans
INSERT INTO plans (name, description, price, billing_cycle, is_active, trial_period_days)
VALUES
  ('Basic', 'Basic plan with essential features', 9.99, 'monthly', TRUE, 14),
  ('Professional', 'Professional plan with advanced features', 29.99, 'monthly', TRUE, 14),
  ('Enterprise', 'Enterprise plan with premium features', 99.99, 'monthly', TRUE, 14),
  ('Basic Annual', 'Basic plan billed annually', 99.99, 'yearly', TRUE, 14),
  ('Professional Annual', 'Professional plan billed annually', 299.99, 'yearly', TRUE, 14),
  ('Enterprise Annual', 'Enterprise plan billed annually', 999.99, 'yearly', TRUE, 14);

-- Insert plan features
INSERT INTO plan_features (plan_id, feature_name, feature_value, is_enabled, description)
SELECT
  id as plan_id,
  'max_users' as feature_name,
  CASE
    WHEN name LIKE 'Basic%' THEN '10'
    WHEN name LIKE 'Professional%' THEN '50'
    WHEN name LIKE 'Enterprise%' THEN 'Unlimited'
  END as feature_value,
  TRUE as is_enabled,
  'Maximum number of users' as description
FROM
  plans;

INSERT INTO plan_features (plan_id, feature_name, feature_value, is_enabled, description)
SELECT
  id as plan_id,
  'storage_gb' as feature_name,
  CASE
    WHEN name LIKE 'Basic%' THEN '5'
    WHEN name LIKE 'Professional%' THEN '50'
    WHEN name LIKE 'Enterprise%' THEN '500'
  END as feature_value,
  TRUE as is_enabled,
  'Storage space in GB' as description
FROM
  plans;

INSERT INTO plan_features (plan_id, feature_name, feature_value, is_enabled, description)
SELECT
  id as plan_id,
  'api_rate_limit' as feature_name,
  CASE
    WHEN name LIKE 'Basic%' THEN '100'
    WHEN name LIKE 'Professional%' THEN '1000'
    WHEN name LIKE 'Enterprise%' THEN '10000'
  END as feature_value,
  TRUE as is_enabled,
  'API requests per minute' as description
FROM
  plans;
