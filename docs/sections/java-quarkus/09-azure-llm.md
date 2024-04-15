## Deploy an LLM in Azure OpenAI

[Azure](https://azure.microsoft.com) is Microsoft's comprehensive cloud platform, offering a vast array of services to build, deploy, and manage applications across a global network of Microsoft-managed data centers. In this workshop, we'll leverage several Azure services to run our chat application.

### Getting Started with Azure

<div data-hidden="$$azpass$$">

To complete this workshop, you'll need an Azure account. If you don't already have one, you can sign up for a free account, which includes Azure credits, on the [Azure website](https://azure.microsoft.com/free/).

<div class="important" data-title="important">

> If you already have an Azure account from your company, **DO NOT** use it for this workshop as it may have restrictions that will prevent you from completing the workshop.
> You'll need to create a new account to redeem the Azure Pass.

</div>

</div>

<div data-visible="$$azpass$$">

To complete this workshop, you'll need an Azure account. As you're attending this workshop in-person, you can create one and obtain a free Azure Pass credit by using this link: [redeem your Azure Pass](https://azcheck.in/$$azpass$$).

> If you're **not** attending this workshop in-person, you can sign up for a free account, which includes Azure credits, on the [Azure website](https://azure.microsoft.com/free/).

</div>

#### Log in to Azure

Begin by logging into your Azure subscription with the following command:

```sh
azd auth login --use-device-code
```

This command will provide you a *device code* to enter in a browser window. Follow the prompts until you're notified of a successful login.


#### Setting up environment variables

```shell
PROJECT="rag-workshop"
RESOURCE_GROUP="rg-$PROJECT"
LOCATION="swedencentral"
TAG="$PROJECT"
AI_SERVICE="ai-$PROJECT"
AI_MODEL="gpt-35-turbo"
```

#### Creating the resource group

```shell
az group create \
--name "$RESOURCE_GROUP" \
--location "$LOCATION" \
--tags system="$TAG"
```

#### Creating the Cognitive Service

```shell
az cognitiveservices account create \
--name "$AI_SERVICE" \
--resource-group "$RESOURCE_GROUP" \
--location "$LOCATION" \
--custom-domain "$AI_SERVICE" \
--tags system="$TAG" \
--kind "OpenAI" \
--sku "S0"
````

#### Deploying a gpt-35-turbo model

```shell
az cognitiveservices account deployment create \
--name "$AI_SERVICE" \
--resource-group "$RESOURCE_GROUP" \
--deployment-name "$AI_MODEL" \
--model-name "$AI_MODEL" \
--model-version "1106"  \
--model-format "OpenAI" \
--sku-capacity 120 \
--sku-name "Standard"
```

#### Storing the key and endpoint in environment variables..."

```shell
AZURE_OPENAI_KEY=$(
az cognitiveservices account keys list \
--name "$AI_SERVICE" \
--resource-group "$RESOURCE_GROUP" \
| jq -r .key1
)
AZURE_OPENAI_URL=$(
az cognitiveservices account show \
--name "$AI_SERVICE" \
--resource-group "$RESOURCE_GROUP" \
| jq -r .properties.endpoint
)

echo "AZURE_OPENAI_KEY=$AZURE_OPENAI_KEY"
echo "AZURE_OPENAI_URL=$AZURE_OPENAI_URL"
echo "AZURE_OPENAI_DEPLOYMENT_NAME=$AI_MODEL"
```
