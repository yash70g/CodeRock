#!/bin/bash

# Quick Azure Deployment Script
# Usage: ./scripts/azure-quick-deploy.sh <registry-name> <resource-group>

set -e

REGISTRY_NAME=${1:-codesphereregistry}
RESOURCE_GROUP=${2:-codesphere-rg}
LOCATION=${3:-eastus}
REGISTRY_URL="${REGISTRY_NAME}.azurecr.io"

echo "=================================="
echo "CodeRoom - Azure Quick Deploy"
echo "=================================="
echo "Registry: $REGISTRY_NAME"
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo ""

# Check prerequisites
if ! command -v az &> /dev/null; then
    echo "Error: Azure CLI not installed"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "Error: Docker not installed"
    exit 1
fi

# Create resource group
echo "Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create registry
echo "Creating container registry..."
az acr create --resource-group $RESOURCE_GROUP --name $REGISTRY_NAME --sku Basic --admin-enabled true

# Login to registry
echo "Logging in to registry..."
az acr login --name $REGISTRY_NAME

# Build and push images
echo "Building backend image..."
docker build -t $REGISTRY_URL/backend:latest -f Backend.Dockerfile .
docker push $REGISTRY_URL/backend:latest

echo "Building frontend image..."
docker build -t $REGISTRY_URL/frontend:latest -f Frontend/Dockerfile ./Frontend
docker push $REGISTRY_URL/frontend:latest

echo ""
echo "=================================="
echo "✓ Images pushed to Azure"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Get ACR credentials:"
echo "   az acr credential show --name $REGISTRY_NAME"
echo ""
echo "2. Deploy using docker-compose.azure.yml"
echo ""
echo "3. Or deploy to App Service:"
echo "   ./scripts/azure-appservice-deploy.sh"
