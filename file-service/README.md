# File Service

A comprehensive multi-tenant file management service for storing, organizing, and sharing files securely.

## Overview

The File Service is a core component of the multi-tenant system, providing robust file storage, management, and sharing capabilities with strong security features and tenant isolation.

## Features

- **Multi-tenant Storage**: Complete tenant isolation for file storage
- **Storage Providers**: Support for both MinIO and AWS S3
- **Folder Management**: Create, navigate, and organize files in folder hierarchies
- **File Versioning**: Track and manage multiple versions of files
- **File Sharing**: Share files with other users, teams, or generate public/private links
- **Security Features**:
  - Virus scanning
  - File validation (MIME type checking)
  - File encryption
  - Password-protected shares
- **Performance Optimizations**:
  - Chunked uploads/downloads
  - Pre-signed URLs
  - Configurable caching

## Architecture

The service is built using NestJS framework with TypeORM for database access. It implements a modular architecture with the following key components:

- **Files Module**: Core file management capabilities
- **Folders Module**: Folder organization and hierarchy management
- **Storage Module**: Abstract interface for storage providers
- **Security Module**: File validation, virus scanning, and encryption
- **Sharing Module**: File and folder sharing capabilities

## API Endpoints

### Files

- `POST /files` - Upload a new file
- `POST /files/bulk` - Upload multiple files
- `GET /files` - List files with filtering
- `GET /files/:id` - Get file details
- `GET /files/:id/download` - Download a file
- `GET /files/:id/preview` - Preview a file
- `PUT /files/:id` - Update file metadata
- `DELETE /files/:id` - Delete a file
- `POST /files/:id/version` - Upload a new version of a file
- `GET /files/:id/versions` - List file versions

### Folders

- `POST /folders` - Create a new folder
- `GET /folders` - List folders with filtering
- `GET /folders/:id` - Get folder details
- `PUT /folders/:id` - Update folder metadata
- `PUT /folders/:id/move` - Move a folder to a new location
- `DELETE /folders/:id` - Delete a folder
- `GET /folders/:id/children` - Get folder children
- `GET /folders/:id/ancestry` - Get folder ancestry
- `GET /folders/:id/tree` - Get folder tree

### Sharing

- `POST /shares` - Create a new share
- `GET /shares` - List shares
- `GET /shares/:id` - Get share details
- `PUT /shares/:id` - Update share settings
- `DELETE /shares/:id` - Delete a share
- `GET /shares/public/:accessKey` - Access a public share
- `GET /shares/public/:accessKey/download` - Download from a public share

## Environment Configuration

The service uses environment variables for configuration:

```env
# Server
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=file_service
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_SYNCHRONIZE=true

# Storage
STORAGE_TYPE=minio
STORAGE_BUCKET_PREFIX=tenant-
MAX_FILE_SIZE=100MB

# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# S3 Configuration (if using S3)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Security
FILE_VALIDATION_ENABLED=true
ALLOWED_MIME_TYPES=application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
VIRUS_SCAN_ENABLED=true
VIRUS_SCAN_HOST=localhost
VIRUS_SCAN_PORT=3310
ENCRYPTION_KEY=your-secret-encryption-key

# Authentication
AUTH_JWT_SECRET=your-jwt-secret
AUTH_SERVICE_URL=http://auth-service:3000

# Services Integration
TENANT_SERVICE_URL=http://tenant-service:3000
NOTIFICATION_SERVICE_URL=http://notification-service:3000

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Quota Management
DEFAULT_STORAGE_QUOTA=10GB
```

## Deployment

### Docker

```bash
docker-compose up -d
```

### Kubernetes

Deploy using kubectl:

```bash
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
kubectl apply -f kubernetes/ingress.yaml
kubectl apply -f kubernetes/hpa.yaml
```

## Development

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- MinIO or S3-compatible storage
- ClamAV (optional, for virus scanning)

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the configuration
4. Start the development server:
   ```bash
   npm run start:dev
   ```

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Security Considerations

- All files are stored with tenant isolation
- Files can be encrypted at rest
- Virus scanning is performed on upload
- API endpoints are protected with JWT authentication
- Tenant context is enforced throughout the application

---

# Dịch vụ Quản lý Tệp tin

Dịch vụ quản lý tệp tin đa người thuê toàn diện để lưu trữ, tổ chức và chia sẻ tệp tin một cách an toàn.

## Tổng quan

Dịch vụ File là một thành phần cốt lõi của hệ thống đa người thuê, cung cấp khả năng lưu trữ, quản lý và chia sẻ tệp tin mạnh mẽ với các tính năng bảo mật mạnh mẽ và cách ly giữa các người thuê.

## Tính năng

- **Lưu trữ Đa người thuê**: Cách ly hoàn toàn dữ liệu giữa các người thuê
- **Nhà cung cấp Lưu trữ**: Hỗ trợ cả MinIO và AWS S3
- **Quản lý Thư mục**: Tạo, điều hướng và tổ chức tệp tin trong cấu trúc thư mục
- **Phiên bản Tệp tin**: Theo dõi và quản lý nhiều phiên bản của tệp tin
- **Chia sẻ Tệp tin**: Chia sẻ tệp với người dùng khác, nhóm hoặc tạo liên kết công khai/riêng tư
- **Tính năng Bảo mật**:
  - Quét virus
  - Xác thực tệp tin (kiểm tra loại MIME)
  - Mã hóa tệp tin
  - Chia sẻ được bảo vệ bằng mật khẩu
