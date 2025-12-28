#!/bin/bash

# Azure Deployment Script for CodeRoom
# This script deploys the application to Azure Container Instances

set -e

# Configuration
RESOURCE_GROUP="${RESOURCE_GROUP:-coderoom-rg}"
REGISTRY_NAME="${REGISTRY_NAME:-coderoomregistry}"
REGISTRY_URL="${REGISTRY_NAME}.azurecr.io"
LOCATION="${LOCATION:-eastus}"
CONTAINER_GROUP_NAME="${CONTAINER_GROUP_NAME:-coderoom-app}"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}CodeRoom - Azure Deployment Script${NC}"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Azure CLI not found. Please install it first.${NC}"
    exit 1
fi

# 1. Login to Azure
echo -e "${YELLOW}Logging in to Azure...${NC}"
az login

# 2. Create resource group
echo -e "${YELLOW}Creating resource group: $RESOURCE_GROUP${NC}"
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# 3. Create Container Registry
echo -e "${YELLOW}Creating Azure Container Registry: $REGISTRY_NAME${NC}"
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $REGISTRY_NAME \
  --sku Basic \
  --admin-enabled true

# 4. Get ACR credentials
echo -e "${YELLOW}Retrieving ACR credentials...${NC}"
ACR_USERNAME=$(az acr credential show --resource-group $RESOURCE_GROUP --name $REGISTRY_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --resource-group $RESOURCE_GROUP --name $REGISTRY_NAME --query 'passwords[0].value' -o tsv)

echo -e "${YELLOW}ACR Registry URL: $REGISTRY_URL${NC}"
echo -e "${YELLOW}ACR Username: $ACR_USERNAME${NC}"

# 5. Build and push images
echo -e "${YELLOW}Building Docker images...${NC}"
docker build -t $REGISTRY_URL/backend:latest -f Backend.Dockerfile .
docker build -t $REGISTRY_URL/frontend:latest -f Frontend/Dockerfile ./Frontend

# 6. Login to ACR
echo -e "${YELLOW}Logging in to Azure Container Registry...${NC}"
az acr login --name $REGISTRY_NAME

# 7. Push images
echo -e "${YELLOW}Pushing images to ACR...${NC}"
docker push $REGISTRY_URL/backend:latest
docker push $REGISTRY_URL/frontend:latest

# 8. Create storage account for persistent storage
echo -e "${YELLOW}Creating storage account for persistent data...${NC}"
STORAGE_ACCOUNT_NAME="coderoom${RANDOM}"
az storage account create \
  --resource-group $RESOURCE_GROUP \
  --name $STORAGE_ACCOUNT_NAME \
  --sku Standard_LRS

# 9. Create file shares
echo -e "${YELLOW}Creating file shares...${NC}"
STORAGE_KEY=$(az storage account keys list --resource-group $RESOURCE_GROUP --account-name $STORAGE_ACCOUNT_NAME --query '[0].value' -o tsv)

az storage share create \
  --account-name $STORAGE_ACCOUNT_NAME \
  --account-key $STORAGE_KEY \
  --name backend-data

az storage share create \
  --account-name $STORAGE_ACCOUNT_NAME \
  --account-key $STORAGE_KEY \
  --name mongo-data

# 10. Create container group
echo -e "${YELLOW}Creating container group in Azure...${NC}"
echo "This will use the docker-compose.azure.yml configuration"
echo "Make sure you have set the required environment variables:"
echo "  - DB_USERNAME"
echo "  - DB_PASSWORD"
echo "  - BackendHost"
echo "  - JWT_SECRET_KEY"
echo "  - GEMINI_API_KEY"
echo "  - REACT_APP_SERVER_URL"
echo "  - REACT_APP_SERVER_WS_URL"

echo -e "${GREEN}Deployment setup complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update your environment variables in a .env.azure file"
echo "2. Deploy to Azure App Service or Container Instances"
echo "3. Use 'azure-deploy.sh' as a reference for automated deployment"
