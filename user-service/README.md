# User Service for Multi-Tenant System

## Overview

The User Service is a comprehensive microservice for managing users, roles, permissions, teams, and user settings in a multi-tenant architecture. It provides robust user management capabilities with tenant isolation and integration with other services through event-driven architecture.

## Features

- **User Management**: Create, read, update, delete user accounts with detailed profiles
- **Role-Based Access Control**: Assign roles to users with specific permissions
- **Fine-grained Permissions**: Control access to resources with detailed permission settings
- **Team Management**: Create teams and manage team memberships with hierarchical team structures
- **User Settings**: Store and retrieve user-specific settings
- **Multi-Tenancy**: Complete tenant isolation with tenant context middleware
- **Event-Driven Architecture**: Emits events for integration with other services
- **Bulk Operations**: Import, export, and bulk delete users
- **Health Checks**: Monitor service and database health
- **Swagger Documentation**: API documentation with Swagger

## Tech Stack

- NestJS: A progressive Node.js framework for building server-side applications
- TypeORM: An ORM for TypeScript and JavaScript
- PostgreSQL: A powerful, open-source object-relational database system
- Redis: In-memory data structure store for caching
- Swagger: API documentation
- Docker: Containerization for easy deployment

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm/yarn
- PostgreSQL
- Redis
- Docker (optional)

### Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Application
NODE_ENV=development
PORT=3002
API_PREFIX=api
APP_NAME=user-service

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=multi_tenant_user_service
DATABASE_SCHEMA=public

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=user:
REDIS_TTL=3600

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d

# Swagger
SWAGGER_ENABLED=true
SWAGGER_TITLE=User Service API
SWAGGER_DESCRIPTION=API documentation for User Service
SWAGGER_VERSION=1.0
SWAGGER_PATH=docs

# CORS
CORS_ENABLED=true
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### Installation

```bash
# Install dependencies
npm install

# Run database migrations
npm run migration:run

# Start the service
npm run start:dev
```

### Docker

```bash
# Build and start the service with Docker
docker-compose up -d
```

## Database Migrations

```bash
# Create a new migration
npm run migration:create -- migration-name

# Generate a migration from entity changes
npm run migration:generate

# Run migrations
npm run migration:run

# Revert the last migration
npm run migration:revert
```

## API Documentation

Swagger documentation is available at `/api/docs` when the service is running.

## Module Structure

- **Users Module**: Manages user accounts and profiles
- **Roles Module**: Manages roles and their permissions
- **Permissions Module**: Manages individual permissions
- **Teams Module**: Manages teams and team memberships
- **Settings Module**: Manages user-specific settings
- **Bulk Module**: Handles bulk operations for users
- **Health Module**: Provides health check endpoints

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
