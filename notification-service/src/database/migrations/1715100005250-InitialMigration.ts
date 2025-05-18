import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1715100005250 implements MigrationInterface {
  name = 'InitialMigration1715100005250';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create tenants table
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "settings" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_tenants_code" UNIQUE ("code"),
        CONSTRAINT "PK_tenants" PRIMARY KEY ("id")
      )
    `);

    // Create templates table
    await queryRunner.query(`
      CREATE TABLE "templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" character varying NOT NULL,
        "supportedChannels" "public"."templates_supportedchannels_enum" array NOT NULL DEFAULT '{email}',
        "emailSubject" text,
        "emailHtmlContent" text,
        "emailTextContent" text,
        "pushTitle" text,
        "pushBody" text,
        "smsContent" text,
        "inAppTitle" text,
        "inAppContent" text,
        "defaultVariables" jsonb,
        "isActive" boolean NOT NULL DEFAULT true,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_templates" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_templates_tenantId" ON "templates" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_templates_code" ON "templates" ("code")`);

    // Create notifications table
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "userId" uuid,
        "userEmail" character varying,
        "userPhone" character varying,
        "userDeviceToken" character varying,
        "templateId" uuid,
        "subject" character varying(255) NOT NULL,
        "content" text NOT NULL,
        "channels" "public"."notifications_channels_enum" array NOT NULL DEFAULT '{email}',
        "status" "public"."notifications_status_enum" NOT NULL DEFAULT 'pending',
        "priority" "public"."notifications_priority_enum" NOT NULL DEFAULT 'normal',
        "metadata" jsonb,
        "deliveryAttempts" jsonb,
        "scheduledFor" TIMESTAMP,
        "deliveredAt" TIMESTAMP,
        "readAt" TIMESTAMP,
        "retryCount" integer NOT NULL DEFAULT 0,
        "externalId" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_tenantId" ON "notifications" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_userId" ON "notifications" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_status" ON "notifications" ("status")`);

    // Create notification_deliveries table
    await queryRunner.query(`
      CREATE TABLE "notification_deliveries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "notificationId" uuid NOT NULL,
        "channel" "public"."notification_deliveries_channel_enum" NOT NULL,
        "delivered" boolean NOT NULL DEFAULT false,
        "read" boolean NOT NULL DEFAULT false,
        "deliveredAt" TIMESTAMP,
        "readAt" TIMESTAMP,
        "attemptCount" integer NOT NULL DEFAULT 0,
        "attemptDetails" jsonb,
        "externalId" character varying,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_deliveries" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_notification_deliveries_notificationId" ON "notification_deliveries" ("notificationId")`);

    // Create notification_preferences table
    await queryRunner.query(`
      CREATE TABLE "notification_preferences" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "categoryCode" character varying,
        "enabledChannels" "public"."notification_preferences_enabledchannels_enum" array NOT NULL DEFAULT '{email,in_app}',
        "isEnabled" boolean NOT NULL DEFAULT true,
        "email" character varying,
        "phone" character varying,
        "deviceTokens" text array NOT NULL DEFAULT '{}',
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_preferences" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_notification_preferences_tenantId" ON "notification_preferences" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_notification_preferences_userId" ON "notification_preferences" ("userId")`);

    // Create in_app_notifications table
    await queryRunner.query(`
      CREATE TABLE "in_app_notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "notificationId" uuid,
        "title" character varying NOT NULL,
        "body" text NOT NULL,
        "link" character varying,
        "read" boolean NOT NULL DEFAULT false,
        "readAt" TIMESTAMP,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_in_app_notifications" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_in_app_notifications_tenantId" ON "in_app_notifications" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_in_app_notifications_userId" ON "in_app_notifications" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_in_app_notifications_read" ON "in_app_notifications" ("read")`);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "templates" 
      ADD CONSTRAINT "FK_templates_tenantId"
      FOREIGN KEY ("tenantId") 
      REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications" 
      ADD CONSTRAINT "FK_notifications_tenantId"
      FOREIGN KEY ("tenantId") 
      REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications" 
      ADD CONSTRAINT "FK_notifications_templateId"
      FOREIGN KEY ("templateId") 
      REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "notification_deliveries" 
      ADD CONSTRAINT "FK_notification_deliveries_notificationId"
      FOREIGN KEY ("notificationId") 
      REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "notification_preferences" 
      ADD CONSTRAINT "FK_notification_preferences_tenantId"
      FOREIGN KEY ("tenantId") 
      REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "in_app_notifications" 
      ADD CONSTRAINT "FK_in_app_notifications_tenantId"
      FOREIGN KEY ("tenantId") 
      REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "in_app_notifications" 
      ADD CONSTRAINT "FK_in_app_notifications_notificationId"
      FOREIGN KEY ("notificationId") 
      REFERENCES "notifications"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE "in_app_notifications" DROP CONSTRAINT "FK_in_app_notifications_notificationId"`);
    await queryRunner.query(`ALTER TABLE "in_app_notifications" DROP CONSTRAINT "FK_in_app_notifications_tenantId"`);
    await queryRunner.query(`ALTER TABLE "notification_preferences" DROP CONSTRAINT "FK_notification_preferences_tenantId"`);
    await queryRunner.query(`ALTER TABLE "notification_deliveries" DROP CONSTRAINT "FK_notification_deliveries_notificationId"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_templateId"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_tenantId"`);
    await queryRunner.query(`ALTER TABLE "templates" DROP CONSTRAINT "FK_templates_tenantId"`);
    
    // Drop tables
    await queryRunner.query(`DROP TABLE "in_app_notifications"`);
    await queryRunner.query(`DROP TABLE "notification_preferences"`);
    await queryRunner.query(`DROP TABLE "notification_deliveries"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "templates"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
  }
}
