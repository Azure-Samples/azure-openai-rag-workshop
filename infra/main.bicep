targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the the environment which is used to generate a short unique hash used in all resources.')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

param resourceGroupName string = ''
param frontendName string = 'frontend'
param backendApiName string = 'backend'
param backendApiImageName string = ''
param ingestionApiName string = 'ingestion'
param ingestionApiImageName string = ''
param qdrantName string = 'qdrant'
param qdrantImageName string = 'docker.io/qdrant/qdrant:v1.12.0'

// The free tier does not support managed identity (required) or semantic search (optional)
@allowed(['basic', 'standard', 'standard2', 'standard3', 'storage_optimized_l1', 'storage_optimized_l2'])
param searchServiceSkuName string // Set in main.parameters.json

@description('Location for the OpenAI resource group')
@allowed(['australiaeast', 'canadaeast', 'eastus', 'eastus2', 'francecentral', 'japaneast', 'northcentralus', 'swedencentral', 'switzerlandnorth', 'uksouth', 'westeurope'])
@metadata({
  azd: {
    type: 'location'
  }
})
param openAiLocation string // Set in main.parameters.json
param openAiUrl string = ''
param openAiSkuName string = 'S0'
param openAiApiVersion string // Set in main.parameters.json

// Location is not relevant here as it's only for the built-in api
// which is not used here. Static Web App is a global service otherwise
@description('Location for the Static Web App')
@allowed(['westus2', 'centralus', 'eastus2', 'westeurope', 'eastasia', 'eastasiastage'])
@metadata({
  azd: {
    type: 'location'
  }
})
param frontendLocation string = 'eastus2'

param chatModelName string // Set in main.parameters.json
param chatDeploymentName string = chatModelName
param chatModelVersion string // Set in main.parameters.json
param chatDeploymentCapacity int = 15
param embeddingsModelName string // Set in main.parameters.json
param embeddingsModelVersion string // Set in main.parameters.json
param embeddingsDeploymentName string = embeddingsModelName
param embeddingsDeploymentCapacity int = 30

@description('Id of the user or app to assign application roles')
param principalId string = ''

@description('Use Qdrant as the vector DB')
param useQdrant bool = false

@description('Qdrant port')
param qdrantPort int // Set in main.parameters.json

// Differentiates between automated and manual deployments
param isContinuousDeployment bool = false

var abbrs = loadJsonContent('abbreviations.json')
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))
var tags = { 'azd-env-name': environmentName }
var finalOpenAiUrl = empty(openAiUrl) ? 'https://${openAi.outputs.name}.openai.azure.com' : openAiUrl
var useAzureAISearch = !useQdrant
var qdrantUrl = useQdrant ? (qdrantPort == 6334 ? replace('${qdrant.outputs.uri}:80', 'https', 'http') : '${qdrant.outputs.uri}:443') : ''

var ingestionApiIdentityName = '${abbrs.managedIdentityUserAssignedIdentities}ingestion-api-${resourceToken}'
var backendApiIdentityName = '${abbrs.managedIdentityUserAssignedIdentities}backend-api-${resourceToken}'
var qdrantIdentityName = '${abbrs.managedIdentityUserAssignedIdentities}qdrant-${resourceToken}'
var searchUrl = useQdrant ? '' : 'https://${searchService.outputs.name}.search.windows.net'
var openAiInstanceName = empty(openAiUrl) ? openAi.outputs.name : ''

// Organize resources in a resource group
resource resourceGroup 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: !empty(resourceGroupName) ? resourceGroupName : '${abbrs.resourcesResourceGroups}${environmentName}'
  location: location
  tags: tags
}

// Monitor application with Azure Monitor
module monitoring './core/monitor/monitoring.bicep' = {
  name: 'monitoring'
  scope: resourceGroup
  params: {
    location: location
    tags: tags
    logAnalyticsName: '${abbrs.operationalInsightsWorkspaces}${resourceToken}'
    applicationInsightsName: '${abbrs.insightsComponents}${resourceToken}'
    applicationInsightsDashboardName: '${abbrs.portalDashboards}${resourceToken}'
  }
}

