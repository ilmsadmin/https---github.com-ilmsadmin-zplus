# Comprehensive Integration Testing Guide for API Gateway with Downstream Microservices

This document outlines the steps to perform integration testing between the Kong API Gateway and downstream microservices in the multi-tenant system.

## Prerequisites

- Kubernetes cluster with Kong API Gateway deployed
- All required microservices deployed and running
- Access to the test tenant domains
- JWT tokens for authentication

## Test Environments

| Environment | Base URL                   | Description                                        |
|-------------|----------------------------|----------------------------------------------------|
| Development | https://dev.example.com    | For development and initial integration testing    |
| Staging     | https://staging.example.com| For pre-production validation                      |
| Production  | https://example.com        | Production environment                             |

## Test Scenarios

### 1. Tenant Identification and Routing

#### Test Case 1.1: Domain-based Tenant Routing

**Objective**: Verify that requests to tenant-specific domains are correctly routed to the appropriate tenant context.

**Steps**:
1. Send requests to multiple tenant domains:
   - `tenant1.example.com`
   - `tenant2.example.com`
   - `custom-domain.com` (mapped to a specific tenant)
2. Verify that requests are routed to the correct tenant backend with appropriate tenant headers.

**Verification**:
- Check that `X-Tenant-ID` and `X-Tenant-Schema` headers are correctly set
- Verify that tenant-specific data is returned

#### Test Case 1.2: Custom Domain Mapping

**Objective**: Confirm that custom domains are properly mapped to their respective tenants.

**Steps**:
1. Configure a custom domain mapping in the tenant service
2. Send requests to the custom domain
3. Verify that the request is correctly associated with the tenant

**Verification**:
- The system identifies the correct tenant ID from the custom domain
- Tenant-specific data is returned

### 2. Authentication and JWT Validation

#### Test Case 2.1: JWT Token Validation

**Objective**: Verify that the JWT validation plugin correctly authenticates requests.

**Steps**:
1. Get a valid JWT token for a tenant user
2. Send a request with the token
3. Send a request with an invalid token
4. Send a request with an expired token
5. Send a request without a token to a protected route

**Verification**:
- Valid token: Request succeeds with 200 OK
- Invalid token: Request fails with 401 Unauthorized
- Expired token: Request fails with 401 Unauthorized
- No token: Request fails with 401 Unauthorized

#### Test Case 2.2: Tenant Context in JWT

**Objective**: Verify that the tenant context in JWT tokens is correctly validated.

**Steps**:
1. Get a valid JWT token for tenant1
2. Send a request to tenant1's domain with this token
3. Send a request to tenant2's domain with tenant1's token

**Verification**:
- Request to tenant1: Succeeds with 200 OK
- Request to tenant2 with tenant1's token: Fails with 403 Forbidden

### 3. Rate Limiting

#### Test Case 3.1: Package-based Rate Limiting

**Objective**: Verify that rate limits are correctly applied based on tenant package.

**Steps**:
1. Configure test tenants with different packages:
   - Tenant1: Basic package (50 req/min)
   - Tenant2: Pro package (300 req/min)
   - Tenant3: Enterprise package (1500 req/min)
2. Send requests exceeding the rate limit for each tenant

**Verification**:
- Basic tenant: Rate limited after ~50 requests per minute
- Pro tenant: Rate limited after ~300 requests per minute
- Enterprise tenant: Rate limited after ~1500 requests per minute
- Rate limit headers are present in responses
- 429 response with custom error page when limit is exceeded

#### Test Case 3.2: Burst Tolerance

**Objective**: Verify that burst tolerance is correctly applied.

**Steps**:
1. Send short bursts of requests to each tenant type
2. Check if burst tolerance allows short spikes in traffic

**Verification**:
- Basic tenant: Tolerates bursts up to 10 req/sec
- Pro tenant: Tolerates bursts up to 50 req/sec
- Enterprise tenant: Tolerates bursts up to 200 req/sec

### 4. Request/Response Transformation

#### Test Case 4.1: Header Transformation

**Objective**: Verify that headers are properly transformed.

