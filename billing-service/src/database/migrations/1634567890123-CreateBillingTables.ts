import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBillingTables1634567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create plans table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "plans" (
        "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL,
        "description" TEXT,
        "price" DECIMAL(10, 2) NOT NULL,
        "billing_cycle" VARCHAR(10) NOT NULL DEFAULT 'monthly',
        "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
        "trial_days" INTEGER DEFAULT 0,
        "is_public" BOOLEAN NOT NULL DEFAULT TRUE,
        "sort_order" INTEGER DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE
      );
    `);

    // Create plan_features table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "plan_features" (
        "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        "plan_id" UUID NOT NULL,
        "name" VARCHAR(100) NOT NULL,
        "description" TEXT,
        "value" VARCHAR(255),
        "is_highlighted" BOOLEAN DEFAULT FALSE,
        "sort_order" INTEGER DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "fk_plan_features_plan_id" FOREIGN KEY ("plan_id") REFERENCES "plans" ("id") ON DELETE CASCADE
      );
    `);

    // Create subscriptions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscriptions" (
        "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        "tenant_id" UUID NOT NULL,
        "plan_id" UUID NOT NULL,
        "start_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "end_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'active',
        "renewal_type" VARCHAR(10) NOT NULL DEFAULT 'auto',
        "payment_gateway" VARCHAR(20),
        "external_subscription_id" VARCHAR(100),
        "external_customer_id" VARCHAR(100),
        "cancel_at_period_end" BOOLEAN DEFAULT FALSE,
        "canceled_at" TIMESTAMP WITH TIME ZONE,
        "trial_end_date" TIMESTAMP WITH TIME ZONE,
        "last_billing_date" TIMESTAMP WITH TIME ZONE,
        "next_billing_date" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "fk_subscriptions_plan_id" FOREIGN KEY ("plan_id") REFERENCES "plans" ("id")
      );
    `);

    // Create invoices table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoices" (
        "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        "subscription_id" UUID NOT NULL,
        "tenant_id" UUID NOT NULL,
        "invoice_number" VARCHAR(50) NOT NULL,
        "amount" DECIMAL(10, 2) NOT NULL,
        "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
        "issue_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "due_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "paid_date" TIMESTAMP WITH TIME ZONE,
        "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
        "description" TEXT,
        "notes" TEXT,
        "external_invoice_id" VARCHAR(100),
        "tax_amount" DECIMAL(10, 2) DEFAULT 0,
        "tax_rate" DECIMAL(5, 2) DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "fk_invoices_subscription_id" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions" ("id")
      );
    `);

    // Create invoice_items table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoice_items" (
        "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        "invoice_id" UUID NOT NULL,
        "description" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "unit_price" DECIMAL(10, 2) NOT NULL,
        "amount" DECIMAL(10, 2) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT "fk_invoice_items_invoice_id" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE CASCADE
      );
    `);

    // Create payments table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        "invoice_id" UUID NOT NULL,
        "tenant_id" UUID NOT NULL,
        "amount" DECIMAL(10, 2) NOT NULL,
        "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
        "payment_method" VARCHAR(20) NOT NULL,
        "payment_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
        "external_payment_id" VARCHAR(100),
        "external_customer_id" VARCHAR(100),
        "payment_gateway" VARCHAR(20) NOT NULL,
        "last_four" VARCHAR(4),
        "card_type" VARCHAR(20),
        "refunded_amount" DECIMAL(10, 2) DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT "fk_payments_invoice_id" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id")
      );
    `);

    // Create usage table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "usage" (
        "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        "tenant_id" UUID NOT NULL,
        "subscription_id" UUID NOT NULL,
        "resource_type" VARCHAR(50) NOT NULL,
        "quantity" INTEGER NOT NULL,
        "recorded_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "description" TEXT,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT "fk_usage_subscription_id" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions" ("id")
      );
    `);

    // Insert seed data for plans
    await queryRunner.query(`
      INSERT INTO "plans" (id, name, description, price, billing_cycle, is_active, trial_days, is_public, sort_order)
      VALUES 
        (uuid_generate_v4(), 'Basic', 'Basic plan for small businesses', 29.99, 'monthly', true, 14, true, 1),
        (uuid_generate_v4(), 'Professional', 'Professional plan with advanced features', 99.99, 'monthly', true, 14, true, 2),
        (uuid_generate_v4(), 'Enterprise', 'Enterprise plan for large organizations', 199.99, 'monthly', true, 30, true, 3);
    `);

    // Get the inserted plan IDs
    const basicPlanId = await queryRunner.query(`SELECT id FROM plans WHERE name = 'Basic' LIMIT 1;`);
    const professionalPlanId = await queryRunner.query(`SELECT id FROM plans WHERE name = 'Professional' LIMIT 1;`);
    const enterprisePlanId = await queryRunner.query(`SELECT id FROM plans WHERE name = 'Enterprise' LIMIT 1;`);

    // Insert plan features for Basic plan
    await queryRunner.query(`
      INSERT INTO "plan_features" (plan_id, name, description, value, is_highlighted, sort_order)
      VALUES 
        ('${basicPlanId[0].id}', 'Users', 'Number of users allowed', '5', true, 1),
        ('${basicPlanId[0].id}', 'Storage', 'Storage limit', '10GB', true, 2),
        ('${basicPlanId[0].id}', 'Support', 'Support level', 'Email', false, 3),
        ('${basicPlanId[0].id}', 'API calls', 'Monthly API calls', '10,000', false, 4);
    `);

    // Insert plan features for Professional plan
    await queryRunner.query(`
      INSERT INTO "plan_features" (plan_id, name, description, value, is_highlighted, sort_order)
      VALUES 
        ('${professionalPlanId[0].id}', 'Users', 'Number of users allowed', '20', true, 1),
        ('${professionalPlanId[0].id}', 'Storage', 'Storage limit', '50GB', true, 2),
        ('${professionalPlanId[0].id}', 'Support', 'Support level', 'Priority Email', true, 3),
        ('${professionalPlanId[0].id}', 'API calls', 'Monthly API calls', '100,000', false, 4),
        ('${professionalPlanId[0].id}', 'Custom domain', 'Use your own domain', 'Yes', true, 5);
    `);

    // Insert plan features for Enterprise plan
    await queryRunner.query(`
      INSERT INTO "plan_features" (plan_id, name, description, value, is_highlighted, sort_order)
      VALUES 
        ('${enterprisePlanId[0].id}', 'Users', 'Number of users allowed', 'Unlimited', true, 1),
        ('${enterprisePlanId[0].id}', 'Storage', 'Storage limit', '500GB', true, 2),
        ('${enterprisePlanId[0].id}', 'Support', 'Support level', '24/7 Phone & Email', true, 3),
        ('${enterprisePlanId[0].id}', 'API calls', 'Monthly API calls', 'Unlimited', true, 4),
        ('${enterprisePlanId[0].id}', 'Custom domain', 'Use your own domain', 'Yes', false, 5),
        ('${enterprisePlanId[0].id}', 'Dedicated instance', 'Get your own dedicated instance', 'Yes', true, 6),
        ('${enterprisePlanId[0].id}', 'SLA', 'Service Level Agreement', '99.9% uptime', true, 7);
    `);

    // Create indexes for better performance
    await queryRunner.query(`CREATE INDEX idx_subscriptions_tenant_id ON subscriptions(tenant_id);`);
    await queryRunner.query(`CREATE INDEX idx_subscriptions_status ON subscriptions(status);`);
    await queryRunner.query(`CREATE INDEX idx_invoices_tenant_id ON invoices(tenant_id);`);
    await queryRunner.query(`CREATE INDEX idx_invoices_status ON invoices(status);`);
    await queryRunner.query(`CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);`);
    await queryRunner.query(`CREATE INDEX idx_payments_status ON payments(status);`);
    await queryRunner.query(`CREATE INDEX idx_usage_tenant_id ON usage(tenant_id);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "usage";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoice_items";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "plan_features";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "plans";`);
  }
}
