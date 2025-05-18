#!/bin/pwsh
# Script to help setup and test the Message Broker integration

param(
    [Parameter()]
    [ValidateSet("install-lib", "test-producer", "test-consumer", "setup-db", "status")]
    [string]$Action = "status"
)

$ErrorActionPreference = "Stop"
$KafkaDir = "d:\www\multi-tenant\kafka"

function Install-Library {
    Write-Host "Installing the shared Kafka library in compatible services..." -ForegroundColor Green
    
    Set-Location "$KafkaDir\lib"
    
    # Build the library
    Write-Host "Building the event-bus library..." -ForegroundColor Cyan
    npm install
    npm run build
    
    # Link the library locally
    Write-Host "Creating a local npm link..." -ForegroundColor Cyan
    npm link
    
    # Install in services
    $services = @(
        "tenant-service",
        "notification-service",
        "user-service",
        "billing-service",
        "auth-service",
        "file-service",
        "analytics-service"
    )
    
    foreach ($service in $services) {
        $serviceDir = "d:\www\multi-tenant\$service"
        
        if (Test-Path $serviceDir) {
            Write-Host "Linking event-bus library to $service..." -ForegroundColor Cyan
            Set-Location $serviceDir
            
            # Link the library
            npm link @multi-tenant/event-bus
            
            # Add as dependency in package.json if not already there
            $packageJson = Get-Content -Path "$serviceDir\package.json" -Raw | ConvertFrom-Json
            
            if (-not $packageJson.dependencies.'@multi-tenant/event-bus') {
                $packageJson.dependencies | Add-Member -Name '@multi-tenant/event-bus' -Value "^1.0.0" -MemberType NoteProperty
                $packageJson | ConvertTo-Json -Depth 10 | Set-Content -Path "$serviceDir\package.json"
                Write-Host "Added @multi-tenant/event-bus to $service package.json" -ForegroundColor Green
            }
        }
    }
    
    Write-Host "Library installation completed!" -ForegroundColor Green
}

