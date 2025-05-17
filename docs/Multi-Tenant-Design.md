# Thiết Kế Hệ Thống Multi-Tenant

## 1. Công Nghệ Sử Dụng
- NestJS
- React
- PostgreSQL
- MongoDB
- Redis
- Nginx
- Docker

## 2. Tính Năng Chi Tiết

### 2.1. System Level
**Mô tả**: Quản lý toàn bộ hệ thống, bao gồm tenant, gói dịch vụ, module, domain, và System User. System Admin truy cập qua `example.com` mà không cần `tenant_id` hoặc `schema_name`.

**Tính năng**:
1. **Quản lý Tenant**:
   - Tạo tenant với `name`, `schema_name` (duy nhất, dùng cho subdomain), `package_id`.
   - Cập nhật thông tin tenant (tên, gói, trạng thái: active/suspended/deleted).
   - Xóa tenant (soft delete, đánh dấu `status = deleted`).
   - Xem danh sách tenant, lọc theo trạng thái hoặc gói.
2. **Quản lý Gói Dịch Vụ**:
   - Tạo, sửa, xóa gói (Basic, Pro, Enterprise) với giới hạn (số user, dung lượng, module).
   - Xem danh sách gói và chi tiết.
3. **Quản lý Module**:
   - Tạo, sửa, xóa module (CRM, HRM, Analytics).
   - Bật/tắt module cho tenant.
4. **Quản lý Domain**:
   - Tạo subdomain mặc định (`schema_name.example.com`) khi tạo tenant.
   - Thêm tên miền chính của tenant (`customerdomain.com`) với xác minh DNS.
   - Cập nhật trạng thái domain (pending, active, disabled).
   - Xóa domain (không ảnh hưởng schema).
5. **Quản lý System User**:
   - Tạo, sửa, xóa System Admin/Manager, gán vai trò.
   - Xem danh sách System User.
6. **Báo cáo**:
   - Xem số tenant, user, module đang hoạt động.
   - Theo dõi log hệ thống.

### 2.2. Tenant Level
**Mô tả**: Quản lý user và quyền trong tenant, truy cập qua `schema_name.example.com` hoặc `customerdomain.com`.

**Tính năng (Cập nhật)**:
1. **Quản lý User**:
   - Tạo, sửa, xóa user trong tenant.
   - Gán vai trò (Admin, Manager, Staff, User).
2. **Quản lý Vai Trò**:
   - Tạo, sửa, xóa vai trò với quyền (JSONB: `{"crm": ["read", "write"]}`).
   - Gán quyền cho vai trò.
3. **Cấu hình Module**:
   - Tùy chỉnh module (theme, settings) nếu được bật bởi System Admin.
4. **Báo cáo**:
   - Thống kê user, giao dịch trong tenant.

**Lưu ý**: Quản lý Domain (thêm/xóa tên miền chính, xác minh DNS) đã được chuyển về System Level, Tenant Admin không có quyền này.

### 2.3. User Level
**Mô tả**: Người dùng cuối sử dụng dịch vụ qua `schema_name.example.com` hoặc `customerdomain.com`.

**Tính năng**:
1. **Sử dụng Dịch Vụ**:
   - Truy cập module (CRM, HRM, Analytics) theo quyền.
   - Thực hiện hành động (tạo ticket, xem báo cáo).
2. **Quản lý Profile**:
   - Xem/sửa thông tin cá nhân (username, email).
3. **Xem Lịch Sử**:
   - Xem lịch sử giao dịch trong module.

## 3. Luồng Xử Lý Dữ Liệu

### 3.1. Tạo Tenant
1. System Admin gửi `name`, `schema_name`, `package_id`.
2. Kiểm tra:
   - `schema_name` duy nhất, hợp lệ (chữ thường, số, dấu gạch ngang).
   - `package_id` tồn tại.
3. Lưu tenant vào `tenants`.
4. Tạo schema `tenant_<schema_name>` trong PostgreSQL.
5. Tạo bản ghi trong `domains` (`schema_name.example.com`, `is_default = true`, `status = active`).
6. Gán module mặc định vào `tenant_modules`.
7. Ghi log vào MongoDB.

### 3.2. Thêm Tên Miền Chính
1. System Admin gửi `domain_name` (ví dụ: `customerdomain.com`) cho tenant.
2. Kiểm tra `domain_name` duy nhất trong `domains`.
3. Tạo bản ghi trong `domains` (`status = pending`, `is_default = false`).
4. Hệ thống yêu cầu tenant thêm DNS record (TXT/CNAME) để xác minh.
5. Sau xác minh, System Admin cập nhật `status = active`.
6. Ghi log vào MongoDB.

### 3.3. Đăng Nhập
- **System Admin**:
  1. Truy cập `example.com`, gửi email/password.
  2. Xác thực qua `system_users`.
  3. Trả về token không gắn `tenant_id` hoặc `schema_name`.
- **Tenant User**:
  1. Truy cập `schema_name.example.com` hoặc `customerdomain.com`.
  2. Kiểm tra `domain_name` trong `domains`, lấy `tenant_id`, `schema_name`.
  3. Chuyển kết nối tới schema `tenant_<schema_name>`.
  4. Xác thực qua `users`.

### 3.4. Truy Cấp Dịch Vụ
1. User truy cập qua `schema_name.example.com` hoặc `customerdomain.com`.
2. Kiểm tra `domain_name` trong `domains`, lấy `schema_name`.
3. Chuyển kết nối tới schema `tenant_<schema_name>`.
4. Kiểm tra quyền user qua `roles.permissions`.

### 3.5. Xử Lý Yêu Cầu
1. Kiểm tra hostname (`example.com`, `schema_name.example.com`, `customerdomain.com`).
2. Nếu hostname là `example.com`, sử dụng System DB.
3. Nếu hostname là subdomain hoặc tên miền chính, tra cứu `domains` để lấy `tenant_id`, `schema_name`, và chuyển kết nối schema.

## 4. Bảo Mật và Tối Ưu
- **Data Isolation**: Schema-per-Tenant, kiểm tra `domain_name` trong `domains`.
- **Authentication**: JWT cho System và Tenant User.
- **Authorization**: RBAC với quyền JSONB trong `roles`.
- **DNS Verification**: Yêu cầu TXT/CNAME cho tên miền chính, do System Admin quản lý.
- **Caching**: Redis cho danh sách module và cấu hình tenant.
- **Soft Delete**: `status = deleted` cho tenant.