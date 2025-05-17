#!/bin/pwsh
# filepath: d:\www\multi-tenant\scripts\setup_all_databases.ps1
# Script tự động thiết lập tất cả các database và storage cho hệ thống multi-tenant

Write-Host "Starting Multi-Tenant Database & Storage Setup..." -ForegroundColor Cyan
Write-Host "--------------------------------------------" -ForegroundColor Cyan

# 1. PostgreSQL Setup
Write-Host "`n[1/4] Setting up PostgreSQL database..." -ForegroundColor Green

# Kiểm tra PostgreSQL đã được cài đặt
$pgCheck = (Get-Command psql -ErrorAction SilentlyContinue)
if (!$pgCheck) {
    Write-Host "PostgreSQL không được tìm thấy. Vui lòng cài đặt PostgreSQL và thêm vào PATH." -ForegroundColor Red
    exit 1
}

# Kiểm tra kết nối PostgreSQL
try {
    Write-Host "Kiểm tra kết nối PostgreSQL..." -ForegroundColor Yellow
    psql -c "SELECT version();" -U postgres
} catch {
    Write-Host "Không thể kết nối tới PostgreSQL. Vui lòng kiểm tra PostgreSQL đang chạy và quyền truy cập." -ForegroundColor Red
    exit 1
}

# Thực thi các script PostgreSQL
Write-Host "Tạo system database và cấu trúc bảng..." -ForegroundColor Yellow
psql -U postgres -f "d:\www\multi-tenant\scripts\postgres\01_system_database_setup.sql"

Write-Host "Thêm dữ liệu mẫu..." -ForegroundColor Yellow
psql -U postgres -f "d:\www\multi-tenant\scripts\postgres\02_sample_data.sql"

Write-Host "Cài đặt hàm tạo schema tenant..." -ForegroundColor Yellow
psql -U postgres -d system_db -f "d:\www\multi-tenant\scripts\postgres\03_postgresql_tenant_schema.sql"

Write-Host "Thực hiện database migration nếu cần..." -ForegroundColor Yellow
psql -U postgres -f "d:\www\multi-tenant\scripts\postgres\07_database_migration.sql"

# 2. MongoDB Setup
Write-Host "`n[2/4] Setting up MongoDB..." -ForegroundColor Green

# Kiểm tra MongoDB đã được cài đặt
$mongoCheck = (Get-Command mongo -ErrorAction SilentlyContinue)
if (!$mongoCheck) {
    Write-Host "MongoDB không được tìm thấy. Vui lòng cài đặt MongoDB và thêm vào PATH." -ForegroundColor Red
    Write-Host "Bỏ qua thiết lập MongoDB, tiếp tục với các bước khác..." -ForegroundColor Yellow
} else {
    Write-Host "Thiết lập MongoDB collections, indexes, và TTL..." -ForegroundColor Yellow
    mongo "d:\www\multi-tenant\scripts\mongodb\04_mongodb_setup.js"
}

# 3. MinIO/S3 Setup
Write-Host "`n[3/4] Setting up MinIO/S3..." -ForegroundColor Green

# Kiểm tra MinIO client đã được cài đặt
$mcCheck = (Get-Command mc -ErrorAction SilentlyContinue)
if (!$mcCheck) {
    Write-Host "MinIO client không được tìm thấy. Vui lòng cài đặt mc và thêm vào PATH." -ForegroundColor Red
    Write-Host "Bỏ qua thiết lập MinIO, tiếp tục với các bước khác..." -ForegroundColor Yellow
} else {
    Write-Host "Thiết lập MinIO buckets, policies, và lifecycle rules..." -ForegroundColor Yellow
    # Với PowerShell, cần chạy script bash thông qua WSL hoặc sử dụng PowerShell commands tương đương
    # Ở đây chúng ta giả định có WSL
    bash "d:\www\multi-tenant\scripts\minio\05_minio_setup.sh"
}

# 4. Redis Setup
Write-Host "`n[4/4] Setting up Redis..." -ForegroundColor Green

# Kiểm tra Redis client đã được cài đặt
$redisCheck = (Get-Command redis-cli -ErrorAction SilentlyContinue)
if (!$redisCheck) {
    Write-Host "Redis client không được tìm thấy. Vui lòng cài đặt redis-cli và thêm vào PATH." -ForegroundColor Red
    Write-Host "Bỏ qua thiết lập Redis, tiếp tục với các bước khác..." -ForegroundColor Yellow
} else {
    Write-Host "Thiết lập Redis namespaces và expiration policies..." -ForegroundColor Yellow
    bash "d:\www\multi-tenant\scripts\redis\06_redis_setup.sh"
}

Write-Host "`nMulti-Tenant Database & Storage Setup completed!" -ForegroundColor Cyan
Write-Host "--------------------------------------------" -ForegroundColor Cyan
Write-Host "Vui lòng xem documentation tại d:\www\multi-tenant\docs\Database-Storage-Setup.md để biết thêm chi tiết." -ForegroundColor White
