# CRM Service

This service is part of the multi-tenant system and provides CRM functionality to the tenants.

## Description

The CRM Service offers customer relationship management features, including:

- Contact Management
- Lead Management
- Deal Pipeline
- Sales Tracking
- Customer Communication
- Custom Fields
- Customizable Workflows
- Reporting & Analytics

## Installation

```bash
$ npm install
```

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```
# Application
PORT=3101
NODE_ENV=development
API_PREFIX=api/v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=system_db
DB_SYNCHRONIZE=false
DB_LOGGING=true
DB_SSL=false
DB_POOL_SIZE=10
DB_CONNECTION_TIMEOUT=10000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TTL=3600
REDIS_DB=0
REDIS_KEY_PREFIX=crm_

# Kafka
KAFKA_ENABLED=true
KAFKA_CLIENT_ID=crm-service
KAFKA_BROKERS=localhost:9092
KAFKA_CONSUMER_GROUP=crm-service-group
KAFKA_SSL=false
KAFKA_SASL_MECHANISM=plain
KAFKA_SASL_USERNAME=
KAFKA_SASL_PASSWORD=

# API Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# CORS
CORS_ENABLED=true
CORS_ORIGIN=*

# Swagger
SWAGGER_ENABLED=true
SWAGGER_TITLE=CRM Service API
SWAGGER_DESCRIPTION=CRM Module Service for Multi-Tenant System
SWAGGER_VERSION=1.0
SWAGGER_PATH=docs
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## API Documentation

When the application is running, access the Swagger documentation at:
`http://localhost:3101/api/v1/docs`
