# Kong API Gateway Implementation Guide for Multi-Tenant System

## 1. Overview

This document provides a detailed guide for implementing and configuring Kong as the API Gateway for our multi-tenant system. Kong serves as the single entry point for all client requests, handling routing, authentication, rate limiting, and other cross-cutting concerns.

## 2. Key Components

### 2.1. Kong Plugins

Our implementation uses several custom Kong plugins to support multi-tenant functionality:

- **tenant-identifier**: Identifies the tenant from the hostname and adds tenant context to the request headers
- **tenant-jwt-validator**: Validates JWT tokens with tenant context
- **tenant-rate-limiter**: Applies rate limits based on tenant package (basic/pro/enterprise)
- **circuit-breaker**: Prevents cascading failures when downstream services are unavailable
- **tenant-transformer**: Modifies requests and responses according to tenant-specific rules
- **tenant-monitoring**: Collects metrics and traces for monitoring and observability

### 2.2. Architecture

The API Gateway sits at the edge of our microservice architecture:

```
Client Requests
      |
      v
[External Load Balancer/Ingress]
      |
      v
  [API Gateway] --- Redis (caching, rate limiting)
      |   |        |
      |   |---------> Auth Service (JWT validation)
      |   |        |
      |   |---------> Tenant Service (domain resolution)
      |   
      v
[Microservices Backends]
  - User Service
  - Billing Service
  - Notification Service
  - File Service
  - Module Services (CRM, HRM, etc.)
```

## 3. Installation and Deployment

### 3.1. Prerequisites

- Kubernetes cluster
- Helm (optional, for Kong installation)
- PostgreSQL database for Kong
- Redis for rate limiting and caching
- SSL certificates management (cert-manager)

### 3.2. Deployment Steps

1. **Create Kubernetes namespace**:
   ```bash
   kubectl create namespace multi-tenant
   ```

2. **Deploy Kong database**:
   ```bash
   kubectl apply -f kubernetes/deployments/kong-database-pvc.yaml
   kubectl apply -f kubernetes/config-maps/kong-database-secret.yaml
   kubectl apply -f kubernetes/deployments/kong-database-deployment.yaml
   kubectl apply -f kubernetes/services/kong-database-service.yaml
   ```

3. **Run Kong migrations**:
   ```bash
   # Create migration job
   kubectl create job kong-migrations --namespace=multi-tenant --from=cronjob/kong-migrations
   
   # Wait for migrations to complete
   kubectl wait --for=condition=complete --timeout=300s job/kong-migrations -n multi-tenant
   ```

4. **Deploy Kong Gateway**:
   ```bash
   kubectl apply -f kubernetes/config-maps/kong-plugins-configmap.yaml
   kubectl apply -f kubernetes/config-maps/kong-config-configmap.yaml
   kubectl apply -f kubernetes/deployments/kong-deployment.yaml
   kubectl apply -f kubernetes/services/kong-service.yaml
   kubectl apply -f kubernetes/ingress/kong-gateway-ingress.yaml
   ```

5. **Deploy monitoring tools**:
   ```bash
   # Prometheus
   kubectl apply -f monitoring/prometheus/prometheus-configmap.yaml
   kubectl apply -f monitoring/prometheus/prometheus-deployment.yaml
   kubectl apply -f monitoring/prometheus/prometheus-service.yaml
   
   # Grafana
   kubectl apply -f monitoring/grafana/grafana-configmap.yaml
   kubectl apply -f monitoring/grafana/grafana-dashboards-configmap.yaml
   kubectl apply -f monitoring/grafana/grafana-deployment.yaml
   kubectl apply -f monitoring/grafana/grafana-service.yaml
   kubectl apply -f monitoring/grafana/grafana-ingress.yaml
   
   # ELK Stack (optional)
   kubectl apply -f monitoring/elk/elasticsearch-deployment.yaml
   kubectl apply -f monitoring/elk/elasticsearch-service.yaml
   kubectl apply -f monitoring/elk/logstash-configmap.yaml
   kubectl apply -f monitoring/elk/logstash-deployment.yaml
   kubectl apply -f monitoring/elk/logstash-service.yaml
   kubectl apply -f monitoring/elk/kibana-deployment.yaml
   kubectl apply -f monitoring/elk/kibana-service.yaml
   kubectl apply -f monitoring/elk/kibana-ingress.yaml
   ```

### 3.3. Automation Script

We provide automation scripts for deployment:

- For Linux/Mac: `./scripts/deploy-kong.sh`
- For Windows: `.\scripts\deploy-kong.ps1`

These scripts handle all the deployment steps in the correct order.

## 4. Plugin Configurations

### 4.1. Tenant Identification

The `tenant-identifier` plugin is responsible for extracting tenant information from the hostname:

```yaml
plugins:
  - name: tenant-identifier
    config:
      system_domain: example.com
      cache_ttl: 300
      redis_host: redis
      redis_port: 6379
```

This plugin:
1. Extracts the hostname from the request
2. Checks if it's the system domain (`example.com`)
3. If not, queries Redis cache for tenant information
4. If not in cache, calls Tenant Service to resolve the domain
5. Adds tenant information to request headers

### 4.2. JWT Validation

The `tenant-jwt-validator` plugin validates JWT tokens and ensures they match the tenant context:

```yaml
plugins:
  - name: tenant-jwt-validator
    config:
      auth_service_host: auth-service
      auth_service_port: 3000
      auth_service_path: /internal/auth/validate
      public_paths:
        - /api/v1/auth/login
        - /api/v1/auth/register
```

