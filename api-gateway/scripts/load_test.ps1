#!/bin/pwsh

# Load Testing Script for Multi-Tenant API Gateway
# This script performs load testing against the API gateway to verify performance

# Set variables
$API_GATEWAY = "https://example.com"
$TEST_DOMAIN = "tenant1.example.com"
$ADMIN_EMAIL = "admin@tenant1.example.com"
$ADMIN_PASSWORD = "password123"
$AUTH_ENDPOINT = "/api/v1/auth/login"
$USER_ENDPOINT = "/api/v1/users"

# Import dependencies - requires PSParallel module
# Install-Module -Name PSParallel -Force -AllowClobber

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "      Load Testing for API Gateway               " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# First, authenticate to get a token
$auth_payload = @{
    email = $ADMIN_EMAIL
    password = $ADMIN_PASSWORD
} | ConvertTo-Json

$headers = @{
    "Host" = $TEST_DOMAIN
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "$API_GATEWAY$AUTH_ENDPOINT" -Method POST -Headers $headers -Body $auth_payload
    $token = $response.token
    Write-Host "✓ Authentication successful, received token for testing" -ForegroundColor Green
} catch {
    Write-Host "✗ Authentication failed: $_" -ForegroundColor Red
    exit 1
}

# Define test cases
$test_cases = @(
    @{
        Name = "List Users API"
        Method = "GET"
        Endpoint = $USER_ENDPOINT
        ConcurrentUsers = 10
        RequestsPerUser = 20
        DelayMs = 100
    },
    @{
        Name = "User Profile API"
        Method = "GET"
        Endpoint = "$USER_ENDPOINT/me"
        ConcurrentUsers = 10
        RequestsPerUser = 20
        DelayMs = 100
    }
)

# Run load tests
foreach ($test in $test_cases) {
    Write-Host "`nRunning load test: $($test.Name)" -ForegroundColor Green
    Write-Host "Concurrent users: $($test.ConcurrentUsers)" -ForegroundColor Yellow
    Write-Host "Requests per user: $($test.RequestsPerUser)" -ForegroundColor Yellow
    Write-Host "Total requests: $($test.ConcurrentUsers * $test.RequestsPerUser)" -ForegroundColor Yellow
    
    $headers = @{
        "Host" = $TEST_DOMAIN
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $results = @()
    $successful = 0
    $failed = 0
    $rateLimited = 0
    $totalTime = 0
    
    # Start timing
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    
    # Use PSParallel for concurrent requests
    $requestResults = 1..$test.ConcurrentUsers | ForEach-Object -Parallel {
        $userId = $_
        $test = $using:test
        $headers = $using:headers
        $API_GATEWAY = $using:API_GATEWAY
        
        $userResults = @()
        
        for ($i = 1; $i -le $test.RequestsPerUser; $i++) {
            $requestStopwatch = [System.Diagnostics.Stopwatch]::StartNew()
            try {
                $response = Invoke-RestMethod -Uri "$API_GATEWAY$($test.Endpoint)" -Method $test.Method -Headers $headers -TimeoutSec 10
                $status = 200
                $success = $true
            } catch {
                $errorResponse = $_.Exception.Response
                $status = [int]$errorResponse.StatusCode
                $success = $false
            }
            $requestStopwatch.Stop()
            
            $userResults += [PSCustomObject]@{
                UserId = $userId
                RequestId = $i
                Success = $success
                StatusCode = $status
                ResponseTime = $requestStopwatch.ElapsedMilliseconds
            }
            
            # Add delay between requests
            Start-Sleep -Milliseconds $test.DelayMs
        }
        
        return $userResults
    } -ThrottleLimit $test.ConcurrentUsers
    
    $stopwatch.Stop()
    $totalTime = $stopwatch.ElapsedMilliseconds / 1000
    
    # Process results
    $results = $requestResults | ForEach-Object { $_ }
    $successful = ($results | Where-Object { $_.Success -eq $true }).Count
    $failed = ($results | Where-Object { $_.Success -eq $false -and $_.StatusCode -ne 429 }).Count
    $rateLimited = ($results | Where-Object { $_.StatusCode -eq 429 }).Count
    
    $avgResponseTime = ($results | Measure-Object -Property ResponseTime -Average).Average
    $maxResponseTime = ($results | Measure-Object -Property ResponseTime -Maximum).Maximum
    $minResponseTime = ($results | Measure-Object -Property ResponseTime -Minimum).Minimum
    
    # Calculate percentiles
    $sortedTimes = $results | Sort-Object -Property ResponseTime | Select-Object -ExpandProperty ResponseTime
    $p95Index = [math]::Ceiling($sortedTimes.Count * 0.95) - 1
    $p99Index = [math]::Ceiling($sortedTimes.Count * 0.99) - 1
    
    $p95 = $sortedTimes[$p95Index]
    $p99 = $sortedTimes[$p99Index]
    
    # Calculate requests per second
    $requestsPerSecond = $results.Count / $totalTime
    
    # Output results
    Write-Host "`nResults Summary:" -ForegroundColor Cyan
    Write-Host "Total requests: $($results.Count)" -ForegroundColor White
    Write-Host "Successful: $successful" -ForegroundColor Green
    Write-Host "Failed: $failed" -ForegroundColor Red
    Write-Host "Rate Limited: $rateLimited" -ForegroundColor Yellow
    Write-Host "Total time: $totalTime seconds" -ForegroundColor White
    Write-Host "Requests per second: $([math]::Round($requestsPerSecond, 2))" -ForegroundColor Cyan
    Write-Host "`nResponse Times (ms):" -ForegroundColor Cyan
    Write-Host "Min: $minResponseTime" -ForegroundColor White
    Write-Host "Avg: $([math]::Round($avgResponseTime, 2))" -ForegroundColor White
    Write-Host "Max: $maxResponseTime" -ForegroundColor White
    Write-Host "95th percentile: $p95" -ForegroundColor White
    Write-Host "99th percentile: $p99" -ForegroundColor White
    
    # Output status code distribution
    $statusDistribution = $results | Group-Object -Property StatusCode | 
        Select-Object @{Name='StatusCode'; Expression={$_.Name}}, @{Name='Count'; Expression={$_.Count}}, @{Name='Percentage'; Expression={[math]::Round(($_.Count / $results.Count) * 100, 2)}}
    
    Write-Host "`nStatus Code Distribution:" -ForegroundColor Cyan
    $statusDistribution | Format-Table -AutoSize
}

Write-Host "`nLoad testing completed!" -ForegroundColor Cyan
