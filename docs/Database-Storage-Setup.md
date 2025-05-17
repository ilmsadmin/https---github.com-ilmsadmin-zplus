# Database & Storage Setup cho Hệ thống Multi-Tenant

Thư mục này chứa các script cần thiết để thiết lập và cấu hình phần Database & Storage cho hệ thống multi-tenant theo phần 2.1 trong tài liệu to-do.

## Tổng quan về Database và Storage

Hệ thống multi-tenant sử dụng:
- **PostgreSQL**: Database chính, với schema-per-tenant model cho data isolation
- **MongoDB**: Lưu trữ logs, analytics, và dữ liệu phi cấu trúc
- **MinIO/S3**: Object storage cho lưu trữ tập tin và media
- **Redis**: Caching, session management, pub/sub và rate limiting

## Cấu trúc Script

```
scripts/
├── postgres/
│   ├── 01_system_database_setup.sql    # Tạo system database
│   ├── 02_sample_data.sql              # Dữ liệu mẫu
│   ├── 03_postgresql_tenant_schema.sql # Hàm tạo schema tenant
├── mongodb/
│   ├── 04_mongodb_setup.js             # Thiết lập MongoDB
├── minio/
│   ├── 05_minio_setup.sh               # Thiết lập MinIO
└── redis/
    └── 06_redis_setup.sh               # Thiết lập Redis
```

## Hướng dẫn Cài đặt và Triển khai

### 1. PostgreSQL Setup

#### 1.1. Tạo System Database và Schemas

```bash
psql -U postgres -f scripts/postgres/01_system_database_setup.sql
```

Lệnh này sẽ:
- Tạo database `system_db`
- Tạo các bảng: `tenants`, `packages`, `modules`, `tenant_modules`, `system_users`, `domains`, `billing`, `audit_logs`
- Thiết lập index và foreign keys

#### 1.2. Thêm Dữ liệu Mẫu

```bash
psql -U postgres -f scripts/postgres/02_sample_data.sql
```

#### 1.3. Cài đặt Hàm Tạo Tenant Schema

```bash
psql -U postgres -d system_db -f scripts/postgres/03_postgresql_tenant_schema.sql
```

Hàm này tạo schema mới cho mỗi tenant với:
- Bảng `users` và `roles` mở rộng với MFA, themes, language
- Bảng `teams` và `team_members` cho collaboration
- Bảng `notifications` cho thông báo trong ứng dụng
- Bảng `custom_fields` cho tùy chỉnh fields
- Phân cấp quyền (hierarchical permissions) với `parent_role_id`

### 2. MongoDB Setup

```bash
mongo scripts/mongodb/04_mongodb_setup.js
```

Script này sẽ:
- Tạo database `multi_tenant`
- Thiết lập các collections: `system_logs`, `analytics_data`, `module_configs`, `user_events`
- Tạo time-series collection `performance_metrics` để lưu trữ metrics
- Thiết lập indexes và TTL (Time To Live) cho mỗi loại dữ liệu

### 3. MinIO/S3 Setup

```bash
bash scripts/minio/05_minio_setup.sh
```

Script này sẽ:
- Tạo bucket riêng cho từng tenant: `tenant1-files`, `tenant1-media`, v.v.
- Thiết lập lifecycle policies (tự động xóa dữ liệu cũ)
- Thiết lập access controls tách biệt cho mỗi tenant
- Cấu hình CDN integration cho static assets

### 4. Redis Setup

```bash
bash scripts/redis/06_redis_setup.sh
```

Script này sẽ:
- Thiết lập Redis cho caching, session management và pub/sub
- Tạo namespace theo tenant để đảm bảo dữ liệu isolation
- Cấu hình Redis Sentinel cho high availability
- Thiết lập key expiration policies cho mỗi loại dữ liệu

## Kiểm tra và Xác minh

### PostgreSQL

```bash
psql -U postgres -d system_db -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'"
```

### MongoDB

```bash
mongo --eval "db.adminCommand('listDatabases')"
```

### MinIO/S3

```bash
mc ls myminio/
```

### Redis

```bash
redis-cli keys '*'
```

## Tenant Isolation và Best Practices

1. **PostgreSQL Isolation**: Sử dụng schema-per-tenant và kết nối riêng cho mỗi tenant
2. **MongoDB Isolation**: Thêm `tenant_id` vào mỗi document và sử dụng index
3. **MinIO/S3 Isolation**: Tạo bucket riêng cho mỗi tenant với policy riêng
4. **Redis Isolation**: Sử dụng namespace prefix (tenant_id:key_type:key)

## Chiến lược Backup và Recovery

1. **PostgreSQL**:
   - WAL archiving cho point-in-time recovery
   - Backup định kỳ schema hệ thống và schema của từng tenant

2. **MongoDB**:
   - Replica set cho high availability
   - Backup định kỳ với mongodump

3. **MinIO/S3**:
   - Versioning cho file recovery
   - Cross-region replication (nếu sử dụng AWS S3)

4. **Redis**:
   - Redis Sentinel/Cluster cho high availability
   - AOF persistence cho recovery

## Hiệu suất và Scalability

1. **PostgreSQL**:
   - Connection pooling (PgBouncer)
   - Sharding theo tenant (đặt tenant ở nhiều database server)

2. **MongoDB**:
   - Index optimization cho queries
   - Sharding dựa trên tenant_id

3. **MinIO/S3**:
   - CDN cho static assets
   - Read-after-write consistency

4. **Redis**:
   - Redis Cluster cho scalability
   - Eviction policies phù hợp

## Lưu ý quan trọng

1. **Security**:
   - Đổi các mật khẩu mặc định trong script
   - Sử dụng encryption at rest và in transit
   - Thiết lập firewall rules cho mỗi database server

2. **Performance**:
   - Monitor query performance thường xuyên
   - Optimize indexes dựa trên usage patterns

3. **Compliance**:
   - Thiết lập data retention policies phù hợp GDPR
   - Lưu audit trails cho mọi thay đổi dữ liệu