This plugin:
1. Extracts the JWT token from the request
2. Sends the token to Auth Service for validation
3. Checks if token tenant matches the request tenant
4. Adds user information to request headers

### 4.3. Rate Limiting

The `tenant-rate-limiter` plugin applies different rate limits based on the tenant's package:

```yaml
plugins:
  - name: tenant-rate-limiter
    config:
      basic_rate: 50
      pro_rate: 200
      enterprise_rate: 1000
      basic_window_size: 60
      pro_window_size: 60
      enterprise_window_size: 60
```

Rate limits are defined per tenant package:
- Basic: 50 requests per minute
- Pro: 200 requests per minute
- Enterprise: 1000 requests per minute

### 4.4. Circuit Breaker

The `circuit-breaker` plugin prevents cascading failures when services are unhealthy:

```yaml
plugins:
  - name: circuit-breaker
    config:
      error_threshold: 50
      window_size: 10
      min_calls: 5
      open_circuit_timeout: 30
```

Configuration parameters:
- **error_threshold**: Error percentage that triggers circuit open (50%)
- **window_size**: Number of requests to consider for error rate (10)
- **min_calls**: Minimum calls before circuit can open (5)
- **open_circuit_timeout**: Time in seconds before trying again (30)

## 5. Tenant Routing

### 5.1. Domain-Based Routing

The API Gateway routes requests based on the hostname:

1. **For system domain** (`example.com`):
   - Routes to system admin services
   - Requires system scope in JWT token

2. **For tenant subdomains** (`tenant1.example.com`):
   - Identifies tenant from subdomain
   - Routes to tenant-specific services with tenant context

3. **For custom domains** (`customerdomain.com`):
   - Identifies tenant from domain database
   - Routes to tenant-specific services with tenant context

### 5.2. Service Routes

Each microservice has its own route configuration:

```yaml
services:
  - name: auth-service
    url: http://auth-service:3000
    routes:
      - name: auth-service-route
        paths:
          - /api/v1/auth
```

## 6. Monitoring and Observability

### 6.1. Metrics Collection

The `tenant-monitoring` plugin collects metrics:

- **Request rate** by tenant, service, and status code
- **Latency** by tenant and service
- **Rate limit hits** by tenant and package
- **Circuit breaker** state changes

### 6.2. Distributed Tracing

The plugin adds tracing headers to requests:
- B3 headers (TraceId, SpanId, ParentSpanId)
- OpenTelemetry `traceparent` header

### 6.3. Monitoring Dashboards

Grafana dashboards are available for monitoring:
- Kong Multi-Tenant Dashboard
- Service Health Dashboard
- Tenant Activity Dashboard

## 7. Security Considerations

### 7.1. JWT Security

- Use strong signatures (RS256)
- Short expiration times (15-60 minutes)
- Include tenant context in claims
- Validate tenant context in the gateway

### 7.2. CORS Configuration

```yaml
plugins:
  - name: cors
    config:
      origins:
        - "*"  # In production, specify allowed origins
      methods:
        - GET
        - POST
        - PUT
        - DELETE
        - OPTIONS
```

### 7.3. Request Sanitization

The `tenant-transformer` plugin sanitizes requests:
- Removes sensitive headers
- Sanitizes paths to prevent traversal
- Sanitizes query parameters to prevent injection
- Validates content types

## 8. High Availability and Scaling

### 8.1. Scaling Kong

Kong Gateway pods can be scaled horizontally:

```bash
kubectl scale deployment kong-gateway -n multi-tenant --replicas=5
```

### 8.2. Redis High Availability

For production, use Redis Sentinel or Redis Cluster:

```yaml
config:
  redis_host: redis-sentinel
  redis_port: 26379
  redis_sentinel_master: mymaster
```

### 8.3. Database Scaling

Kong database can be deployed with replication:

```yaml
spec:
  replicas: 3
  selector:
    matchLabels:
      app: kong-database
```

## 9. Troubleshooting

### 9.1. Common Issues

- **Domain resolution issues**: Check Tenant Service and Redis cache
- **JWT validation failures**: Check Auth Service and JWT configuration
- **Rate limiting issues**: Check Redis connection and rate limit configuration
- **Circuit breaker triggering**: Check downstream service health

### 9.2. Debugging

Enable debug logging in Kong:

```yaml
env:
  - name: KONG_LOG_LEVEL
    value: "debug"
```

### 9.3. Checking Logs

```bash
kubectl logs -n multi-tenant -l app=kong-gateway
```

## 10. Performance Tuning

### 10.1. Redis Connection Pooling

Adjust Redis connection settings:

```lua
-- In plugin configuration
red:set_keepalive(poolsize_ttl, poolsize)
```

### 10.2. Database Connection Pooling

```yaml
env:
  - name: KONG_PG_POOL_SIZE
    value: "20"
  - name: KONG_PG_TIMEOUT
    value: "5000"
```

### 10.3. Caching Domain Lookups

Adjust cache TTL based on tenant update frequency:

```yaml
config:
  cache_ttl: 300  # 5 minutes
```

## 11. Best Practices

1. **Tenant Isolation**: Ensure strict tenant isolation at all levels
2. **Graceful Degradation**: Configure appropriate timeouts and fallbacks
3. **Monitoring**: Set up alerts for circuit breaker events and high error rates
4. **Security**: Regularly update TLS configurations and security headers
5. **Documentation**: Keep API documentation up-to-date with OpenAPI/Swagger