**Steps**:
1. Send a request with various headers
2. Check headers received by the backend service
3. Check response headers received by the client

**Verification**:
- Sensitive headers are removed
- Tenant context headers are added
- Security headers are added to responses

#### Test Case 4.2: Request Body Transformation

**Objective**: Verify that request bodies are properly transformed.

**Steps**:
1. Send a request with a JSON body
2. Check the transformed request received by the backend service

**Verification**:
- Tenant-specific fields are injected
- Payload validation is applied
- Sanitization rules are enforced

### 5. Circuit Breaker

#### Test Case 5.1: Circuit Breaking on Failures

**Objective**: Verify that the circuit breaker opens when a service fails repeatedly.

**Steps**:
1. Configure a test service to fail with 5xx errors
2. Send multiple requests to trigger the circuit breaker
3. Continue sending requests to verify the circuit breaker is open
4. Wait for the timeout period and verify the circuit closes

**Verification**:
- Circuit breaker opens after error threshold is reached
- 503 Service Unavailable response with circuit breaker message
- Circuit breaker closes after the timeout period

#### Test Case 5.2: Health Check Recovery

**Objective**: Verify that health checks can close the circuit breaker.

**Steps**:
1. Configure a service to recover after a period of failure
2. Open the circuit breaker with error requests
3. Allow the service to recover
4. Verify that health checks detect the recovery

**Verification**:
- Health checks start passing
- Circuit breaker closes after successful health checks
- Requests flow normally after recovery

### 6. TLS and SSL Handling

#### Test Case 6.1: TLS Termination

**Objective**: Verify that TLS termination works correctly.

**Steps**:
1. Send HTTPS requests to the API gateway
2. Verify that HTTPS connections are properly terminated
3. Check that backend services receive HTTP traffic

**Verification**:
- HTTPS requests succeed
- Backend services receive unencrypted traffic
- TLS protocol versions are enforced

#### Test Case 6.2: Certificate Management

**Objective**: Verify that certificates are correctly managed.

**Steps**:
1. Test with wildcard certificate for `*.example.com`
2. Test with custom domain certificates

**Verification**:
- SSL certificates are valid
- No certificate warnings in browsers
- Automatic renewal is working

### 7. Monitoring and Tracing

#### Test Case 7.1: Prometheus Metrics

**Objective**: Verify that metrics are correctly collected.

**Steps**:
1. Generate traffic to various services
2. Query Prometheus metrics

**Verification**:
- Request counts, latency, and error metrics are collected
- Tenant-specific metrics are separated
- Rate limiting and circuit breaker metrics are available

#### Test Case 7.2: Distributed Tracing

**Objective**: Verify that distributed tracing works across services.

**Steps**:
1. Generate requests that span multiple microservices
2. Check trace collection in the tracing system

**Verification**:
- Traces contain spans for all services in the request flow
- Tenant context is preserved in traces
- Latency information is accurate

## Automation Tools

Use the provided scripts to automate these integration tests:

```powershell
# Run all integration tests
./scripts/integration_test.ps1 -all

# Run specific test category
./scripts/integration_test.ps1 -category "rate-limiting"

# Run tests for a specific tenant
./scripts/integration_test.ps1 -tenant "tenant1.example.com"
```

## Expected Results and Pass Criteria

Each test scenario should produce logs and metrics that can be used to verify the correct behavior. The pass criteria include:

1. All API gateway features function correctly with downstream services
2. Multi-tenancy isolation is maintained
3. Performance meets the requirements for each tenant package
4. Security policies are enforced
5. Error handling provides appropriate responses

## Troubleshooting

If tests fail, check the following:

1. Kong logs: `kubectl logs -n multi-tenant deployment/kong`
2. Service logs: `kubectl logs -n multi-tenant deployment/<service-name>`
3. Prometheus metrics: Query the relevant metrics for errors
4. Trace information: Check distributed traces for failed requests

## Next Steps

After completing integration testing:

1. Update the API gateway configuration if necessary
2. Document any issues or limitations discovered
3. Proceed to performance testing to validate under load
4. Schedule regular regression tests for ongoing validation
