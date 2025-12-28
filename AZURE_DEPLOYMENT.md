# Azure Cloud Deployment Guide for CodeRoom

This guide walks you through deploying CodeRoom to Microsoft Azure Cloud.

## Deployment Options

### Option 1: Azure Container Instances (Quickest)
Best for: Small deployments, testing

### Option 2: Azure App Service with Docker
Best for: Production, auto-scaling, managed service

### Option 3: Azure Kubernetes Service (AKS)
Best for: Large-scale, high availability

## Prerequisites

1. **Azure Account** - Create at https://azure.microsoft.com
2. **Azure CLI** - Download from https://learn.microsoft.com/en-us/cli/azure/install-azure-cli
3. **Docker** - For building and pushing images
4. **GitHub Account** (optional) - For CI/CD pipeline

## Step 1: Set Up Azure Resources

### Create Resource Group
```bash
az group create \
  --name coderoom-rg \
  --location eastus
```

### Create Container Registry
```bash
az acr create \
  --resource-group coderoom-rg \
  --name coderoomregistry \
  --sku Basic
```

Get registry credentials:
```bash
az acr credential show \
  --resource-group coderoom-rg \
  --name coderoomregistry
```

## Step 2: Build and Push Images to Azure Container Registry

### Login to ACR
```bash
az acr login --name coderoomregistry
```

### Build and Push Images
```bash
# Build backend
docker build -t coderoomregistry.azurecr.io/backend:latest -f Backend.Dockerfile .
docker push coderoomregistry.azurecr.io/backend:latest

# Build frontend
docker build -t coderoomregistry.azurecr.io/frontend:latest -f Frontend/Dockerfile ./Frontend
docker push coderoomregistry.azurecr.io/frontend:latest
```

## Step 3: Deploy to Azure App Service (Recommended)

### Create App Service Plan
```bash
az appservice plan create \
  --name coderoom-plan \
  --resource-group coderoom-rg \
  --sku B2 \
  --is-linux
```

### Create Frontend Web App
```bash
az webapp create \
  --resource-group coderoom-rg \
  --plan coderoom-plan \
  --name coderoom-frontend \
  --deployment-container-image-name coderoomregistry.azurecr.io/frontend:latest

az webapp config container set \
  --name coderoom-frontend \
  --resource-group coderoom-rg \
  --docker-custom-image-name coderoomregistry.azurecr.io/frontend:latest \
  --docker-registry-server-url https://codesphereregistry.azurecr.io \
  --docker-registry-server-user <ACR_USERNAME> \
  --docker-registry-server-password <ACR_PASSWORD>

# Configure environment variables
az webapp config appsettings set \
  --resource-group coderoom-rg \
  --name coderoom-frontend \
  --settings \
    REACT_APP_SERVER_URL="https://codesphere-backend.azurewebsites.net" \
    REACT_APP_SERVER_WS_URL="wss://codesphere-backend.azurewebsites.net"
```

### Create Backend Web App
```bash
az webapp create \
  --resource-group codesphere-rg \
  --plan codesphere-plan \
  --name codesphere-backend \
  --deployment-container-image-name codesphereregistry.azurecr.io/backend:latest

az webapp config container set \
  --name codesphere-backend \
  --resource-group codesphere-rg \
  --docker-custom-image-name codesphereregistry.azurecr.io/backend:latest \
  --docker-registry-server-url https://codesphereregistry.azurecr.io \
  --docker-registry-server-user <ACR_USERNAME> \
  --docker-registry-server-password <ACR_PASSWORD>

# Configure environment variables
az webapp config appsettings set \
  --resource-group codesphere-rg \
  --name codesphere-backend \
  --settings \
    PORT="8080" \
    CORS_ORIGIN="https://codesphere-frontend.azurewebsites.net" \
    DB_USERNAME="<your_mongo_user>" \
    DB_PASSWORD="<your_mongo_password>" \
    BackendHost="<cosmos_db_connection_string>" \
    JWT_SECRET_KEY="<your_jwt_secret>" \
    GEMINI_API_KEY="<your_gemini_api_key>" \
    JUDGE0_API_URL="https://judge0-server.example.com" \
    Server="production"
```