- **Tối ưu hóa Hiệu suất**:
  - Tải lên/tải xuống theo từng phần
  - URL được ký trước
  - Bộ nhớ đệm có thể cấu hình

## Kiến trúc

Dịch vụ được xây dựng bằng framework NestJS với TypeORM để truy cập cơ sở dữ liệu. Nó triển khai kiến trúc mô-đun với các thành phần chính sau:

- **Mô-đun Files**: Khả năng quản lý tệp tin cốt lõi
- **Mô-đun Folders**: Tổ chức thư mục và quản lý cấu trúc phân cấp
- **Mô-đun Storage**: Giao diện trừu tượng cho các nhà cung cấp lưu trữ
- **Mô-đun Security**: Xác thực tệp tin, quét virus và mã hóa
- **Mô-đun Sharing**: Khả năng chia sẻ tệp tin và thư mục

## API Endpoints

### Files

- `POST /files` - Tải lên tệp tin mới
- `POST /files/bulk` - Tải lên nhiều tệp tin
- `GET /files` - Liệt kê tệp tin với bộ lọc
- `GET /files/:id` - Xem chi tiết tệp tin
- `GET /files/:id/download` - Tải xuống tệp tin
- `GET /files/:id/preview` - Xem trước tệp tin
- `PUT /files/:id` - Cập nhật metadata tệp tin
- `DELETE /files/:id` - Xóa tệp tin
- `POST /files/:id/version` - Tải lên phiên bản mới của tệp tin
- `GET /files/:id/versions` - Liệt kê các phiên bản tệp tin

### Folders

- `POST /folders` - Tạo thư mục mới
- `GET /folders` - Liệt kê thư mục với bộ lọc
- `GET /folders/:id` - Xem chi tiết thư mục
- `PUT /folders/:id` - Cập nhật metadata thư mục
- `PUT /folders/:id/move` - Di chuyển thư mục đến vị trí mới
- `DELETE /folders/:id` - Xóa thư mục
- `GET /folders/:id/children` - Xem các thư mục con
- `GET /folders/:id/ancestry` - Xem cây phả hệ thư mục
- `GET /folders/:id/tree` - Xem cấu trúc cây thư mục

### Sharing

- `POST /shares` - Tạo chia sẻ mới
- `GET /shares` - Liệt kê chia sẻ
- `GET /shares/:id` - Xem chi tiết chia sẻ
- `PUT /shares/:id` - Cập nhật cài đặt chia sẻ
- `DELETE /shares/:id` - Xóa chia sẻ
- `GET /shares/public/:accessKey` - Truy cập chia sẻ công khai
- `GET /shares/public/:accessKey/download` - Tải xuống từ chia sẻ công khai

## Cấu hình Môi trường

Dịch vụ sử dụng biến môi trường để cấu hình:

```env
# Server
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=file_service
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_SYNCHRONIZE=true

# Storage
STORAGE_TYPE=minio
STORAGE_BUCKET_PREFIX=tenant-
MAX_FILE_SIZE=100MB

# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# S3 Configuration (if using S3)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Security
FILE_VALIDATION_ENABLED=true
ALLOWED_MIME_TYPES=application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
VIRUS_SCAN_ENABLED=true
VIRUS_SCAN_HOST=localhost
VIRUS_SCAN_PORT=3310
ENCRYPTION_KEY=your-secret-encryption-key

# Authentication
AUTH_JWT_SECRET=your-jwt-secret
AUTH_SERVICE_URL=http://auth-service:3000

# Services Integration
TENANT_SERVICE_URL=http://tenant-service:3000
NOTIFICATION_SERVICE_URL=http://notification-service:3000

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Quota Management
DEFAULT_STORAGE_QUOTA=10GB
```

## Triển khai

### Docker

```bash
docker-compose up -d
```

### Kubernetes

Triển khai bằng kubectl:

```bash
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
kubectl apply -f kubernetes/ingress.yaml
kubectl apply -f kubernetes/hpa.yaml
```

## Phát triển

### Yêu cầu

- Node.js 18+
- PostgreSQL 14+
- MinIO hoặc bộ lưu trữ tương thích S3
- ClamAV (tùy chọn, để quét virus)

### Thiết lập

1. Clone repository
2. Cài đặt các dependencies:
   ```bash
   npm install
   ```
3. Tạo file `.env` với cấu hình
4. Khởi động server phát triển:
   ```bash
   npm run start:dev
   ```

### Kiểm thử

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Các Cân nhắc Bảo mật

- Tất cả tệp tin được lưu trữ với sự cách ly giữa các người thuê
- Tệp tin có thể được mã hóa tại nơi lưu trữ
- Quét virus được thực hiện khi tải lên
- API endpoints được bảo vệ bằng JWT authentication
- Ngữ cảnh người thuê được thực thi xuyên suốt ứng dụng