// Container apps host (including container registry)
module containerApps './core/host/container-apps.bicep' = {
  name: 'container-apps'
  scope: resourceGroup
  params: {
    name: 'containerapps'
    containerAppsEnvironmentName: '${abbrs.appManagedEnvironments}${resourceToken}'
    containerRegistryName: '${abbrs.containerRegistryRegistries}${resourceToken}'
    location: location
    tags: tags
    applicationInsightsName: monitoring.outputs.applicationInsightsName
    logAnalyticsWorkspaceName: monitoring.outputs.logAnalyticsWorkspaceName
    containerRegistryAdminUserEnabled: true
  }
}

// The application frontend
module frontend './core/host/staticwebapp.bicep' = {
  name: 'frontend'
  scope: resourceGroup
  params: {
    name: !empty(frontendName) ? frontendName : '${abbrs.webStaticSites}web-${resourceToken}'
    location: frontendLocation
    tags: union(tags, { 'azd-service-name': frontendName })
  }
}

// Backend API identity
module backendApiIdentity 'core/security/managed-identity.bicep' = {
  name: 'backend-api-identity'
  scope: resourceGroup
  params: {
    name: backendApiIdentityName
    location: location
  }
}

// The backend API
module backendApi './core/host/container-app.bicep' = {
  name: 'backend-api'
  scope: resourceGroup
  params: {
    name: !empty(backendApiName) ? backendApiName : '${abbrs.appContainerApps}search-${resourceToken}'
    location: location
    tags: union(tags, { 'azd-service-name': backendApiName })
    containerAppsEnvironmentName: containerApps.outputs.environmentName
    containerRegistryName: containerApps.outputs.registryName
    identityName: backendApiIdentityName
    allowedOrigins: [frontend.outputs.uri]
    containerCpuCoreCount: '1.0'
    containerMemory: '2.0Gi'
    secrets: {
      'appinsights-cs': monitoring.outputs.applicationInsightsConnectionString
    }
    env: [
      {
        name: 'AZURE_OPENAI_API_INSTANCE_NAME'
        value: openAiInstanceName
      }
      {
        name: 'AZURE_OPENAI_API_ENDPOINT'
        value: finalOpenAiUrl
      }
      {
        name: 'AZURE_OPENAI_API_VERSION'
        value: openAiApiVersion
      }
      {
        name: 'AZURE_OPENAI_API_DEPLOYMENT_NAME'
        value: chatDeploymentName
      }
      {
        name: 'AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME'
        value: embeddingsDeploymentName
      }
      {
        name: 'AZURE_OPENAI_API_MODEL'
        value: chatModelName
      }
      {
        name: 'AZURE_OPENAI_API_EMBEDDINGS_MODEL'
        value: embeddingsModelName
      }
      {
        name: 'AZURE_AISEARCH_ENDPOINT'
        value: searchUrl
      }
      {
        name: 'QDRANT_URL'
        value: qdrantUrl
      }
      {
        name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
        secretRef: 'appinsights-cs'
      }
      {
        name: 'AZURE_CLIENT_ID'
        value: backendApiIdentity.outputs.clientId
      }
    ]
    imageName: !empty(backendApiImageName) ? backendApiImageName : 'nginx:latest'
    targetPort: 3000
  }
}

// Ingestion API identity
module ingestionApiIdentity 'core/security/managed-identity.bicep' = {
  name: 'ingestion-api-identity'
  scope: resourceGroup
  params: {
    name: ingestionApiIdentityName
    location: location
  }
}