## Step 4: Set Up Databases

### Cosmos DB (MongoDB API)
```bash
az cosmosdb create \
  --resource-group codesphere-rg \
  --name codesphere-db \
  --kind MongoDB \
  --locations regionName=eastus failoverPriority=0
```

### PostgreSQL (for Judge0)
```bash
az postgres server create \
  --resource-group codesphere-rg \
  --name codesphere-postgres \
  --location eastus \
  --admin-user judge0admin \
  --admin-password <strong_password> \
  --sku-name B_Gen5_1 \
  --storage-size 51200 \
  --backup-retention 7 \
  --geo-redundant-backup Disabled
```

### Create firewall rules
```bash
az postgres server firewall-rule create \
  --resource-group codesphere-rg \
  --server-name codesphere-postgres \
  --name AllowAzureIP \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

## Step 5: Set Up CI/CD Pipeline

### Create GitHub Secrets
Add these secrets to your GitHub repository:
- `AZURE_CREDENTIALS` - Service Principal JSON
- `AZURE_REGISTRY_URL` - Your ACR URL
- `AZURE_REGISTRY_USERNAME` - ACR username
- `AZURE_REGISTRY_PASSWORD` - ACR password
- `AZURE_RESOURCE_GROUP` - Your resource group name
- `REACT_APP_SERVER_URL` - Backend API URL
- `REACT_APP_SERVER_WS_URL` - Backend WebSocket URL

### Create Service Principal for CI/CD
```bash
az ad sp create-for-rbac \
  --name codesphere-sp \
  --role contributor \
  --scopes /subscriptions/<subscription-id>/resourceGroups/codesphere-rg
```

GitHub Actions workflow will automatically build and deploy on push to main branch.

## Step 6: Configure Custom Domain (Optional)

```bash
# Add custom domain
az webapp config hostname add \
  --resource-group codesphere-rg \
  --webapp-name codesphere-frontend \
  --hostname app.yourdomain.com

# Create SSL certificate binding
az webapp config ssl bind \
  --resource-group codesphere-rg \
  --name codesphere-frontend \
  --certificate-thumbprint <cert_thumbprint>
```

## Monitoring & Logging

### View Application Logs
```bash
az webapp log tail \
  --resource-group codesphere-rg \
  --name codesphere-backend
```

### Set Up Application Insights
```bash
az monitor app-insights component create \
  --resource-group codesphere-rg \
  --application-type web \
  --location eastus \
  --app codesphere-insights
```

## Troubleshooting

### Check deployment status
```bash
az webapp deployment list \
  --resource-group codesphere-rg \
  --name codesphere-backend
```

### View container logs
```bash
az container logs \
  --resource-group codesphere-rg \
  --name codesphere-app
```

### Restart application
```bash
az webapp restart \
  --resource-group codesphere-rg \
  --name codesphere-backend
```

## Cleanup

To delete all resources and avoid charges:
```bash
az group delete \
  --name codesphere-rg \
  --yes
```

## Cost Estimation

- **App Service Plan (B2)**: ~$50-60/month
- **Cosmos DB**: ~$25-100/month (depends on usage)
- **PostgreSQL Server**: ~$50-100/month
- **Container Registry**: ~$5/month
- **Application Insights**: ~$2-10/month

**Estimated Total**: $130-275/month

## Additional Resources

- [Azure App Service Documentation](https://learn.microsoft.com/en-us/azure/app-service/)
- [Azure Container Registry](https://learn.microsoft.com/en-us/azure/container-registry/)
- [Cosmos DB Documentation](https://learn.microsoft.com/en-us/azure/cosmos-db/)
- [Azure PostgreSQL](https://learn.microsoft.com/en-us/azure/postgresql/)
