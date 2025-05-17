# To-Do List để Triển Khai Hệ Thống Multi-Tenant

## 1. Tổng Quan
To-Do List chia nhỏ các công việc để triển khai hệ thống **multi-tenant** với **NestJS**, **React**, **PostgreSQL**, **MongoDB**, **Redis**, và **Docker**. Hệ thống hỗ trợ subdomain (`schema_name.example.com`), tên miền chính (`customerdomain.com`), và System Admin qua `example.com`. Quản lý Domain thuộc về System Level.

## 2. To-Do List

### 2.1. Database (PostgreSQL & MongoDB)
- [ ] **Task 1: Tạo System Database (system_db)**  
  - Tạo database `system_db` trong PostgreSQL.  
  - Tạo các bảng: `tenants`, `packages`, `modules`, `tenant_modules`, `system_users`, `domains`.  
  - Thêm index trên `schema_name`, `domain_name`, `email`, `name`, `status`, `tenant_id`.  
  - Tạo dữ liệu mẫu: 1 System Admin, 2 gói, 3 module, 1 tenant với subdomain và tên miền chính.

- [ ] **Task 2: Tạo Hàm Tạo Schema Tenant**  
  - Viết hàm SQL `create_tenant_schema` để tạo schema `tenant_<schema_name>`.  
  - Tạo bảng `users`, `roles`, `user_data` trong schema.  
  - Thêm index và khóa ngoại.  
  - Tạo dữ liệu mẫu cho `roles` (admin, manager, staff, user).

- [ ] **Task 3: Cấu Hình MongoDB**  
  - Tạo database `multi_tenant` trong MongoDB.  
  - Tạo collection `system_logs`, `module_configs`.  
  - Thêm index trên `tenant_id`, `schema_name`, `timestamp`, `module_id`.  
  - Tạo dữ liệu mẫu cho `system_logs`.

### 2.2. Backend (NestJS)
- [ ] **Task 4: Cài Đặt NestJS Project**  
  - Khởi tạo dự án NestJS.  
  - Cài đặt package: `@nestjs/jwt`, `@nestjs/typeorm`, `@nestjs/mongoose`, `redis`.  
  - Cấu hình `.env` cho PostgreSQL, MongoDB, Redis.

- [ ] **Task 5: Cấu Hình Database Connections**  
  - Cấu hình TypeORM cho PostgreSQL với 2 connection: `system` (system_db), `tenant` (schema động).  
  - Cấu hình Mongoose cho MongoDB.  
  - Viết service để chuyển đổi schema tenant.

- [ ] **Task 6: Tạo Entities/Models**  
  - System Entities: `Tenant`, `Package`, `Module`, `TenantModule`, `SystemUser`, `Domain`.  
  - Tenant Entities: `User`, `Role`, `UserData`.  
  - MongoDB Models: `SystemLog`, `ModuleConfig`.

- [ ] **Task 7: Tạo Guards**  
  - **DomainGuard**: Kiểm tra hostname, ánh xạ `domain_name` tới `tenant_id`, `schema_name`.  
  - **RoleGuard**: Kiểm tra vai trò (`system_admin`, `tenant_admin`, v.v.).  
  - **JwtGuard**: Xác thực JWT.

- [ ] **Task 8: Tạo API Authentication**  
  - Endpoint `/auth/login`:  
    - Đăng nhập System Admin (`example.com`, `system_users`).  
    - Đăng nhập Tenant User (`schema_name.example.com` hoặc `customerdomain.com`, `users`).  
  - Endpoint `/auth/refresh`, `/auth/logout`.

- [ ] **Task 9: Tạo System Level APIs**  
  - **Tenants**: `POST`, `GET`, `PUT`, `DELETE` cho `tenants`.  
  - **Packages**, **Modules**, **System Users**: CRUD endpoints.  
  - **Tenant Modules**: `POST /system/tenant-modules` để bật/tắt module.  
  - **Domains**: `POST`, `GET`, `PUT` (xác minh DNS), `DELETE` cho `domains`.

- [ ] **Task 10: Tạo Tenant Level APIs**  
  - **Users**, **Roles**: CRUD endpoints.  
  - **Module Config**: `GET`, `PUT` để tùy chỉnh module.  
  - Kiểm tra `domain_name` trước khi xử lý.

- [ ] **Task 11: Tạo User Level APIs**  
  - `GET /user/services`, `POST /user/services/{module_id}`, `PUT /user/services/{module_id}/{id}`.  
  - Kiểm tra quyền qua `roles.permissions`.

- [ ] **Task 12: Tạo Services**  
  - **DatabaseService**: Tạo, chuyển schema tenant.  
  - **LogService**: Ghi log vào MongoDB.  
  - **DnsService**: Placeholder cho API DNS (System Level).

- [ ] **Task 13: Tích Hợp Redis**  
  - Cache module, cấu hình tenant.  
  - Lưu JWT token.  
  - Sử dụng queue cho tác vụ nặng (tạo schema, xác minh DNS).

### 2.3. Frontend (React)
- [ ] **Task 14: Cài Đặt React Project**  
  - Khởi tạo dự án React với Vite.  
  - Cài đặt: `react-router-dom`, `axios`, `@mui/material`.

- [ ] **Task 15: Tạo Components**  
  - System: `TenantList`, `PackageManager`, `ModuleManager`, `DomainManager`.  
  - Tenant: `UserManager`, `RoleManager`, `ModuleConfig`.  
  - User: `ServiceDashboard`.

- [ ] **Task 16: Tạo Routes**  
  - System: `/system/*` (`example.com`).  
  - Tenant/User: `/tenant/*`, `/user/*` (`schema_name.example.com` hoặc `customerdomain.com`).

- [ ] **Task 17: Tích Hợp API**  
  - Cấu hình `axios` với header `X-Domain`.  
  - Xử lý đăng nhập và gọi API với token.

### 2.4. Infrastructure
- [ ] **Task 18: Cấu Hình Docker**  
  - Tạo `docker-compose.yml` cho NestJS, React, PostgreSQL, MongoDB, Redis.

- [ ] **Task 19: Cấu Hình Nginx**  
  - Wildcard subdomain (`*.example.com`).  
  - Chuyển header `X-Domain`.

- [ ] **Task 20: Cấu Hình DNS**  
  - Wildcard DNS (`*.example.com`).  
  - Placeholder cho API DNS.

### 2.5. Testing
- [ ] **Task 21: Unit Tests**  
  - Test API CRUD và guards.  
- [ ] **Task 22: Integration Tests**  
  - Test luồng tạo tenant, đăng nhập, truy cập dịch vụ.  
- [ ] **Task 23: Performance Tests**  
  - Test truy vấn PostgreSQL, cache Redis, log MongoDB.

## 3. Ưu Tiên và Thời Gian
- **Giai đoạn 1 (Database & Backend Core)**: Task 1-8 (2-3 ngày).  
- **Giai đoạn 2 (API & Services)**: Task 9-13 (3-4 ngày).  
- **Giai đoạn 3 (Frontend)**: Task 14-17 (2-3 ngày).  
- **Giai đoạn 4 (Infrastructure)**: Task 18-20 (1-2 ngày).  
- **Giai đoạn 5 (Testing)**: Task 21-23 (2-3 ngày).

## 4. Lưu Ý
- Kiểm tra `schema_name`, `domain_name` duy nhất.  
- Soft delete cho tenant, user.  
- Log mọi hành động quan trọng vào MongoDB.  
- Quản lý Domain chỉ ở System Level, cần tích hợp DNS provider.