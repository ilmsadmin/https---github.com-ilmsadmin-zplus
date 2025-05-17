# Kong API Gateway deployment script for multi-tenant system (PowerShell version)

# Set default namespace
$NAMESPACE = "multi-tenant"
$KONG_VERSION = "3.2"
$DEPLOY_PROMETHEUS = $true
$DEPLOY_ELK = $true

# Display banner
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "        Kong API Gateway Deployment Script        " -ForegroundColor Cyan
Write-Host "         Multi-Tenant System - API Gateway        " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Function to display usage
function Show-Usage {
  Write-Host "Usage: .\deploy-kong.ps1 [OPTIONS]" -ForegroundColor Yellow
  Write-Host "Options:"
  Write-Host "  -Namespace NAMESPACE   Kubernetes namespace (default: multi-tenant)"
  Write-Host "  -Version VERSION       Kong version (default: 3.2)"
  Write-Host "  -NoPrometheus          Skip Prometheus deployment"
  Write-Host "  -NoELK                 Skip ELK Stack deployment"
  Write-Host "  -Help                  Display this help message"
  exit 1
}

# Parse command line arguments
param(
  [string]$Namespace = "multi-tenant",
  [string]$Version = "3.2",
  [switch]$NoPrometheus,
  [switch]$NoELK,
  [switch]$Help
)

if ($Help) {
  Show-Usage
}

if ($NoPrometheus) {
  $DEPLOY_PROMETHEUS = $false
}

if ($NoELK) {
  $DEPLOY_ELK = $false
}

$NAMESPACE = $Namespace
$KONG_VERSION = $Version

Write-Host "Using namespace: $NAMESPACE"
Write-Host "Kong version: $KONG_VERSION"
Write-Host "Deploy Prometheus: $DEPLOY_PROMETHEUS"
Write-Host "Deploy ELK Stack: $DEPLOY_ELK"

# Create namespace if it doesn't exist
try {
  kubectl get namespace $NAMESPACE | Out-Null
} catch {
  Write-Host "Creating namespace $NAMESPACE..." -ForegroundColor Green
  kubectl create namespace $NAMESPACE
}

# Apply secrets
Write-Host "Applying secrets..." -ForegroundColor Green
kubectl apply -f kubernetes/config-maps/kong-database-secret.yaml

# Apply ConfigMaps
Write-Host "Applying ConfigMaps..." -ForegroundColor Green
kubectl apply -f kubernetes/config-maps/kong-plugins-configmap.yaml
kubectl apply -f kubernetes/config-maps/kong-config-configmap.yaml

# Apply persistent volume claims
Write-Host "Creating persistent volumes..." -ForegroundColor Green
kubectl apply -f kubernetes/deployments/kong-database-pvc.yaml

# Deploy Kong database
Write-Host "Deploying Kong database..." -ForegroundColor Green
kubectl apply -f kubernetes/deployments/kong-database-deployment.yaml
kubectl apply -f kubernetes/services/kong-database-service.yaml

# Wait for database to be ready
Write-Host "Waiting for database to be ready..." -ForegroundColor Green
kubectl wait --for=condition=available --timeout=300s deployment/kong-database -n $NAMESPACE

# Run Kong migrations
Write-Host "Running Kong migrations..." -ForegroundColor Green
try {
  kubectl create job kong-migrations --namespace=$NAMESPACE --from=cronjob/kong-migrations
} catch {
  Write-Host "Migration job already exists or cronjob not found, continuing..." -ForegroundColor Yellow
}

# Wait for migrations to complete
Write-Host "Waiting for migrations to complete..." -ForegroundColor Green
try {
  kubectl wait --for=condition=complete --timeout=300s job/kong-migrations -n $NAMESPACE
} catch {
  Write-Host "Could not wait for migrations, continuing..." -ForegroundColor Yellow
}

# Deploy Kong Gateway
Write-Host "Deploying Kong Gateway..." -ForegroundColor Green
kubectl apply -f kubernetes/deployments/kong-deployment.yaml
kubectl apply -f kubernetes/services/kong-service.yaml

# Deploy ingress
Write-Host "Deploying ingress..." -ForegroundColor Green
kubectl apply -f kubernetes/ingress/kong-gateway-ingress.yaml

# Deploy Prometheus if enabled
if ($DEPLOY_PROMETHEUS) {
  Write-Host "Deploying Prometheus and Grafana..." -ForegroundColor Green
  kubectl apply -f monitoring/prometheus/prometheus-configmap.yaml
  kubectl apply -f monitoring/prometheus/prometheus-deployment.yaml
  kubectl apply -f monitoring/prometheus/prometheus-service.yaml
  
  kubectl apply -f monitoring/grafana/grafana-configmap.yaml
  kubectl apply -f monitoring/grafana/grafana-deployment.yaml
  kubectl apply -f monitoring/grafana/grafana-service.yaml
  kubectl apply -f monitoring/grafana/grafana-ingress.yaml
}

# Deploy ELK Stack if enabled
if ($DEPLOY_ELK) {
  Write-Host "Deploying ELK Stack..." -ForegroundColor Green
  kubectl apply -f monitoring/elk/elasticsearch-deployment.yaml
  kubectl apply -f monitoring/elk/elasticsearch-service.yaml
  
  kubectl apply -f monitoring/elk/logstash-configmap.yaml
  kubectl apply -f monitoring/elk/logstash-deployment.yaml
  kubectl apply -f monitoring/elk/logstash-service.yaml
  
  kubectl apply -f monitoring/elk/kibana-deployment.yaml
  kubectl apply -f monitoring/elk/kibana-service.yaml
  kubectl apply -f monitoring/elk/kibana-ingress.yaml
}

# Wait for Kong to be ready
Write-Host "Waiting for Kong Gateway to be ready..." -ForegroundColor Green
kubectl wait --for=condition=available --timeout=300s deployment/kong-gateway -n $NAMESPACE

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "      Kong API Gateway Deployment Complete        " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Kong Gateway: https://example.com"
if ($DEPLOY_PROMETHEUS) {
  Write-Host "Grafana: https://grafana.example.com"
}
if ($DEPLOY_ELK) {
  Write-Host "Kibana: https://kibana.example.com"
}
Write-Host "==================================================" -ForegroundColor Cyan
