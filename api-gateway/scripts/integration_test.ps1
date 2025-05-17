#!/bin/pwsh

# Integration Testing Script for Multi-Tenant API Gateway
# This script tests the integration between Kong API Gateway and downstream microservices

# Set variables
$API_GATEWAY = "https://example.com"
$TEST_DOMAIN = "tenant1.example.com"
$ADMIN_EMAIL = "admin@tenant1.example.com"
$ADMIN_PASSWORD = "password123"
$AUTH_ENDPOINT = "/api/v1/auth/login"
$TENANT_INFO_ENDPOINT = "/api/v1/tenant"
$USER_ENDPOINT = "/api/v1/users"
$BILLING_ENDPOINT = "/api/v1/billing"

# Parse command-line parameters
param (
    [string]$category = "all",
    [string]$tenant = "tenant1.example.com",
    [switch]$all,
    [switch]$detailed
)

if ($all) {
    $category = "all"
}

if ($tenant -ne "tenant1.example.com") {
    $TEST_DOMAIN = $tenant
    $ADMIN_EMAIL = "admin@$tenant"
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "      Integration Testing for API Gateway         " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Testing category: $category" -ForegroundColor Cyan
Write-Host "Testing tenant: $TEST_DOMAIN" -ForegroundColor Cyan
Write-Host "Detailed logging: $detailed" -ForegroundColor Cyan

# Function to make API requests
function Invoke-APIRequest {
    param (
        [Parameter(Mandatory=$true)]
        [string]$Hostname,

        [Parameter(Mandatory=$true)]
        [string]$Endpoint,

        [Parameter(Mandatory=$true)]
        [string]$Method,

        [Parameter(Mandatory=$false)]
        [string]$Token,

        [Parameter(Mandatory=$false)]
        [object]$Body
    )

    $headers = @{
        "Host" = $Hostname
        "Content-Type" = "application/json"
    }

    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }

    $params = @{
        Uri = "$API_GATEWAY$Endpoint"
        Method = $Method
        Headers = $headers
    }

    if ($Body -and $Method -ne "GET") {
        $params["Body"] = ($Body | ConvertTo-Json)
    }

    try {
        $response = Invoke-RestMethod @params
        return @{
            Success = $true
            Data = $response
            StatusCode = 200
        }
    }
    catch [System.Net.WebException] {
        $statusCode = [int]$_.Exception.Response.StatusCode
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        $reader.Close()

        return @{
            Success = $false
            Error = $responseBody
            StatusCode = $statusCode
        }
    }
}

# Run tests based on the selected category
function Run-Tests {
    param (
        [string]$Category,
        [string]$Token
    )

    switch($Category) {
        "authentication" { Test-Authentication }
        "tenant" { Test-TenantIdentification -Token $Token }
        "rate-limiting" { Test-RateLimiting -Token $Token }
        "circuit-breaker" { Test-CircuitBreaker -Token $Token }
        "transformation" { Test-Transformation -Token $Token }
        "services" { Test-DownstreamServices -Token $Token }
        "all" { 
            $authResult = Test-Authentication
            if ($authResult.Success) {
                $token = $authResult.Token
                Test-TenantIdentification -Token $token
                Test-RateLimiting -Token $token
                Test-CircuitBreaker -Token $token
                Test-Transformation -Token $token
                Test-DownstreamServices -Token $token
            }
        }
        default { Write-Host "Unknown test category: $Category" -ForegroundColor Red }
    }
}

# 1. Test Authentication & JWT Validation
function Test-Authentication {
    Write-Host "`n1. Testing Authentication & JWT Validation" -ForegroundColor Green
    Write-Host "Attempting to login to tenant domain: $TEST_DOMAIN" -ForegroundColor Yellow

    $auth_payload = @{
        email = $ADMIN_EMAIL
        password = $ADMIN_PASSWORD
    }

    $auth_result = Invoke-APIRequest -Hostname $TEST_DOMAIN -Endpoint $AUTH_ENDPOINT -Method "POST" -Body $auth_payload

    if ($auth_result.Success) {
        $token = $auth_result.Data.token
        Write-Host "✓ Authentication successful" -ForegroundColor Green
        Write-Host "JWT Token received" -ForegroundColor Yellow
        
        # Test invalid token
        $invalid_result = Invoke-APIRequest -Hostname $TEST_DOMAIN -Endpoint $USER_ENDPOINT -Method "GET" -Token "invalid.token.here"
        if (!$invalid_result.Success -and $invalid_result.StatusCode -eq 401) {
            Write-Host "✓ Invalid token rejected with 401" -ForegroundColor Green
        } else {
            Write-Host "✗ Invalid token test failed" -ForegroundColor Red
        }
        
        return @{
            Success = $true
            Token = $token
        }
    } else {
        Write-Host "✗ Authentication failed: $($auth_result.Error)" -ForegroundColor Red
        Write-Host "Stopping tests" -ForegroundColor Red
        return @{
            Success = $false
        }
    }
}

