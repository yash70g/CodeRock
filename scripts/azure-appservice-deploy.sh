#!/bin/bash

# Azure App Service Deployment Script

set -e

REGISTRY_NAME=${1:-codesphereregistry}
RESOURCE_GROUP=${2:-codesphere-rg}
FRONTEND_APP=${3:-coderoom-frontend}
BACKEND_APP=${4:-coderoom-backend}
PLAN_NAME=${5:-coderoom-plan}
LOCATION=${6:-eastus}

echo "Deploying to Azure App Service..."

# Get ACR credentials
ACR_USER=$(az acr credential show --name $REGISTRY_NAME --resource-group $RESOURCE_GROUP --query username -o tsv)
ACR_PASS=$(az acr credential show --name $REGISTRY_NAME --resource-group $RESOURCE_GROUP --query 'passwords[0].value' -o tsv)
REGISTRY_URL="https://$REGISTRY_NAME.azurecr.io"

# Create App Service plan
echo "Creating App Service plan..."
az appservice plan create \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku B2 \
  --is-linux || true

# Create frontend app
echo "Creating frontend app..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $PLAN_NAME \
  --name $FRONTEND_APP \
  --deployment-container-image-name "$REGISTRY_NAME.azurecr.io/frontend:latest" || true

# Configure frontend
az webapp config container set \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name "$REGISTRY_NAME.azurecr.io/frontend:latest" \
  --docker-registry-server-url "$REGISTRY_URL" \
  --docker-registry-server-user "$ACR_USER" \
  --docker-registry-server-password "$ACR_PASS"

az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $FRONTEND_APP \
  --settings \
    REACT_APP_SERVER_URL="https://$BACKEND_APP.azurewebsites.net" \
    REACT_APP_SERVER_WS_URL="wss://$BACKEND_APP.azurewebsites.net"

# Create backend app
echo "Creating backend app..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $PLAN_NAME \
  --name $BACKEND_APP \
  --deployment-container-image-name "$REGISTRY_NAME.azurecr.io/backend:latest" || true

# Configure backend
az webapp config container set \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name "$REGISTRY_NAME.azurecr.io/backend:latest" \
  --docker-registry-server-url "$REGISTRY_URL" \
  --docker-registry-server-user "$ACR_USER" \
  --docker-registry-server-password "$ACR_PASS"

echo ""
echo "✓ Deployment complete!"
echo ""
echo "Frontend: https://$FRONTEND_APP.azurewebsites.net"
echo "Backend: https://$BACKEND_APP.azurewebsites.net"
echo ""
echo "Configure app settings:"
echo "az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $BACKEND_APP --settings <KEY>=<VALUE>"
