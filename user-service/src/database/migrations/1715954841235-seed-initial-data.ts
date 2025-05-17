import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class SeedInitialData1715954841235 implements MigrationInterface {
  name = 'SeedInitialData1715954841235';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create default permissions
    const permissionIds = await this.createDefaultPermissions(queryRunner);
    
    // Create default roles with permissions
    const roleIds = await this.createDefaultRoles(queryRunner, permissionIds);
    
    // Create admin user with admin role
    await this.createAdminUser(queryRunner, roleIds.adminRoleId);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove admin user
    await queryRunner.query(`DELETE FROM "users" WHERE "email" = 'admin@example.com'`);
    
    // Remove default roles
    await queryRunner.query(`DELETE FROM "roles" WHERE "name" IN ('admin', 'manager', 'user')`);
    
    // Remove default permissions
    await queryRunner.query(`DELETE FROM "permissions" WHERE "isSystem" = true`);
  }

  private async createDefaultPermissions(queryRunner: QueryRunner): Promise<{ [key: string]: string }> {
    const permissionIds: { [key: string]: string } = {};
    
    // User permissions
    const userPermissions = [
      { name: 'user:create', resource: 'user', action: 'create', description: 'Create users', isSystem: true },
      { name: 'user:read', resource: 'user', action: 'read', description: 'Read users', isSystem: true },
      { name: 'user:update', resource: 'user', action: 'update', description: 'Update users', isSystem: true },
      { name: 'user:delete', resource: 'user', action: 'delete', description: 'Delete users', isSystem: true },
    ];
    
    // Role permissions
    const rolePermissions = [
      { name: 'role:create', resource: 'role', action: 'create', description: 'Create roles', isSystem: true },
      { name: 'role:read', resource: 'role', action: 'read', description: 'Read roles', isSystem: true },
      { name: 'role:update', resource: 'role', action: 'update', description: 'Update roles', isSystem: true },
      { name: 'role:delete', resource: 'role', action: 'delete', description: 'Delete roles', isSystem: true },
    ];
    
    // Permission permissions
    const permissionPermissions = [
      { name: 'permission:create', resource: 'permission', action: 'create', description: 'Create permissions', isSystem: true },
      { name: 'permission:read', resource: 'permission', action: 'read', description: 'Read permissions', isSystem: true },
      { name: 'permission:update', resource: 'permission', action: 'update', description: 'Update permissions', isSystem: true },
      { name: 'permission:delete', resource: 'permission', action: 'delete', description: 'Delete permissions', isSystem: true },
    ];
    
    // Team permissions
    const teamPermissions = [
      { name: 'team:create', resource: 'team', action: 'create', description: 'Create teams', isSystem: true },
      { name: 'team:read', resource: 'team', action: 'read', description: 'Read teams', isSystem: true },
      { name: 'team:update', resource: 'team', action: 'update', description: 'Update teams', isSystem: true },
      { name: 'team:delete', resource: 'team', action: 'delete', description: 'Delete teams', isSystem: true },
    ];
    
    // Setting permissions
    const settingPermissions = [
      { name: 'setting:create', resource: 'setting', action: 'create', description: 'Create settings', isSystem: true },
      { name: 'setting:read', resource: 'setting', action: 'read', description: 'Read settings', isSystem: true },
      { name: 'setting:update', resource: 'setting', action: 'update', description: 'Update settings', isSystem: true },
      { name: 'setting:delete', resource: 'setting', action: 'delete', description: 'Delete settings', isSystem: true },
    ];
    
    const allPermissions = [
      ...userPermissions,
      ...rolePermissions,
      ...permissionPermissions,
      ...teamPermissions,
      ...settingPermissions,
    ];
    
    for (const permission of allPermissions) {
      const result = await queryRunner.query(`
        INSERT INTO "permissions" ("name", "resource", "action", "description", "isSystem")
        VALUES ($1, $2, $3, $4, $5)
        RETURNING "id"
      `, [permission.name, permission.resource, permission.action, permission.description, permission.isSystem]);
      
      permissionIds[permission.name] = result[0].id;
    }
    
    return permissionIds;
  }

  private async createDefaultRoles(
    queryRunner: QueryRunner, 
    permissionIds: { [key: string]: string }
  ): Promise<{ adminRoleId: string; managerRoleId: string; userRoleId: string }> {
    // Create admin role
    const adminResult = await queryRunner.query(`
      INSERT INTO "roles" ("name", "description", "isDefault", "isSystem")
      VALUES ('admin', 'Administrator with full access', false, true)
      RETURNING "id"
    `);
    const adminRoleId = adminResult[0].id;
    
    // Create manager role
    const managerResult = await queryRunner.query(`
      INSERT INTO "roles" ("name", "description", "isDefault", "isSystem")
      VALUES ('manager', 'Manager with elevated access', false, true)
      RETURNING "id"
    `);
    const managerRoleId = managerResult[0].id;
    
    // Create user role
    const userResult = await queryRunner.query(`
      INSERT INTO "roles" ("name", "description", "isDefault", "isSystem")
      VALUES ('user', 'Regular user with basic access', true, true)
      RETURNING "id"
    `);
    const userRoleId = userResult[0].id;
    
    // Assign all permissions to admin role
    for (const permissionId of Object.values(permissionIds)) {
      await queryRunner.query(`
        INSERT INTO "role_permissions" ("role_id", "permission_id")
        VALUES ($1, $2)
      `, [adminRoleId, permissionId]);
    }
    
    // Assign read permissions to manager role
    const managerPermissions = [
      permissionIds['user:read'],
      permissionIds['user:create'],
      permissionIds['user:update'],
      permissionIds['role:read'],
      permissionIds['permission:read'],
      permissionIds['team:read'],
      permissionIds['team:create'],
      permissionIds['team:update'],
      permissionIds['setting:read'],
      permissionIds['setting:create'],
      permissionIds['setting:update'],
    ];
    
    for (const permissionId of managerPermissions) {
      await queryRunner.query(`
        INSERT INTO "role_permissions" ("role_id", "permission_id")
        VALUES ($1, $2)
      `, [managerRoleId, permissionId]);
    }
    
    // Assign basic permissions to user role
    const userPermissions = [
      permissionIds['user:read'],
      permissionIds['team:read'],
      permissionIds['setting:read'],
    ];
    
    for (const permissionId of userPermissions) {
      await queryRunner.query(`
        INSERT INTO "role_permissions" ("role_id", "permission_id")
        VALUES ($1, $2)
      `, [userRoleId, permissionId]);
    }
    
    return { adminRoleId, managerRoleId, userRoleId };
  }

  private async createAdminUser(queryRunner: QueryRunner, adminRoleId: string): Promise<void> {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);
    
    // Create admin user
    const userResult = await queryRunner.query(`
      INSERT INTO "users" (
        "email", "firstName", "lastName", "password", "status", 
        "emailVerified", "jobTitle", "department"
      )
      VALUES (
        'admin@example.com', 'Admin', 'User', $1, 'active',
        true, 'System Administrator', 'IT'
      )
      RETURNING "id"
    `, [hashedPassword]);
    
    const adminUserId = userResult[0].id;
    
    // Assign admin role to admin user
    await queryRunner.query(`
      INSERT INTO "user_roles" ("user_id", "role_id")
      VALUES ($1, $2)
    `, [adminUserId, adminRoleId]);
  }
}
