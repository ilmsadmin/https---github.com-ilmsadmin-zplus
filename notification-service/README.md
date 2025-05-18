# Notification Service

A multi-tenant notification service that delivers notifications through various channels including email, push notifications, SMS, and in-app messages.

## Features

- Multi-tenant architecture with tenant isolation
- Multiple notification channels:
  - Email (SMTP, SendGrid, AWS SES)
  - Push Notifications (Firebase, APN)
  - SMS (Twilio)
  - In-App Notifications
- Customizable notification templates with Handlebars
- User notification preferences management
- Scheduled notifications
- Delivery status tracking with retry mechanism
- Real-time event processing
- Health checks and monitoring
- OpenAPI/Swagger documentation
- Comprehensive test coverage

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL
- Redis
- Kafka (for event processing)

### Installation

1. Clone the repository

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Edit the `.env` file with your configuration

### Running with Docker

The easiest way to get started is to use Docker Compose:

```bash
npm run docker:up
```

This will start:
- PostgreSQL database
- Redis cache
- Kafka and Zookeeper
- MailHog (for email testing)
- PgAdmin (for database management)
- The notification service

### Running locally

1. Start the dependencies (database, Redis, etc.):

```bash
npm run docker:up
```

2. Run the database migrations:

```bash
npm run migration:run
```

3. Start the service:

```bash
npm run start:dev
```

### API Documentation

API documentation is available at:

```
http://localhost:3007/docs
```

The service provides comprehensive OpenAPI/Swagger documentation for all endpoints with:
- Detailed descriptions of each endpoint
- Request parameters, body schemas, and example values
- Response types and examples
- Authentication requirements

## Testing

The service has comprehensive unit tests for all major components:

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:cov

# Run end-to-end tests
npm run test:e2e
```

Key test coverage includes:
- Notification service
- Template service
- Preferences service
- Channel services (Email, SMS, Push, In-App)
- Notification processor and event handlers
- Health checks and indicators

## Architecture

The notification service follows a layered architecture:

1. **API Layer**: REST endpoints for sending notifications, managing templates, and preferences
2. **Service Layer**: Business logic for notification processing
3. **Channel Layer**: Integrations with various notification providers
4. **Data Layer**: Database entities and repositories

### Key Components

- **NotificationsModule**: Core module for sending and managing notifications
- **TemplatesModule**: Template management with Handlebars support
- **Channels**: Email, Push, SMS, In-App notification delivery
- **PreferencesModule**: User notification preferences management

## Database Migrations

### Creating a new migration

```bash
npm run migration:create -- MigrationName
```

### Running migrations

```bash
npm run migration:run
```

### Reverting the last migration

```bash
npm run migration:revert
```

## Development Workflow

1. Make changes to the code
2. Create or update database migrations if needed
3. Run unit tests
4. Start the service locally and test manually
5. Create E2E tests for new features
6. Submit a pull request

## Environment Variables

See the `.env.example` file for all available configuration options.

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Add or update tests
4. Submit a pull request

## License

This project is licensed under the MIT License
