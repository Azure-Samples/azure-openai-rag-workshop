# 🤖 azure-openai-rag-workshop

In this workshop, we will build a chatbot from based on OpenAI language models and implementing the Retrieval Augmented Generation (RAG) pattern. You'll use [Fastify](https://fastify.dev) to create a [Node.js](https://nodejs.org/en/) service that leverage [OpenAI SDK](https://platform.openai.com/docs/libraries/) and [LangChain](https://js.langchain.com/) to build a chatbot that will answer questions based on a corpus of documents, as well as a website to test it.

<!-- Finally, we will deploy everything on Azure with a CI/CD pipeline. -->

👉 [See the workshop](https://aka.ms/ws/openai-rag)

## Prerequisites

- **Node.js v18+**
- **Docker v20+**
- **Azure account**. If you're new to Azure, [get an Azure account for free](https://azure.microsoft.com/free/?WT.mc_id=javascript-0000-cxa) to get free Azure credits to get started.
- **Azure subscription with access enabled for the Azure OpenAI service**. You can request access with [this form](https://aka.ms/oaiapply).

You can use [GitHub Codespaces](https://github.com/features/codespaces) to work on this project directly from your browser: select the **Code** button, then the **Codespaces** tab and click on **Create Codespaces on main**.

You can also use the [Dev Containers extension for VS Code](https://aka.ms/vscode/ext/devcontainer) to work locally using a ready-to-use dev environment.

## Project details

This project is structured as monorepo and makes use of [NPM Workspaces](https://docs.npmjs.com/cli/using-npm/workspaces).

## How to run locally

```bash
npm install
npm start
```

This command will start the frontend and backend services.
For these services to work, you need to have a `.env` file at the root of the project with at least the following content:

```bash
AZURE_SEARCH_SERVICE=<your_azure_cognitive_search_instance_name>
AZURE_OPENAI_URL=<you_openai_instance_url>
```

The application will then be available at `http://localhost:8000`.

## How to build Docker images

```bash
npm run docker:build
```

This command will build the container images for all services.

## How deploy to Azure

```bash
azd auth login
azd up
```

This commands will first ask you to log in into Azure. Then it will provison the Azure resources, package the services and deploy them to Azure.

## References

This workshop is based on the enterprise-ready sample **ChatGPT + Enterprise data with Azure OpenAI and Cognitive Search**:

- [JavaScript version](https://github.com/Azure-Samples/azure-search-openai-javascript)
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