function Test-Producer {
    Write-Host "Testing event producer functionality..." -ForegroundColor Green
    
    # First ensure Kafka is running
    $kafkaRunning = docker ps | Select-String "kafka"
    
    if (-not $kafkaRunning) {
        Write-Host "Kafka is not running. Starting Kafka cluster..." -ForegroundColor Yellow
        Set-Location $KafkaDir
        ./manage-kafka.ps1 start
        
        # Wait for Kafka to start
        Write-Host "Waiting for Kafka to start..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    }
    
    # Create test file
    $testProducerFile = "$KafkaDir\test-producer.js"
    
    @"
const { KafkaService } = require('@multi-tenant/event-bus');
const { v4: uuidv4 } = require('uuid');

async function main() {
  console.log('Initializing Kafka test producer...');
  
  const kafkaService = new KafkaService('test-service', {
    clientId: 'test-producer',
    brokers: ['localhost:29092'], // Use the external port for local testing
    retry: {
      initialRetryTime: 300,
      retries: 5
    }
  });
  
  try {
    console.log('Connecting to Kafka...');
    await kafkaService.connect();
    
    const testEvent = {
      id: uuidv4(),
      type: 'test.event',
      source: 'test-producer',
      time: new Date().toISOString(),
      dataVersion: '1.0',
      dataContentType: 'application/json',
      tenantId: 'test-tenant-1',
      data: {
        message: 'This is a test event',
        timestamp: Date.now()
      }
    };
    
    console.log('Producing test event:', testEvent);
    await kafkaService.produce('test.events', testEvent);
    
    console.log('Event produced successfully!');
  } catch (error) {
    console.error('Error producing event:', error);
  } finally {
    await kafkaService.disconnect();
    console.log('Disconnected from Kafka');
  }
}

main();
"@ | Set-Content -Path $testProducerFile

    # Create package.json for the test
    $testPackageJson = "$KafkaDir\test-package.json"
    
    @"
{
  "name": "kafka-test",
  "version": "1.0.0",
  "dependencies": {
    "@multi-tenant/event-bus": "^1.0.0",
    "uuid": "^9.0.1"
  }
}
"@ | Set-Content -Path $testPackageJson

    # Install dependencies
    Set-Location $KafkaDir
    Write-Host "Installing test dependencies..." -ForegroundColor Cyan
    npm install --package-lock-only --package-json=test-package.json
    npm ci --package-json=test-package.json
    
    # Link the library
    npm link @multi-tenant/event-bus
    
    # Run the test producer
    Write-Host "Running test producer..." -ForegroundColor Cyan
    node test-producer.js
    
    Write-Host "Test producer completed. Check Kafka UI at http://localhost:8080 to verify the event." -ForegroundColor Green
}

function Test-Consumer {
    Write-Host "Testing event consumer functionality..." -ForegroundColor Green
    
    # First ensure Kafka is running
    $kafkaRunning = docker ps | Select-String "kafka"
    
    if (-not $kafkaRunning) {
        Write-Host "Kafka is not running. Starting Kafka cluster..." -ForegroundColor Yellow
        Set-Location $KafkaDir
        ./manage-kafka.ps1 start
        
        # Wait for Kafka to start
        Write-Host "Waiting for Kafka to start..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    }
    
    # Create test file
    $testConsumerFile = "$KafkaDir\test-consumer.js"
    
    @"
const { KafkaService } = require('@multi-tenant/event-bus');

async function main() {
  console.log('Initializing Kafka test consumer...');
  
  const kafkaService = new KafkaService('test-service', {
    clientId: 'test-consumer',
    brokers: ['localhost:29092'], // Use the external port for local testing
    retry: {
      initialRetryTime: 300,
      retries: 5
    }
  });
  
  try {
    console.log('Connecting to Kafka...');
    await kafkaService.connect();
    
    console.log('Subscribing to test.events topic...');
    const stopConsumer = await kafkaService.subscribe(
      'test.events',
      async (message, event) => {
        console.log('Received event:');
        console.log('Type:', event.type);
        console.log('ID:', event.id);
        console.log('Source:', event.source);
        console.log('Time:', event.time);
        console.log('Tenant ID:', event.tenantId);
        console.log('Data:', JSON.stringify(event.data, null, 2));
        console.log('----------------------------');
      },
      { 
        groupId: 'test-consumer-group',
        fromBeginning: true
      }
    );
    
    console.log('Consumer started. Press Ctrl+C to stop...');
    
    // Keep the process running
    await new Promise(resolve => {
      process.on('SIGINT', async () => {
        console.log('Stopping consumer...');
        await stopConsumer();
        resolve();
      });
    });
  } catch (error) {
    console.error('Error consuming events:', error);
  } finally {
    await kafkaService.disconnect();
    console.log('Disconnected from Kafka');
  }
}

main();
"@ | Set-Content -Path $testConsumerFile

    # Run the test consumer
    Set-Location $KafkaDir
    Write-Host "Running test consumer. Press Ctrl+C to stop..." -ForegroundColor Cyan
    node test-consumer.js
}

function Setup-EventStoreDb {
    Write-Host "Setting up event store database tables..." -ForegroundColor Green
    
    # Get the PostgreSQL connection info
    $pgUser = "postgres"
    $pgPassword = "postgres" # This should be retrieved securely in production
    $pgHost = "localhost"
    $pgPort = "5432"
    $pgDb = "system_db"
    
    # Run the SQL script
    $sqlScriptPath = "$KafkaDir\event-sourcing\event-store-schema.sql"
    
    if (-not (Test-Path $sqlScriptPath)) {
        Write-Error "Event store SQL script not found at $sqlScriptPath"
        exit 1
    }
    
    Write-Host "Running event store schema SQL script..." -ForegroundColor Cyan
    
    try {
        # Using docker to run psql against the PostgreSQL container
        $container = docker ps --filter "name=postgres" --format "{{.Names}}" | Select-Object -First 1
        
        if (-not $container) {
            Write-Warning "PostgreSQL container not found. Assuming PostgreSQL is installed locally."
            
            # Try with local psql
            psql -U $pgUser -h $pgHost -p $pgPort -d $pgDb -f $sqlScriptPath
        } else {
            # Copy script to container
            docker cp $sqlScriptPath "${container}:/tmp/event-store-schema.sql"
            
            # Run the script
            docker exec -i $container psql -U $pgUser -d $pgDb -f /tmp/event-store-schema.sql
        }
        
        Write-Host "Event store database setup completed successfully!" -ForegroundColor Green
    } catch {
        Write-Error "Failed to set up event store database: $_"
        exit 1
    }
}

function Get-KafkaStatus {
    Write-Host "Checking Kafka setup status..." -ForegroundColor Cyan
    
    # Check if Kafka is running
    $kafkaRunning = docker ps | Select-String "kafka"
    
    if ($kafkaRunning) {
        Write-Host "✅ Kafka cluster is running" -ForegroundColor Green
        
        # Check topics
        $topics = docker exec kafka kafka-topics --bootstrap-server kafka:9092 --list
        Write-Host "Kafka topics:" -ForegroundColor Cyan
        $topics | ForEach-Object { Write-Host "  - $_" }
        
        # Check event-bus library
        $libPath = "$KafkaDir\lib"
        if (Test-Path "$libPath\dist") {
            Write-Host "✅ event-bus library is built" -ForegroundColor Green
        } else {
            Write-Host "❌ event-bus library is not built. Run ./setup-kafka.ps1 install-lib" -ForegroundColor Red
        }
        
        # Check service integration
        $services = @(
            "tenant-service",
            "notification-service"
        )
        
        Write-Host "Service integration:" -ForegroundColor Cyan
        foreach ($service in $services) {
            $serviceDir = "d:\www\multi-tenant\$service"
            
            if (Test-Path "$serviceDir\src\modules\kafka") {
                Write-Host "✅ $service has Kafka integration" -ForegroundColor Green
            } else {
                Write-Host "❌ $service does not have Kafka integration" -ForegroundColor Red
            }
        }
        
        Write-Host "`nRecommended next steps:" -ForegroundColor Yellow
        Write-Host "1. Install the event-bus library in all services: ./setup-kafka.ps1 install-lib" -ForegroundColor Yellow
        Write-Host "2. Test the producer functionality: ./setup-kafka.ps1 test-producer" -ForegroundColor Yellow
        Write-Host "3. Test the consumer functionality: ./setup-kafka.ps1 test-consumer" -ForegroundColor Yellow
        Write-Host "4. Set up the event store database: ./setup-kafka.ps1 setup-db" -ForegroundColor Yellow
        Write-Host "5. Check the README.md for more details on using the Message Broker" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Kafka cluster is not running. Start it with ./manage-kafka.ps1 start" -ForegroundColor Red
    }
}

# Main script execution
switch ($Action) {
    "install-lib" { 
        Install-Library
    }
    "test-producer" { 
        Test-Producer 
    }
    "test-consumer" { 
        Test-Consumer 
    }
    "setup-db" { 
        Setup-EventStoreDb 
    }
    "status" { 
        Get-KafkaStatus 
    }
    default {
        Write-Host "Invalid action. Supported actions: install-lib, test-producer, test-consumer, setup-db, status" -ForegroundColor Red
    }
}
