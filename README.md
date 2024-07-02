<!-- prettier-ignore -->
<div align="center">

# 🤖 Azure OpenAI RAG workshop - Node.js version

[![Open project in GitHub Codespaces](https://img.shields.io/badge/Codespaces-Open-blue?style=flat-square&logo=github)](https://codespaces.new/Azure-Samples/azure-openai-rag-workshop?hide_repo_select=true&ref=main&quickstart=true)
![Node version](https://img.shields.io/badge/Node.js->=20-3c873a?style=flat-square)
[![Ollama + Mistral](https://img.shields.io/badge/Ollama-Mistral-ff7000?style=flat-square)](https://ollama.com/library/mistral)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

:star: If you like this sample, star it on GitHub — it helps a lot!

[Overview](#overview) • [Run the sample](#run-the-sample) • [Other versions](#other-versions) • [References](#references)

</div>

This sample shows how to build an AI chat experience with Retrieval-Augmented Generation (RAG) using LangChain.js and OpenAI language models. The application is hosted on [Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/overview) and [Azure Container Apps](https://learn.microsoft.com/azure/container-apps/overview), with [Azure AI Search](https://learn.microsoft.com/azure/search/search-what-is-azure-search) as the vector database. You can use it as a starting point for building more complex AI applications.

> [!IMPORTANT]
> 👉 **Follow the [full-length workshop](https://aka.ms/ws/openai-rag)** to learn how we built this sample and how you can run and deploy it.

## Overview

This sample uses [Fastify](https://fastify.dev) to create a [Node.js](https://nodejs.org/) service that leverage [OpenAI SDK](https://platform.openai.com/docs/libraries/) and [LangChain](https://js.langchain.com/) to build a chatbot that will answer questions based on a corpus of documents, with a website to interact with the API.

This project is structured as monorepo, all packages source code is located under the `src/` folder.
Here's the architecture of the application:

<div align="center">
  <img src="./docs/assets/architecture.png" alt="Architecture diagram" width="640px" />
</div>

## Run the sample

You can use [GitHub Codespaces](https://github.com/features/codespaces) to work on this project directly from your browser:

[![Open in GitHub Codespaces](https://img.shields.io/badge/Codespaces-Open-blue?style=flat-square&logo=github)](https://codespaces.new/Azure-Samples/azure-openai-rag-workshop?hide_repo_select=true&ref=main&quickstart=true)

You can also use [Docker](https://www.docker.com/products/docker-desktop) and the [Dev Containers extension for VS Code](https://aka.ms/vscode/ext/devcontainer) to work locally using a ready-to-use dev environment:

[![Open in Dev Containers](https://img.shields.io/static/v1?style=flat-square&label=Dev%20Containers&message=Open&color=blue&logo=visualstudiocode)](https://vscode.dev/redirect?url=vscode://ms-vscode-remote.remote-containers/cloneInVolume?url=https://github.com/Azure-Samples/azure-openai-rag-workshop)

If you prefer to install all the tools locally, you can follow these [setup instructions](https://aka.ms/ws?src=gh%3AAzure-Samples%2Fazure-openai-rag-workshop%2Fdocs%2Fworkshop.md&step=2#optional-working-locally-without-the-dev-container).

<!--
> [!TIP]
> You can run this sample entirely locally without any cost using [Ollama](https://ollama.com/). Follow the instructions above to setup the tools locally to get started.
-->

### Azure prerequisites

- **Azure account**. If you're new to Azure, [get an Azure account for free](https://azure.microsoft.com/free) to get free Azure credits to get started. If you're a student, you can also get free credits with [Azure for Students](https://aka.ms/azureforstudents).
- **Azure subscription with access enabled for the Azure OpenAI service**. You can request access with [this form](https://aka.ms/oaiapply).
- **Azure account permissions**:
  - Your Azure account must have `Microsoft.Authorization/roleAssignments/write` permissions, such as [Role Based Access Control Administrator](https://learn.microsoft.com/azure/role-based-access-control/built-in-roles#role-based-access-control-administrator-preview), [User Access Administrator](https://learn.microsoft.com/azure/role-based-access-control/built-in-roles#user-access-administrator), or [Owner](https://learn.microsoft.com/azure/role-based-access-control/built-in-roles#owner). If you don't have subscription-level permissions, you must be granted [RBAC](https://learn.microsoft.com/azure/role-based-access-control/built-in-roles#role-based-access-control-administrator-preview) for an existing resource group and [deploy to that existing group](docs/deploy_existing.md#resource-group).
  - Your Azure account also needs `Microsoft.Resources/deployments/write` permissions on the subscription level.

### Deploy the sample

Open a terminal and run the following commands:

```bash
azd auth login
azd up
```

This commands will first ask you to log in into Azure. Then it will provison the Azure resources, package the services and deploy them to Azure.

### Clean up

To clean up all the Azure resources created by this sample:

1. Run `azd down --purge`
2. When asked if you are sure you want to continue, enter `y`

The resource group and all the resources will be deleted.

## Other versions

This sample and workshop exists in different versions:

- [**Node.js + Azure AI Search**](https://aka.ms/ws/openai-rag)
- [**Node.js + Qdrant**](https://aka.ms/ws/openai-rag-qdrant)
- [**Java/Quarkus + Qdrant**](https://aka.ms/ws/openai-rag-quarkus).

## References

Here are some resources to learn more about the technologies used in this sample:

- [LangChain.js documentation](https://js.langchain.com/)
- [Generative AI For Beginners](https://github.com/microsoft/generative-ai-for-beginners)
- [Azure OpenAI Service](https://learn.microsoft.com/azure/ai-services/openai/overview)

You can also find [more Azure AI samples here](https://github.com/Azure-Samples/azureai-samples).

This sample/workshop was based on the enterprise-ready sample **ChatGPT + Enterprise data with Azure OpenAI and AI Search**:

- [JavaScript version](https://github.com/Azure-Samples/azure-search-openai-javascript) / [Serverless JavaScript version](https://github.com/Azure-Samples/serverless-chat-langchainjs)
- [Python version](https://github.com/Azure-Samples/azure-search-openai-demo/)
- [Java version](https://github.com/Azure-Samples/azure-search-openai-demo-java)
- [C# version](https://github.com/Azure-Samples/azure-search-openai-demo-csharp)

If you want to go further with more advanced use-cases, authentication, history and more, you should check it out!

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