// The ingestion API
module ingestionApi './core/host/container-app.bicep' = {
  name: 'ingestion-api'
  scope: resourceGroup
  params: {
    name: !empty(ingestionApiName) ? ingestionApiName : '${abbrs.appContainerApps}ingestion-${resourceToken}'
    location: location
    tags: union(tags, { 'azd-service-name': ingestionApiName })
    containerAppsEnvironmentName: containerApps.outputs.environmentName
    containerRegistryName: containerApps.outputs.registryName
    identityName: ingestionApiIdentityName
    containerCpuCoreCount: '1.0'
    containerMemory: '2.0Gi'
    secrets: {
      'appinsights-cs': monitoring.outputs.applicationInsightsConnectionString
    }
    env: [
      {
        name: 'AZURE_OPENAI_API_INSTANCE_NAME'
        value: openAiInstanceName
      }
      {
        name: 'AZURE_OPENAI_API_ENDPOINT'
        value: finalOpenAiUrl
      }
      {
        name: 'AZURE_OPENAI_API_VERSION'
        value: openAiApiVersion
      }
      {
        name: 'AZURE_OPENAI_API_DEPLOYMENT_NAME'
        value: chatDeploymentName
      }
      {
        name: 'AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME'
        value: embeddingsDeploymentName
      }
      {
        name: 'AZURE_OPENAI_API_MODEL'
        value: chatModelName
      }
      {
        name: 'AZURE_OPENAI_API_EMBEDDINGS_MODEL'
        value: embeddingsModelName
      }
      {
        name: 'AZURE_AISEARCH_ENDPOINT'
        value: searchUrl
      }
      {
        name: 'QDRANT_URL'
        value: qdrantUrl
      }
      {
        name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
        secretRef: 'appinsights-cs'
      }
      {
        name: 'AZURE_CLIENT_ID'
        value: ingestionApiIdentity.outputs.clientId
      }
    ]
    imageName: !empty(ingestionApiImageName) ? ingestionApiImageName : 'nginx:latest'
    targetPort: 3001
  }
}

module openAi 'core/ai/cognitiveservices.bicep' = if (empty(openAiUrl)) {
  name: 'openai'
  scope: resourceGroup
  params: {
    name: '${abbrs.cognitiveServicesAccounts}${resourceToken}'
    location: openAiLocation
    tags: tags
    sku: {
      name: openAiSkuName
    }
    disableLocalAuth: true
    deployments: [
      {
        name: chatDeploymentName
        model: {
          format: 'OpenAI'
          name: chatModelName
          version: chatModelVersion
        }
        sku: {
          name: 'GlobalStandard'
          capacity: chatDeploymentCapacity
        }
      }
      {
        name: embeddingsDeploymentName
        model: {
          format: 'OpenAI'
          name: embeddingsModelName
          version: embeddingsModelVersion
        }
        capacity: embeddingsDeploymentCapacity
      }
    ]
  }
}

module searchService 'core/search/search-services.bicep' = if (useAzureAISearch) {
  name: 'search-service'
  scope: resourceGroup
  params: {
    name: 'gptkb-${resourceToken}'
    location: location
    tags: tags
    disableLocalAuth: true
    authOptions: null
    sku: {
      name: searchServiceSkuName
    }
    semanticSearch: 'free'
  }
}

// Qdrant identity
module qdrantIdentity 'core/security/managed-identity.bicep' = if (useQdrant) {
  name: 'qdrant-api-identity'
  scope: resourceGroup
  params: {
    name: qdrantIdentityName
    location: location
  }
}

module qdrant './core/host/container-app.bicep' = if (useQdrant) {
  name: 'qdrant'
  scope: resourceGroup
  params: {
    name: !empty(qdrantName) ? qdrantName : '${abbrs.appContainerApps}qdrant-${resourceToken}'
    location: location
    tags: union(tags, { 'azd-service-name': qdrantName })
    containerAppsEnvironmentName: containerApps.outputs.environmentName
    containerRegistryName: containerApps.outputs.registryName
    identityName: qdrantIdentityName
    containerCpuCoreCount: '1.0'
    containerMemory: '2.0Gi'
    secrets: {
      'appinsights-cs': monitoring.outputs.applicationInsightsConnectionString
    }
    env: [
      {
        name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
        secretRef: 'appinsights-cs'
      }
    ]
    imageName: !empty(qdrantImageName) ? qdrantImageName : 'docker.io/qdrant/qdrant'
    targetPort: qdrantPort
    allowInsecure: (qdrantPort == 6334 ? true : false)
    // gRPC needs to be explicitly set for HTTP2
    transport: (qdrantPort == 6334 ? 'HTTP2' : 'auto')
    additionalPortMappings: (qdrantPort == 6334 ? [{
      targetPort: 6333
      exposedPort: 6333
    }] : [])
  }
}


// USER ROLES
module openAiRoleUser 'core/security/role.bicep' = if (empty(openAiUrl) && !isContinuousDeployment) {
  scope: resourceGroup
  name: 'openai-role-user'
  params: {
    principalId: principalId
    // Cognitive Services OpenAI User
    roleDefinitionId: '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd'
    principalType: 'User'
  }
}

