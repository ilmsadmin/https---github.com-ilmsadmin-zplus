#!/bin/pwsh
# Script to manage Kafka cluster for multi-tenant system

param(
    [Parameter()]
    [ValidateSet("start", "stop", "status", "restart", "logs", "create-topic", "list-topics", "producer", "consumer")]
    [string]$Action = "start",
    
    [Parameter()]
    [string]$TopicName,
    
    [Parameter()]
    [string]$ServiceName,
    
    [Parameter()]
    [int]$Partitions = 3,
    
    [Parameter()]
    [int]$ReplicationFactor = 1
)

$ErrorActionPreference = "Stop"
$KafkaDir = "d:\www\multi-tenant\kafka"

function Start-KafkaCluster {
    Write-Host "Starting Kafka cluster..." -ForegroundColor Green
    
    if (-not (Test-Path $KafkaDir)) {
        Write-Error "Kafka directory not found at $KafkaDir"
        exit 1
    }
    
    Set-Location $KafkaDir
    docker-compose up -d
    
    Write-Host "Kafka cluster is starting up. Services will be available shortly." -ForegroundColor Green
    Write-Host "Access Kafka UI at http://localhost:8080" -ForegroundColor Cyan
}

function Stop-KafkaCluster {
    Write-Host "Stopping Kafka cluster..." -ForegroundColor Yellow
    
    if (-not (Test-Path $KafkaDir)) {
        Write-Error "Kafka directory not found at $KafkaDir"
        exit 1
    }
    
    Set-Location $KafkaDir
    docker-compose down
    
    Write-Host "Kafka cluster stopped." -ForegroundColor Yellow
}

function Restart-KafkaCluster {
    Stop-KafkaCluster
    Start-Sleep -Seconds 3
    Start-KafkaCluster
}

function Get-KafkaStatus {
    Write-Host "Checking Kafka cluster status..." -ForegroundColor Cyan
    
    if (-not (Test-Path $KafkaDir)) {
        Write-Error "Kafka directory not found at $KafkaDir"
        exit 1
    }
    
    Set-Location $KafkaDir
    docker-compose ps
}

function Get-KafkaLogs {
    Write-Host "Fetching Kafka logs..." -ForegroundColor Cyan
    
    if (-not (Test-Path $KafkaDir)) {
        Write-Error "Kafka directory not found at $KafkaDir"
        exit 1
    }
    
    Set-Location $KafkaDir
    
    if ($ServiceName) {
        docker-compose logs --tail=100 -f $ServiceName
    } else {
        docker-compose logs --tail=50 -f
    }
}

function New-KafkaTopic {
    if (-not $TopicName) {
        Write-Error "Topic name is required. Use -TopicName parameter."
        exit 1
    }
    
    Write-Host "Creating Kafka topic '$TopicName' with $Partitions partitions and replication factor $ReplicationFactor..." -ForegroundColor Green
    
    docker exec -it kafka kafka-topics --bootstrap-server kafka:9092 --create --if-not-exists --topic $TopicName --partitions $Partitions --replication-factor $ReplicationFactor
    
    Write-Host "Topic '$TopicName' created successfully." -ForegroundColor Green
}

function Get-KafkaTopics {
    Write-Host "Listing Kafka topics..." -ForegroundColor Cyan
    
    docker exec -it kafka kafka-topics --bootstrap-server kafka:9092 --list
}

function Start-KafkaProducer {
    if (-not $TopicName) {
        Write-Error "Topic name is required. Use -TopicName parameter."
        exit 1
    }
    
    Write-Host "Starting Kafka producer for topic '$TopicName'..." -ForegroundColor Green
    Write-Host "Type messages to send. Press Ctrl+C to exit." -ForegroundColor Yellow
    
    docker exec -it kafka kafka-console-producer --bootstrap-server kafka:9092 --topic $TopicName
}

function Start-KafkaConsumer {
    if (-not $TopicName) {
        Write-Error "Topic name is required. Use -TopicName parameter."
        exit 1
    }
    
    Write-Host "Starting Kafka consumer for topic '$TopicName'..." -ForegroundColor Green
    Write-Host "Listening for messages. Press Ctrl+C to exit." -ForegroundColor Yellow
    
    docker exec -it kafka kafka-console-consumer --bootstrap-server kafka:9092 --topic $TopicName --from-beginning
}

# Main script execution
switch ($Action) {
    "start" { 
        Start-KafkaCluster 
    }
    "stop" { 
        Stop-KafkaCluster 
    }
    "restart" { 
        Restart-KafkaCluster 
    }
    "status" { 
        Get-KafkaStatus 
    }
    "logs" { 
        Get-KafkaLogs 
    }
    "create-topic" { 
        New-KafkaTopic 
    }
    "list-topics" { 
        Get-KafkaTopics 
    }
    "producer" { 
        Start-KafkaProducer 
    }
    "consumer" { 
        Start-KafkaConsumer 
    }
    default {
        Write-Host "Invalid action. Supported actions: start, stop, status, restart, logs, create-topic, list-topics, producer, consumer" -ForegroundColor Red
    }
}
