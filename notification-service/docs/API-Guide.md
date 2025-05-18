# Notification Service API Guide

This document provides a detailed guide on how to use the Notification Service API.

## OpenAPI/Swagger Documentation

The service provides interactive API documentation using OpenAPI/Swagger, which is available at:

```
http://localhost:3007/docs
```

The Swagger UI allows you to:
- Explore all available endpoints
- See request parameters, body schemas, and response formats
- Test API calls directly from the browser
- View detailed descriptions and examples

## Authentication

All API requests require authentication. The service uses JWT authentication.

Include the JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

## Multi-Tenant Support

The service supports multi-tenancy. Tenants are identified in one of two ways:

1. Via the `x-tenant-id` header in each request
2. Via the JWT token payload (if the token contains tenant information)

If a request doesn't explicitly include a tenant ID, the service will attempt to extract it from the JWT token.

## API Endpoints

### Notifications

#### Send a notification

```http
POST /api/v1/notifications
```

Request body:

```json
{
  "userId": "user-uuid",
  "userEmail": "user@example.com",
  "templateCode": "welcome-email",
  "subject": "Welcome to our platform",
  "content": "Hello, welcome to our platform!",
  "channels": ["email", "in_app"],
  "priority": "normal",
  "variables": {
    "userName": "John Doe",
    "activationLink": "https://example.com/activate"
  },
  "scheduledFor": "2023-05-20T10:00:00Z"
}
```

Response:

```json
{
  "id": "notification-uuid",
  "status": "pending",
  "channels": ["email", "in_app"],
  "subject": "Welcome to our platform",
  "createdAt": "2023-05-18T14:30:00Z"
}
```

#### Get all notifications

```http
GET /api/v1/notifications?page=1&limit=20
```

Query parameters:
- `page` (optional): Page number, default 1
- `limit` (optional): Page size, default 20
- `userId` (optional): Filter by user ID
- `status` (optional): Filter by status (pending, processing, delivered, failed, read)
- `channel` (optional): Filter by channel (email, sms, push, in_app)
- `createdAfter` (optional): Filter by creation date
- `createdBefore` (optional): Filter by creation date

Response:

```json
{
  "items": [
    {
      "id": "notification-uuid",
      "status": "delivered",
      "channels": ["email"],
      "subject": "Welcome to our platform",
      "createdAt": "2023-05-18T14:30:00Z",
      "deliveredAt": "2023-05-18T14:31:00Z"
    }
  ],
  "total": 45
}
```

#### Get a notification by ID

```http
GET /api/v1/notifications/:id
```

Response:

```json
{
  "id": "notification-uuid",
  "tenantId": "tenant-uuid",
  "userId": "user-uuid",
  "userEmail": "user@example.com",
  "subject": "Welcome to our platform",
  "content": "Hello, welcome to our platform!",
  "channels": ["email", "in_app"],
  "status": "delivered",
  "priority": "normal",
  "deliveryAttempts": [
    {
      "channel": "email",
      "timestamp": "2023-05-18T14:31:00Z",
      "success": true
    }
  ],
  "deliveredAt": "2023-05-18T14:31:00Z",
  "createdAt": "2023-05-18T14:30:00Z"
}
```

#### Mark a notification as read

```http
PATCH /api/v1/notifications/:id/read
```

Response:

```json
{
  "id": "notification-uuid",
  "status": "read",
  "readAt": "2023-05-18T15:00:00Z"
}
```

#### Cancel a notification

```http
DELETE /api/v1/notifications/:id
```

Response:

```json
{
  "id": "notification-uuid",
  "status": "canceled"
}
```

### Templates

#### Create a template

```http
POST /api/v1/templates
```

Request body:

```json
{
  "code": "welcome-email",
  "name": "Welcome Email",
  "description": "Email sent to new users",
  "supportedChannels": ["email", "in_app"],
  "emailSubject": "Welcome to {{platformName}}, {{userName}}!",
  "emailHtmlContent": "<h1>Welcome, {{userName}}!</h1><p>Thanks for joining {{platformName}}.</p>",
  "emailTextContent": "Welcome, {{userName}}! Thanks for joining {{platformName}}.",
  "inAppTitle": "Welcome to {{platformName}}",
  "inAppContent": "Thanks for joining us, {{userName}}!",
  "defaultVariables": {
    "platformName": "Our Platform"
  }
}
```

Response:

```json
{
  "id": "template-uuid",
  "code": "welcome-email",
  "name": "Welcome Email",
  "createdAt": "2023-05-18T14:30:00Z"
}
```

#### Get all templates

```http
GET /api/v1/templates
```

Response:

```json
[
  {
    "id": "template-uuid",
    "code": "welcome-email",
    "name": "Welcome Email",
    "description": "Email sent to new users",
    "supportedChannels": ["email", "in_app"],
    "createdAt": "2023-05-18T14:30:00Z"
  }
]
```

#### Get a template by ID

```http
GET /api/v1/templates/:id
```

#### Get a template by code

```http
GET /api/v1/templates/code/:code
```

#### Update a template

```http
PUT /api/v1/templates/:id
```

#### Delete a template

```http
DELETE /api/v1/templates/:id
```

### Notification Preferences

#### Get all preferences for a user

```http
GET /api/v1/preferences/users/:userId
```

Response:

```json
[
  {
    "id": "preference-uuid",
    "userId": "user-uuid",
    "categoryCode": "marketing",
    "enabledChannels": ["email"],
    "isEnabled": true,
    "email": "user@example.com",
    "phone": "+1234567890",
    "deviceTokens": ["device-token-1"]
  }
]
```

#### Get preferences for a specific category

```http
GET /api/v1/preferences/users/:userId/categories/:categoryCode
```

#### Update preferences for a category

```http
PUT /api/v1/preferences/users/:userId/categories/:categoryCode
```

Request body:

```json
{
  "enabledChannels": ["email", "push"],
  "isEnabled": true,
  "email": "new-email@example.com",
  "deviceTokens": ["device-token-1", "device-token-2"]
}
```

#### Add a device token

```http
POST /api/v1/preferences/users/:userId/device-tokens
```

Request body:

```json
{
  "deviceToken": "new-device-token"
}
```

#### Remove a device token

```http
DELETE /api/v1/preferences/users/:userId/device-tokens/:deviceToken
```

#### Enable/Disable a channel

```http
PUT /api/v1/preferences/users/:userId/categories/:categoryCode/channels/:channel/enable
PUT /api/v1/preferences/users/:userId/categories/:categoryCode/channels/:channel/disable
```

### Health Checks

#### Get service health

```http
GET /api/v1/health
```

Response:

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    },
    "redis": {
      "status": "up"
    },
    "kafka": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    },
    "redis": {
      "status": "up"
    },
    "kafka": {
      "status": "up"
    }
  }
}
```

## Error Handling

The API uses standard HTTP status codes and returns error details in the response body:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

Common error codes:
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Rate Limiting

The API includes rate limiting to prevent abuse. The default limits are:
- 100 requests per minute per client

When a rate limit is exceeded, the API returns a `429 Too Many Requests` response with headers indicating the limit and when it will reset:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1621345200
```

## Pagination

List endpoints support pagination with the following query parameters:
- `page`: Page number (starting from 1)
- `limit`: Number of items per page

The response includes pagination metadata:

```json
{
  "items": [...],
  "total": 45
}
```