# 2. Test Tenant Identification & Headers
function Test-TenantIdentification {
    param([string]$Token)
    
    Write-Host "`n2. Testing Tenant Identification & Headers" -ForegroundColor Green
    Write-Host "Fetching tenant information for: $TEST_DOMAIN" -ForegroundColor Yellow

    $tenant_result = Invoke-APIRequest -Hostname $TEST_DOMAIN -Endpoint $TENANT_INFO_ENDPOINT -Method "GET" -Token $Token

    if ($tenant_result.Success) {
        Write-Host "✓ Tenant identification successful" -ForegroundColor Green
        Write-Host "Tenant ID: $($tenant_result.Data.tenant_id)" -ForegroundColor Yellow
        Write-Host "Tenant Schema: $($tenant_result.Data.schema_name)" -ForegroundColor Yellow
        
        # Test cross-tenant access if we're testing all scenarios
        if ($category -eq "all" -or $category -eq "tenant") {
            $otherTenant = if ($TEST_DOMAIN -eq "tenant1.example.com") { "tenant2.example.com" } else { "tenant1.example.com" }
            Write-Host "Testing cross-tenant access with: $otherTenant" -ForegroundColor Yellow
            
            $cross_tenant_result = Invoke-APIRequest -Hostname $otherTenant -Endpoint $TENANT_INFO_ENDPOINT -Method "GET" -Token $Token
            
            if (!$cross_tenant_result.Success -and $cross_tenant_result.StatusCode -eq 403) {
                Write-Host "✓ Cross-tenant access properly rejected with 403" -ForegroundColor Green
            } else {
                Write-Host "✗ Cross-tenant isolation failed! Status: $($cross_tenant_result.StatusCode)" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "✗ Tenant identification failed: $($tenant_result.Error)" -ForegroundColor Red
    }
}

# 3. Test Rate Limiting
function Test-RateLimiting {
    param([string]$Token)
    
    Write-Host "`n3. Testing Rate Limiting" -ForegroundColor Green
    Write-Host "Making multiple requests to trigger rate limiting" -ForegroundColor Yellow

    # Get tenant package first to determine expected limits
    $tenant_result = Invoke-APIRequest -Hostname $TEST_DOMAIN -Endpoint $TENANT_INFO_ENDPOINT -Method "GET" -Token $Token
    $expectedLimit = 50 # Default to basic
    
    if ($tenant_result.Success) {
        if ($tenant_result.Data.package -eq "pro") {
            $expectedLimit = 300
        } elseif ($tenant_result.Data.package -eq "enterprise") {
            $expectedLimit = 1500
        }
    }
    
    Write-Host "Expected rate limit for package: $expectedLimit requests per minute" -ForegroundColor Yellow
    
    $rate_limit_hit = $false
    $headers_result = $null
    
    # Make a request and examine rate limit headers
    $headers_response = Invoke-WebRequest -Uri "$API_GATEWAY$USER_ENDPOINT" -Headers @{
        "Host" = $TEST_DOMAIN
        "Authorization" = "Bearer $Token"
    }
    
    $limitHeader = $headers_response.Headers["X-RateLimit-Limit"]
    $remainingHeader = $headers_response.Headers["X-RateLimit-Remaining"]
    
    if ($limitHeader -and $remainingHeader) {
        Write-Host "✓ Rate limit headers present: Limit=$limitHeader, Remaining=$remainingHeader" -ForegroundColor Green
        
        if ([int]$limitHeader -eq $expectedLimit) {
            Write-Host "✓ Rate limit matches expected package limit" -ForegroundColor Green
        } else {
            Write-Host "✗ Rate limit ($limitHeader) doesn't match expected package limit ($expectedLimit)" -ForegroundColor Red
        }
    } else {
        Write-Host "✗ Rate limit headers not found in response" -ForegroundColor Red
    }
    
    # Only execute the flood test if we're doing a detailed test
    if ($detailed) {
        for ($i = 1; $i -le ($expectedLimit + 10); $i++) {
            $rate_result = Invoke-APIRequest -Hostname $TEST_DOMAIN -Endpoint $USER_ENDPOINT -Method "GET" -Token $Token
            if (-not $rate_result.Success -and $rate_result.StatusCode -eq 429) {
                $rate_limit_hit = $true
                Write-Host "✓ Rate limit triggered after $i requests" -ForegroundColor Green
                break
            }
            Write-Host "." -NoNewline
            if ($i % 50 -eq 0) {
                Write-Host " $i" -NoNewline
            }
        }

        if (-not $rate_limit_hit) {
            Write-Host "✗ Rate limit was not triggered after expected number of requests" -ForegroundColor Red
        }
    }
}

# 4. Test Circuit Breaker
function Test-CircuitBreaker {
    param([string]$Token)
    
    Write-Host "`n4. Testing Circuit Breaker" -ForegroundColor Green
    Write-Host "Making requests to trigger circuit breaker (requires a failing service)" -ForegroundColor Yellow

    $circuit_open = $false
    for ($i = 1; $i -le 20; $i++) {
        $circuit_result = Invoke-APIRequest -Hostname $TEST_DOMAIN -Endpoint "/api/v1/failing-service" -Method "GET" -Token $Token
        if (-not $circuit_result.Success -and $circuit_result.StatusCode -eq 503) {
            $circuit_open = $true
            Write-Host "✓ Circuit breaker opened after $i requests" -ForegroundColor Green
            
            # Check if we get a proper circuit breaker message
            if ($circuit_result.Error -match "circuit.*open") {
                Write-Host "✓ Circuit breaker message correctly included in response" -ForegroundColor Green
            } else {
                Write-Host "✗ Circuit breaker message not found in response" -ForegroundColor Red
            }
            break
        }
        Write-Host "." -NoNewline
    }

    if (-not $circuit_open) {
        Write-Host "✗ Circuit breaker did not open (this may be expected if the service is healthy)" -ForegroundColor Yellow
    }
}

# 5. Test Response Transformation
function Test-Transformation {
    param([string]$Token)
    
    Write-Host "`n5. Testing Response Transformation" -ForegroundColor Green
    Write-Host "Checking for security headers in response" -ForegroundColor Yellow

    $headers_result = Invoke-WebRequest -Uri "$API_GATEWAY$TENANT_INFO_ENDPOINT" -Headers @{
        "Host" = $TEST_DOMAIN
        "Authorization" = "Bearer $Token"
    }

    $security_headers = @(
        "X-Content-Type-Options",
        "X-Frame-Options",
        "X-XSS-Protection",
        "Referrer-Policy"
    )

    $all_headers_present = $true
    foreach ($header in $security_headers) {
        if ($headers_result.Headers.$header) {
            Write-Host "✓ Security header present: $header = $($headers_result.Headers.$header)" -ForegroundColor Green
        } else {
            Write-Host "✗ Security header missing: $header" -ForegroundColor Red
            $all_headers_present = $false
        }
    }

    # Check for removed headers that shouldn't be exposed
    $sensitive_headers = @(
        "X-Powered-By",
        "Server"
    )
    
    $all_sensitive_removed = $true
    foreach ($header in $sensitive_headers) {
        if ($headers_result.Headers.$header) {
            Write-Host "✗ Sensitive header not removed: $header = $($headers_result.Headers.$header)" -ForegroundColor Red
            $all_sensitive_removed = $false
        } else {
            Write-Host "✓ Sensitive header properly removed: $header" -ForegroundColor Green
        }
    }

    if ($all_headers_present -and $all_sensitive_removed) {
        Write-Host "✓ Header transformation working correctly" -ForegroundColor Green
    } else {
        Write-Host "✗ Header transformation has issues" -ForegroundColor Red
    }
}

# 6. Test Downstream Services Integration
function Test-DownstreamServices {
    param([string]$Token)
    
    Write-Host "`n6. Testing Downstream Services Integration" -ForegroundColor Green
    
    $services = @(
        @{ Name = "User Service"; Endpoint = "/api/v1/users/me"; Method = "GET"; Body = $null },
        @{ Name = "Billing Service"; Endpoint = "/api/v1/billing/summary"; Method = "GET"; Body = $null },
        @{ Name = "CRM Service"; Endpoint = "/api/v1/crm/customers"; Method = "GET"; Body = $null },
        @{ Name = "Notification Service"; Endpoint = "/api/v1/notifications/unread"; Method = "GET"; Body = $null }
    )
    
    $success_count = 0
    $service_count = $services.Count
    
    foreach ($service in $services) {
        Write-Host "Testing $($service.Name) integration: $($service.Endpoint)" -ForegroundColor Yellow
        
        $service_result = Invoke-APIRequest -Hostname $TEST_DOMAIN -Endpoint $service.Endpoint -Method $service.Method -Token $Token -Body $service.Body
        
        if ($service_result.Success) {
            Write-Host "✓ $($service.Name) integration successful" -ForegroundColor Green
            $success_count++
            
            if ($detailed) {
                $latency_result = Measure-Command {
                    Invoke-APIRequest -Hostname $TEST_DOMAIN -Endpoint $service.Endpoint -Method $service.Method -Token $Token -Body $service.Body | Out-Null
                }
                Write-Host "  Latency: $($latency_result.TotalMilliseconds) ms" -ForegroundColor Yellow
            }
        } else {
            Write-Host "✗ $($service.Name) integration failed: $($service_result.StatusCode) - $($service_result.Error)" -ForegroundColor Red
        }
    }
    
    Write-Host "`nService Integration Summary: $success_count/$service_count services tested successfully" -ForegroundColor Cyan
    
    if ($success_count -eq $service_count) {
        Write-Host "✓ All downstream services integrated correctly" -ForegroundColor Green
    } else {
        Write-Host "✗ Some service integrations failed" -ForegroundColor Red
    }
}

# Run the selected tests
Run-Tests -Category $category

Write-Host "`nIntegration tests completed!" -ForegroundColor Cyan
