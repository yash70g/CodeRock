# Azure Deployment Setup Complete ✓

I've created a complete Azure Cloud deployment setup for CodeRoom. Here's what you have:

## Files Created

### 1. **Docker Compose for Azure** (`docker-compose.azure.yml`)
- Uses Azure Container Registry images
- Environment variables for Azure deployment
- Uses Docker volumes for persistence

### 2. **Azure Deployment Guide** (`AZURE_DEPLOYMENT.md`)
- Complete step-by-step deployment instructions
- Multiple deployment options (App Service, Container Instances, AKS)
- Database setup (Cosmos DB, PostgreSQL)
- CI/CD configuration
- Monitoring and troubleshooting guides

### 3. **Deployment Scripts**
- **`scripts/azure-quick-deploy.sh`** - Quick setup and image push to ACR
- **`scripts/azure-appservice-deploy.sh`** - Deploy to App Service

### 4. **GitHub Actions CI/CD** (`.github/workflows/azure-deploy.yml`)
- Automatically builds and pushes images to ACR
- Deploys to Azure Container Instances on push to main branch
- Requires GitHub secrets setup

### 5. **Infrastructure as Code**
- **`azure/template.json`** - ARM template for infrastructure
- **`azure/parameters.json`** - Template parameters

### 6. **Environment Configuration**
- **`.env.azure.example`** - Azure-specific environment variables

## Quick Start (3 Steps)

### 1. Install Azure CLI
```bash
# Windows (PowerShell)
choco install azure-cli

# Mac
brew install azure-cli

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### 2. Run Quick Deploy Script
```bash
bash scripts/azure-quick-deploy.sh coderoomregistry coderoom-rg eastus
```

This will:
- Create resource group
- Create Container Registry
- Build and push frontend & backend images to Azure

### 3. Deploy to App Service
```bash
bash scripts/azure-appservice-deploy.sh coderoomregistry coderoom-rg coderoom-frontend coderoom-backend
```

This will:
- Create App Service Plan
- Deploy frontend and backend
- Configure environment variables

## Advanced Deployment (App Service + Managed Databases)

For production with managed databases, follow the detailed guide in `AZURE_DEPLOYMENT.md`.

This includes:
- **Cosmos DB** for MongoDB (fully managed)
- **PostgreSQL** for Judge0 database
- **Application Insights** for monitoring
- **Custom domains** and SSL

## GitHub Actions CI/CD Setup

For automatic deployments on code push:

1. Create a Service Principal:
```bash
az ad sp create-for-rbac --name coderoom-sp --role contributor --scopes /subscriptions/<subscription-id>
```

2. Add GitHub Secrets:
   - `AZURE_CREDENTIALS` - Service Principal JSON
   - `AZURE_REGISTRY_URL` - Your ACR URL
   - `AZURE_REGISTRY_USERNAME` - ACR username
   - `AZURE_REGISTRY_PASSWORD` - ACR password
   - `AZURE_RESOURCE_GROUP` - Your resource group
   - `REACT_APP_SERVER_URL` - Backend API URL
   - `REACT_APP_SERVER_WS_URL` - Backend WebSocket URL

3. Push to main branch - GitHub Actions will automatically:
   - Build Docker images
   - Push to Azure Container Registry
   - Deploy to Azure Container Instances

## Architecture

```
┌─────────────────────────────────────────────────┐
│         Azure Cloud                             │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │     App Service (Frontend)               │  │
│  │     coderoom-frontend.azurewebsites.net  │  │
│  │     :3000                                │  │
│  └──────────────────────────────────────────┘  │
│                    ↓                            │
│  ┌──────────────────────────────────────────┐  │
│  │     App Service (Backend)                │  │
│  │     coderoom-backend.azurewebsites.net   │  │
│  │     :8080                                │  │
│  └──────────────────────────────────────────┘  │
│           ↓          ↓         ↓               │
│  ┌─────────────────────────────────────────┐  │
│  │ Cosmos DB │ PostgreSQL │ Container Reg. │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Cost Estimation

- **App Service (B2)**: $50-60/month
- **Cosmos DB**: $25-100/month
- **PostgreSQL Server**: $50-100/month
- **Container Registry**: $5/month
- **Total**: ~$130-275/month

## Environment Variables Reference

### Backend
```
PORT=8080
CORS_ORIGIN=https://coderoom-frontend.azurewebsites.net
JWT_SECRET_KEY=your-secret-key
GEMINI_API_KEY=your-api-key
BackendHost=<cosmos-connection-string>
JUDGE0_API_URL=<judge0-api-url>
```

### Frontend
```
REACT_APP_SERVER_URL=https://coderoom-backend.azurewebsites.net
REACT_APP_SERVER_WS_URL=wss://coderoom-backend.azurewebsites.net
```

## Common Tasks

### View deployment status
```bash
az webapp deployment show --resource-group codesphere-rg --name codesphere-backend
```

### View logs
```bash
az webapp log tail --resource-group codesphere-rg --name codesphere-backend
```

### Restart app
```bash
az webapp restart --resource-group coderoom-rg --name coderoom-backend
```

### Scale up
```bash
az appservice plan update --resource-group coderoom-rg --name coderoom-plan --sku S1
```

### Delete everything
```bash
az group delete --name coderoom-rg --yes
```

## Next Steps

1. **Review** `AZURE_DEPLOYMENT.md` for detailed instructions
2. **Create** `.env.azure` from `.env.azure.example`
3. **Run** `scripts/azure-quick-deploy.sh`
4. **Deploy** to App Service or set up GitHub Actions
5. **Monitor** using Azure Portal or Application Insights

## Support & Documentation

- [Azure App Service Docs](https://learn.microsoft.com/en-us/azure/app-service/)
- [Azure Container Registry](https://learn.microsoft.com/en-us/azure/container-registry/)
- [Cosmos DB Guide](https://learn.microsoft.com/en-us/azure/cosmos-db/)
- [Azure CLI Reference](https://learn.microsoft.com/en-us/cli/azure/)

---

Your CodeRoom app is now ready for Azure deployment! 🚀
