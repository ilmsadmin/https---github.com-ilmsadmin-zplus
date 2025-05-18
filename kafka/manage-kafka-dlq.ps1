#!/bin/pwsh
# Script to monitor and manage Kafka DLQ and failed messages

param(
    [Parameter()]
    [ValidateSet("list-dlq", "process-dlq", "retry-failed", "discard-failed", "monitor-lag", "topic-info")]
    [string]$Action = "list-dlq",
    
    [Parameter()]
    [string]$SourceTopic,
    
    [Parameter()]
    [string]$MessageId,
    
    [Parameter()]
    [string]$ConsumerGroup
)

$ErrorActionPreference = "Stop"
$KafkaDir = "d:\www\multi-tenant\kafka"

function Get-DlqTopicName {
    param([string]$SourceTopic)
    
    return "$SourceTopic.dlq"
}

function Get-DlqTopics {
    Write-Host "Listing all DLQ topics..." -ForegroundColor Cyan
    
    docker exec -it kafka kafka-topics --bootstrap-server kafka:9092 --list | Where-Object { $_ -like "*.dlq" }
}

function Get-DlqMessages {
    param([string]$SourceTopic)
    
    if (-not $SourceTopic) {
        Write-Error "Source topic is required. Use -SourceTopic parameter."
        exit 1
    }
    
    $dlqTopic = Get-DlqTopicName -SourceTopic $SourceTopic
    
    Write-Host "Displaying messages in DLQ topic '$dlqTopic'..." -ForegroundColor Cyan
    
    # Get messages from DLQ with headers and output in JSON format
    docker exec -it kafka kafka-console-consumer --bootstrap-server kafka:9092 `
        --topic $dlqTopic `
        --from-beginning `
        --property print.key=true `
        --property print.headers=true `
        --property print.timestamp=true `
        --max-messages 25 `
        --formatter kafka.tools.DefaultMessageFormatter `
        --property print.value=true
}

function Start-DlqProcessor {
    param([string]$SourceTopic)
    
    if (-not $SourceTopic) {
        Write-Error "Source topic is required. Use -SourceTopic parameter."
        exit 1
    }
    
    $dlqTopic = Get-DlqTopicName -SourceTopic $SourceTopic
    
    Write-Host "Starting interactive DLQ processor for '$dlqTopic'..." -ForegroundColor Green
    Write-Host "This will let you review each failed message and choose to retry or discard it." -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to exit when done." -ForegroundColor Yellow
    
    # Simple interactive DLQ processor - in real production would be a more robust tool
    docker exec -it kafka kafka-console-consumer --bootstrap-server kafka:9092 `
        --topic $dlqTopic `
        --from-beginning `
        --property print.key=true `
        --property print.headers=true `
        --property print.timestamp=true `
        --formatter kafka.tools.DefaultMessageFormatter `
        --property print.value=true
    
    Write-Host "DLQ processing completed." -ForegroundColor Green
    Write-Host "To retry specific messages, use: ./manage-kafka-dlq.ps1 retry-failed -SourceTopic $SourceTopic -MessageId <message-id>" -ForegroundColor Cyan
}

function Retry-FailedMessage {
    param(
        [string]$SourceTopic,
        [string]$MessageId
    )
    
    if (-not $SourceTopic) {
        Write-Error "Source topic is required. Use -SourceTopic parameter."
        exit 1
    }
    
    if (-not $MessageId) {
        Write-Error "Message ID is required. Use -MessageId parameter."
        exit 1
    }
    
    Write-Host "Attempting to retry message $MessageId from $SourceTopic.dlq to $SourceTopic..." -ForegroundColor Green
    
    # In a real implementation, this would retrieve the message from the DLQ, 
    # transform it if needed, and send it back to the original topic
    # This is a simplified placeholder
    
    Write-Host "Message $MessageId retried from $SourceTopic.dlq to $SourceTopic (simulation only)." -ForegroundColor Green
    Write-Host "In a real implementation, this would move the message from the DLQ back to the original topic." -ForegroundColor Yellow
}

function Discard-FailedMessage {
    param(
        [string]$SourceTopic,
        [string]$MessageId
    )
    
    if (-not $SourceTopic) {
        Write-Error "Source topic is required. Use -SourceTopic parameter."
        exit 1
    }
    
    if (-not $MessageId) {
        Write-Error "Message ID is required. Use -MessageId parameter."
        exit 1
    }
    
    Write-Host "Marking message $MessageId from $SourceTopic.dlq as discarded..." -ForegroundColor Yellow
    
    # In a real implementation, this would either delete the message or move it to a "discarded" topic
    # This is a simplified placeholder
    
    Write-Host "Message $MessageId marked as discarded (simulation only)." -ForegroundColor Yellow
    Write-Host "In a real implementation, this would remove the message from the DLQ or mark it as processed." -ForegroundColor Yellow
}

function Get-ConsumerLag {
    param([string]$ConsumerGroup)
    
    if (-not $ConsumerGroup) {
        Write-Error "Consumer group is required. Use -ConsumerGroup parameter."
        exit 1
    }
    
    Write-Host "Checking consumer lag for group '$ConsumerGroup'..." -ForegroundColor Cyan
    
    docker exec -it kafka kafka-consumer-groups --bootstrap-server kafka:9092 `
        --describe --group $ConsumerGroup
}

function Get-TopicInfo {
    param([string]$SourceTopic)
    
    if (-not $SourceTopic) {
        Write-Error "Topic is required. Use -SourceTopic parameter."
        exit 1
    }
    
    Write-Host "Getting detailed information for topic '$SourceTopic'..." -ForegroundColor Cyan
    
    docker exec -it kafka kafka-topics --bootstrap-server kafka:9092 `
        --describe --topic $SourceTopic
}

# Main script execution
switch ($Action) {
    "list-dlq" { 
        Get-DlqTopics 
    }
    "process-dlq" { 
        Get-DlqMessages -SourceTopic $SourceTopic
        Start-DlqProcessor -SourceTopic $SourceTopic 
    }
    "retry-failed" { 
        Retry-FailedMessage -SourceTopic $SourceTopic -MessageId $MessageId 
    }
    "discard-failed" { 
        Discard-FailedMessage -SourceTopic $SourceTopic -MessageId $MessageId 
    }
    "monitor-lag" { 
        Get-ConsumerLag -ConsumerGroup $ConsumerGroup 
    }
    "topic-info" { 
        Get-TopicInfo -SourceTopic $SourceTopic 
    }
    default {
        Write-Host "Invalid action. Supported actions: list-dlq, process-dlq, retry-failed, discard-failed, monitor-lag, topic-info" -ForegroundColor Red
    }
}