module searchContribRoleUser 'core/security/role.bicep' = if (useAzureAISearch && !isContinuousDeployment) {
  scope: resourceGroup
  name: 'search-contrib-role-user'
  params: {
    principalId: principalId
    // Search Index Data Contributor
    roleDefinitionId: '8ebe5a00-799e-43f5-93ac-243d3dce84a7'
    principalType: 'User'
  }
}

module searchSvcContribRoleUser 'core/security/role.bicep' = if (useAzureAISearch && !isContinuousDeployment) {
  scope: resourceGroup
  name: 'search-svccontrib-role-user'
  params: {
    principalId: principalId
    // Search Service Contributor
    roleDefinitionId: '7ca78c08-252a-4471-8644-bb5ff32d4ba0'
    principalType: 'User'
  }
}

// SYSTEM IDENTITIES
module openAiRoleBackendApi 'core/security/role.bicep' = if (empty(openAiUrl)) {
  scope: resourceGroup
  name: 'openai-role-backendapi'
  params: {
    principalId: backendApi.outputs.identityPrincipalId
    // Cognitive Services OpenAI User
    roleDefinitionId: '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd'
    principalType: 'ServicePrincipal'
  }
}

module searchRoleBackendApi 'core/security/role.bicep' = if (useAzureAISearch) {
  scope: resourceGroup
  name: 'search-role-backendapi'
  params: {
    principalId: backendApi.outputs.identityPrincipalId
    // Search Index Data Reader
    roleDefinitionId: '1407120a-92aa-4202-b7e9-c0e197c71c8f'
    principalType: 'ServicePrincipal'
  }
}

module openAiRoleIngestionApi 'core/security/role.bicep' = if (empty(openAiUrl)) {
  scope: resourceGroup
  name: 'openai-role-ingestion'
  params: {
    principalId: ingestionApi.outputs.identityPrincipalId
    // Cognitive Services OpenAI User
    roleDefinitionId: '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd'
    principalType: 'ServicePrincipal'
  }
}

module searchContribRoleIngestionApi 'core/security/role.bicep' = if (useAzureAISearch) {
  scope: resourceGroup
  name: 'search-contrib-role-ingestion'
  params: {
    principalId: ingestionApi.outputs.identityPrincipalId
    // Search Index Data Contributor
    roleDefinitionId: '8ebe5a00-799e-43f5-93ac-243d3dce84a7'
    principalType: 'ServicePrincipal'
  }
}

module searchSvcContribRoleIngestionApi 'core/security/role.bicep' = if (useAzureAISearch) {
  scope: resourceGroup
  name: 'search-svccontrib-role-ingestion'
  params: {
    principalId: ingestionApi.outputs.identityPrincipalId
    // Search Service Contributor
    roleDefinitionId: '7ca78c08-252a-4471-8644-bb5ff32d4ba0'
    principalType: 'ServicePrincipal'
  }
}

output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
output AZURE_RESOURCE_GROUP string = resourceGroup.name

output AZURE_CONTAINER_REGISTRY_ENDPOINT string = containerApps.outputs.registryLoginServer
output AZURE_CONTAINER_REGISTRY_NAME string = containerApps.outputs.registryName

output AZURE_OPENAI_API_ENDPOINT string = finalOpenAiUrl
output AZURE_OPENAI_API_INSTANCE_NAME string = openAiInstanceName
output AZURE_OPENAI_API_VERSION string = openAiApiVersion
output AZURE_OPENAI_API_DEPLOYMENT_NAME string = chatDeploymentName
output AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME string = embeddingsDeploymentName
output AZURE_OPENAI_API_MODEL string = chatModelName
output AZURE_OPENAI_API_EMBEDDINGS_MODEL string = embeddingsModelName

output AZURE_AISEARCH_ENDPOINT string = searchUrl
output QDRANT_URL string = qdrantUrl

output FRONTEND_URI string = frontend.outputs.uri
output BACKEND_API_URI string = backendApi.outputs.uri
output INGESTION_API_URI string = ingestionApi.outputs.uri
