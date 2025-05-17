#!/bin/bash
# Kong API Gateway deployment script for multi-tenant system

set -e

# Set default namespace
NAMESPACE="multi-tenant"
KONG_VERSION="3.2"
DEPLOY_PROMETHEUS="true"
DEPLOY_ELK="true"

# Display banner
echo "=================================================="
echo "        Kong API Gateway Deployment Script        "
echo "         Multi-Tenant System - API Gateway        "
echo "=================================================="

# Function to display usage
usage() {
  echo "Usage: $0 [OPTIONS]"
  echo "Options:"
  echo "  -n, --namespace NAMESPACE  Kubernetes namespace (default: multi-tenant)"
  echo "  -v, --version VERSION      Kong version (default: 3.2)"
  echo "  --no-prometheus            Skip Prometheus deployment"
  echo "  --no-elk                   Skip ELK Stack deployment"
  echo "  -h, --help                 Display this help message"
  exit 1
}

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    -n|--namespace) NAMESPACE="$2"; shift ;;
    -v|--version) KONG_VERSION="$2"; shift ;;
    --no-prometheus) DEPLOY_PROMETHEUS="false" ;;
    --no-elk) DEPLOY_ELK="false" ;;
    -h|--help) usage ;;
    *) echo "Unknown parameter: $1"; usage ;;
  esac
  shift
done

echo "Using namespace: $NAMESPACE"
echo "Kong version: $KONG_VERSION"
echo "Deploy Prometheus: $DEPLOY_PROMETHEUS"
echo "Deploy ELK Stack: $DEPLOY_ELK"

# Create namespace if it doesn't exist
kubectl get namespace $NAMESPACE > /dev/null 2>&1 || kubectl create namespace $NAMESPACE

# Apply secrets
echo "Applying secrets..."
kubectl apply -f kubernetes/config-maps/kong-database-secret.yaml

# Apply ConfigMaps
echo "Applying ConfigMaps..."
kubectl apply -f kubernetes/config-maps/kong-plugins-configmap.yaml
kubectl apply -f kubernetes/config-maps/kong-config-configmap.yaml

# Apply persistent volume claims
echo "Creating persistent volumes..."
kubectl apply -f kubernetes/deployments/kong-database-pvc.yaml

# Deploy Kong database
echo "Deploying Kong database..."
kubectl apply -f kubernetes/deployments/kong-database-deployment.yaml
kubectl apply -f kubernetes/services/kong-database-service.yaml

# Wait for database to be ready
echo "Waiting for database to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/kong-database -n $NAMESPACE

# Run Kong migrations
echo "Running Kong migrations..."
kubectl create job kong-migrations \
  --namespace=$NAMESPACE \
  --from=cronjob/kong-migrations \
  || true

# Wait for migrations to complete
echo "Waiting for migrations to complete..."
kubectl wait --for=condition=complete --timeout=300s job/kong-migrations -n $NAMESPACE

# Deploy Kong Gateway
echo "Deploying Kong Gateway..."
kubectl apply -f kubernetes/deployments/kong-deployment.yaml
kubectl apply -f kubernetes/services/kong-service.yaml

# Deploy ingress
echo "Deploying ingress..."
kubectl apply -f kubernetes/ingress/kong-gateway-ingress.yaml

# Deploy Prometheus if enabled
if [ "$DEPLOY_PROMETHEUS" = "true" ]; then
  echo "Deploying Prometheus and Grafana..."
  kubectl apply -f monitoring/prometheus/prometheus-configmap.yaml
  kubectl apply -f monitoring/prometheus/prometheus-deployment.yaml
  kubectl apply -f monitoring/prometheus/prometheus-service.yaml
  
  kubectl apply -f monitoring/grafana/grafana-configmap.yaml
  kubectl apply -f monitoring/grafana/grafana-deployment.yaml
  kubectl apply -f monitoring/grafana/grafana-service.yaml
  kubectl apply -f monitoring/grafana/grafana-ingress.yaml
fi

# Deploy ELK Stack if enabled
if [ "$DEPLOY_ELK" = "true" ]; then
  echo "Deploying ELK Stack..."
  kubectl apply -f monitoring/elk/elasticsearch-deployment.yaml
  kubectl apply -f monitoring/elk/elasticsearch-service.yaml
  
  kubectl apply -f monitoring/elk/logstash-configmap.yaml
  kubectl apply -f monitoring/elk/logstash-deployment.yaml
  kubectl apply -f monitoring/elk/logstash-service.yaml
  
  kubectl apply -f monitoring/elk/kibana-deployment.yaml
  kubectl apply -f monitoring/elk/kibana-service.yaml
  kubectl apply -f monitoring/elk/kibana-ingress.yaml
fi

# Wait for Kong to be ready
echo "Waiting for Kong Gateway to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/kong-gateway -n $NAMESPACE

echo "=================================================="
echo "      Kong API Gateway Deployment Complete        "
echo "=================================================="
echo "Kong Gateway: https://example.com"
if [ "$DEPLOY_PROMETHEUS" = "true" ]; then
  echo "Grafana: https://grafana.example.com"
fi
if [ "$DEPLOY_ELK" = "true" ]; then
  echo "Kibana: https://kibana.example.com"
fi
echo "=================================================="
