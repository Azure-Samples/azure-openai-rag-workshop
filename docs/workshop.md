---
short_title: Create Custom ChatGPT on your data with Node.js and LangChain
description: Discover how to create and populate a vector database, create a web chat interface and an API to expose your agent to the web interface. 
type: workshop
authors: Yohan Lasorsa, Julien Dubois, Christopher Maneu
contacts: '@sinedied'
banner_url: assets/todo-banner.jpg
duration_minutes: 180
audience: students, devs
level: intermediate
tags: node.js, containers, docker, azure, static web apps, javascript, typescript, OpenAI, Langchain
published: false
wt_id: javascript-0000-yolasors
oc_id: AID3057430
sections_title:
  - Welcome
---

# Create Custom ChatGPT on your data with Node.js and LangChain

In this workshop, we'll explore the fundamentals of custom ChatGPT experiences based on your document. We will create a vector database and fill-in with data from PDF, and then build a chat website and API to be able to ask questions about information contained in these documents. 


## You'll learn how to...

- Create an ingestion application to index documents in a vector database
- Create an api to query a vector database and augment a prompt to generate responses
- Create a web chat interface
- Deploy the service on Azure
- Integrate LangChain

## Prerequisites

| | |
|----------------------|------------------------------------------------------|
| GitHub account       | [Get a free GitHub account](https://github.com/join) |
| Azure account        | [Get a free Azure account](https://azure.microsoft.com/free) |
| Access to OpenAI API | [!!!!!TODO](https://www.microsoft.com/edge) |
| A web browser        | [Get Microsoft Edge](https://www.microsoft.com/edge) |
| JavaScript knowledge | [JavaScript tutorial on MDN documentation](https://developer.mozilla.org/docs/Web/JavaScript)<br>[JavaScript for Beginners on YouTube](https://www.youtube.com/playlist?list=PLlrxD0HtieHhW0NCG7M536uHGOtJ95Ut2) |

We'll use [GitHub Codespaces](https://github.com/features/codespaces) to have an instant dev environment already prepared for this workshop.

If you prefer to work locally, we'll also provide instructions to setup a local dev environment using either VS Code with a [dev container](https://aka.ms/vscode/ext/devcontainer) or a manual install of the needed tools.

---

## Introduction

Intro

We'll cover a lot of differents topics and concepts here, but don't worry, we'll take it step by step. 

<div class="info" data-title="note">

> This workshop is designed to be modular: when indicated, some of the parts can be skipped so that you can focus on the topics that interest you the most.

</div>

### Application architecture

Here's the architecture of the application we'll build in this workshop:

![Application architecture](./assets/architecture.drawio.png)

Our application is split into 4 main components:

1. **A vector database and an ingestion service**, Description.

2. **A Chat API**, Description.

3. **A Chat website**, Description.

4. **A deployment of OpenAI GPT**, .

### How retrievial-augmented Generation works?

---

## Preparation

Before starting the development, we'll need to setup our project and development environment. This includes:

- Creating a new project on GitHub based on a template
- Using a prepared dev container environment on either [GitHub Codespaces](https://github.com/features/codespaces) or [VS Code with Dev Containers extension](https://aka.ms/vscode/ext/devcontainer) (or a manual install of the needed tools)

### Creating the project

Open [this GitHub repository](https://github.com/azure-samples/nodejs-microservices-template), select the **Fork** button and click on **Create fork** to create a copy of the project in your own GitHub account.

![Screenshot of GitHub showing the Fork button](./assets/fork-project.png)

Once the fork is created, select the **Code** button, then the **Codespaces** tab and click on **Create Codespaces on main**.

![Screenshot of GitHub showing the Codespaces creation](./assets/create-codespaces.png)

This will start the creation of a dev container environment, which is a pre-configured container with all the needed tools installed. Once it's ready, you have everything you need to start coding. It even ran `npm install` for you!

<div class="info" data-title="note">

> Codespaces includes up to 60 hours of free usage per month for all GitHub users, see [the pricing details here](https://github.com/features/codespaces).

</div>

#### [optional] Working locally with the dev container

If you prefer to work locally, you can also run the dev container on your machine. If you're fine with using Codespaces, you can skip directly to the next section.

To work on the project locally using a dev container, first you'll need to install [Docker](https://www.docker.com/products/docker-desktop) and [VS Code](https://code.visualstudio.com/), then install the [Dev Containers](https://aka.ms/vscode/ext/devcontainer) extension.

<div class="tip" data-title="tip">

> You can learn more about Dev Containers in [this video series](https://learn.microsoft.com/shows/beginners-series-to-dev-containers/). You can also [check the website](https://containers.dev) and [the specification](https://github.com/devcontainers/spec).

</div>

After that you need to clone the project on your machine:

1. Select the **Code** button, then the **Local** tab and copy your repository url.

![Screenshot of GitHub showing the repository URL](./assets/github-clone.png)

2. Open a terminal and run:

```bash
git clone <your_repo_url>
```

3. Open the project in VS Code, open the **command palette** with `Ctrl+Shift+P` (`Command+Shift+P` on macOS) and enter **Reopen in Container**.

![Screenshot of VS Code showing the "reopen in container" command](./assets/vscode-reopen-in-container.png)

The first time it will take some time to download and setup the container image, meanwhile you can go ahead and read the next sections.

Once the container is ready, you will see "Dev Container: Node.js" in the bottom left corner of VSCode:

![Screenshot of VS Code showing the Dev Container status](./assets/vscode-dev-container-status.png)

#### [optional] Working locally without the dev container

If you want to work locally without using a dev container, you need to clone the project and install the following tools:

| | |
|---------------|--------------------------------|
| Git           | [Get Git](https://git-scm.com) |
| Docker v20+   | [Get Docker](https://docs.docker.com/get-docker) |
| Node.js v18+  | [Get Node.js](https://nodejs.org) |
| Azure CLI     | [Get Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli#install) |
| GitHub CLI    | [Get GitHub CLI](https://cli.github.com/manual/installation) |
| Azure Static Web Apps CLI | [Get Azure Static Web Apps CLI](https://github.com/Azure/static-web-apps-cli#installing-the-cli-with-npm-yarn-or-pnpm) |
| pino-pretty log formatter | [Get pino-pretty](https://github.com/pinojs/pino-pretty#install) |
| Bash v3+      | [Get bash](https://www.gnu.org/software/bash/) (Windows users can use **Git bash** that comes with Git) |
| Perl v5+      | [Get Perl](https://www.perl.org/get.html) |
| jq            | [Get jq](https://stedolan.github.io/jq/download) |
| A code editor | [Get VS Code](https://aka.ms/get-vscode) |

You can test your setup by opening a terminal and typing:

```sh
git --version
docker --version
node --version
az --version
gh --version
swa --version
bash --version
perl --version
jq --version
```

---

## Overview of the project

The project template you forked is a monorepo, a single repository containing multiple projects. It's organized as follows (for the most important files):

```sh
infra/          # Azure infrastructure templates and scripts
.devcontainer/  # Dev container configuration
scripts/        # TK
src/            # The different services of our app
|- backend/     # The API gateway, created with generator-express
|- frontend/    # The settings API, created with Fastify CLI
|- indexer/     # The dice API, created with NestJS CLI
api.http        # HTTP requests to test our APIs
package.json    # NPM workspace configuration
```

As we'll be using Node.js to build our APIs and website, we had setup a [NPM workspace](https://docs.npmjs.com/cli/using-npm/workspaces) to manage the dependencies of all the projects in a single place. This means that when you run `npm install` in the root of the project, it will install all the dependencies of all the projects and make it easier to work in a monorepo.

For example, you can run `npm run <script_name> --workspaces` in the root of the project to run a script in all the projects, or `npm run <script_name> --workspace=packages/gateway-api` to run a script for a specific project. 

Otherwise, you can use your regular `npm` commands in any project folder and it will work as usual.

### About the services

We generated the base code of our differents services with the respective CLI or generator of the frameworks we'll be using, with very few modifications made so we can start working quickly on the most important parts of the workshop.

The only changes we made to the generated code is to remove the files we don't need, configure the ports for each API, and setup [pino-http](https://github.com/pinojs/pino-http) as the logger to have a consistent logging format across all the services.

<div class="info" data-title="note">

> If you want to see how the services were generated and the details of the changes we made, you can look at [this script](https://github.com/Azure-Samples/nodejs-microservices/blob/main/scripts/create-projects.sh) we used to generate the projects.

</div>

<div class="info" data-title="skip notice">

> If you want to skip the Settings API implementation and jump directly to the next section, run this command in the terminal at the root of the project to get the completed code directly: `curl -fsSL https://github.com/Azure-Samples/nodejs-microservices/releases/download/latest/settings-api.tar.gz | tar -xvz`

</div>

### The Chat protocol

TK

---

## Vector database

We'll start by creating a vector database. This type of database allows us to do a semantic query on top your data instead of doing a keyword-based search.

// TODO: Module intro

### Introducing Azure Cognitive Search

// TODO: Write

### Creating the database

// TODO: Write

---

## Ingest data in the vector database


### The ingestion process

// TODO: Write

### Read PDF content

### Compute embedding


<div class="tip" data-title="tip">

> The `{ result }` syntax is a shorthand for `{ result: result }`, and is allowed in JavaScript since ES6.

</div>

### Add the document to the vector database


### Execute the ingestion process

### Test our vector database

//TODO: Test with Search Explorer within Azure Portal

---

## Chat API

### Introducing Express

Does [Express](https://expressjs.com) really need an introduction? It's one of the most popular Node.js web frameworks, used by many applications in production. It's minimalistic, flexible, and benefits from a large ecosystem of plugins and a huge active developer community.

While it doesn't provide a lot of features out of the box compared to more modern frameworks like [NestJS](https://nestjs.com) or [Fastify](https://www.fastify.io), it's still a great choice for building services especially if your want something unopinionated that you can easily customize to your needs.

### Using OpenAI SDK

// TODO: Write

<div class="tip" data-title="tip">

> If you're doing the workshop with Yohan, we have deployed an OpenAPI proxy so you don't have to wait or pay to access Open AI API.

</div>

### Inject Vector search results in prompt

// TODO: Write

### Testing our API

It's time to test our API! 

```bash
# Run in first terminal
npm start --workspace=settings-api | pino-pretty

# Run in second terminal
npm start --workspace=dice-api | pino-pretty

# Run in third terminal
npm start --workspace=gateway-api | pino-pretty
```

Open the file `api.http` file. Go to the "Gateway API" section and hit **Send Request** on the different routes to check that they work as expected.

You can play a bit and increase the `count` parameter of the "Roll dices" API and observe the growth of the response time, as the number of calls to the Dice API increases.

When you're done with the testing, stop all the servers by pressing `Ctrl+C` in each of the terminals.

### Creating the Dockerfile

We're almost done, it's time to containerize our last API! Since our gateway API is using plain JavaScript, we do not have a build step, so the Dockerfile will almost be the same as the one we used for the Settings API.

Let's create a file `Dockerfile` under the `packages/gateway-api`:

```dockerfile
# syntax=docker/dockerfile:1
FROM node:18-alpine
ENV NODE_ENV=production

WORKDIR /app
COPY ./package*.json ./
COPY ./packages/gateway-api ./packages/gateway-api
RUN npm ci --omit=dev --workspace=gateway-api --cache /tmp/empty-cache
EXPOSE 4003
CMD [ "npm", "start", "--workspace=gateway-api" ]
```

This Dockerfile is very similar to the one we used for the Settings API, the only differences are that we use the `gateway-api` workspace, and expose a different port.

Again, you also need to create a `.dockerignore` file to tell Docker which files to ignore when copying files to the image:

```text
node_modules
*.log
```

### Testing our Docker image

Just like you did for the other APIs, add the commands to build and run the Docker image to the `packages/gateway-api/package.json` file:

```json
{
  "scripts": {
    "start": "node ./bin/www",
    "docker:build": "docker build --tag gateway-api --file ./Dockerfile ../..",
    "docker:run": "docker run --rm --publish 4003:4003 gateway-api"
  },
}
```

Check that your image build correctly by running this command from the `gateway-api` folder:

```bash
npm run docker:build
```

For testing though, running all 3 services separately is a bit tedious (as you saw before), so we'll use a different approach that we'll detail in the next section.

---

## Chat website

// TODO: Write


---

<div class="info" data-title="skip notice">

> If you want to skip the website implementation and jump directly to the next section, run this command in the terminal to get the completed code directly: `curl -fsSL https://github.com/Azure-Samples/nodejs-microservices/releases/download/latest/website.tar.gz | tar -xvz && npm install`

</div>

## Improve your prompts

---

## Azure setup

Azure is Microsoft's cloud platform. It provides a wide range of services to build, deploy, and manage applications. We'll use a few of them in this workshop to run our application.

First, you need to make sure you have an Azure account. If you don't have one, you can create a free account including Azure credits on the [Azure website](https://azure.microsoft.com/free/).

<!-- <div class="important" data-title="important">

> If you're following this workshop in-person at SnowCamp, you can use the following link to get a 50$ Azure Pass credit: [redeem your Azure Pass](https://azcheck.in/sno230125)

</div> -->

Once you have your Azure account, open a terminal at the root of the project and run:

```bash
.azure/setup.sh
```

This script uses the [Azure CLI](https://learn.microsoft.com/cli/azure) and [GitHub CLI](https://cli.github.com/) to do the following:
- Login into your Azure account
- Select a subscription to use
- Create a [service principal](https://learn.microsoft.com/azure/active-directory/develop/howto-create-service-principal-portal), a token that will be used to create or update resources in Azure
- Login into your GitHub account
- Add the `AZURE_CREDENTIALS` secret to your GitHub repository, with your the service principal token

Before reading further, let's run the script that will create all the Azure resources we'll need for this workshop, as it will take a few minutes to complete (we'll explain what it does a bit later):

```bash
.azure/infra.sh update
```

### Introducing Azure services

Let's look again at our application architecture diagram we saw earlier:

![Application architecture](./assets/architecture.drawio.png)

To run and monitor our application, we'll use various Azure services:

| Service | Description |
| ------- | ----------- |
| [Azure Container Apps](https://learn.microsoft.com/azure/container-apps/) | A managed service to run containers in Azure, with built-in load balancing, auto-scaling, and more. |
| [Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/) | A service to host websites, with built-in authentication, serverless API functions or proxy, Edge CDN and more. |
| [Azure Cosmos DB](https://learn.microsoft.com/azure/cosmos-db/) | A NoSQL globally distributed database, that supports SQL, MongoDB, Cassandra, Gremlin, and Azure Table storage APIs. |
| [Azure Container Registry](https://learn.microsoft.com/azure/container-registry/) | A container registry to store and manage container images. |
| [Azure Log Analytics](https://learn.microsoft.com/azure/log-analytics/) | A service to collect and analyze logs from your Azure resources. |
| [Azure Monitor](https://learn.microsoft.com/azure/azure-monitor/) | A service to monitor your Azure resources, with built-in dashboards, alerts, and more. |

Azure Log Analytics doesn't appear in our diagram, but we'll use it to collect logs from our containers and use them to debug our application when needed. Azure Monitor isn't explicitly part of our infrastructure, but it's enabled across all Azure resources, and we'll use it to monitor our application and build a dashboard.

#### About Azure Container Apps

The primary service we'll use is [Azure Container Apps](https://learn.microsoft.com/azure/container-apps/overview), a fully managed serverless container service on Azure. It allows you to run containerized applications without worrying about orchestration or managing complex infrastructure such as Kubernetes.

You write code using your preferred programming language or framework (in this workshop it's JavaScript and Node.js, but it can be anything), and build microservices with full support for [Distributed Application Runtime (Dapr)](https://dapr.io/). Then, your containers will scale dynamically based on HTTP traffic or events powered by [Kubernetes Event-Driven Autoscaling (KEDA)](https://keda.sh).

There are already a few compute resources on Azure: from IAAS to FAAS.
Azure Container Apps sits between PAAS and FAAS.
On one hand, it feels more PaaS, because you are not forced into a specific programming model and you can control the rules on which to scale out / scale in.
On the other hand, it has quite some serverless characteristics like scaling to zero, event-driven scaling, per second pricing and the ability to leverage Dapr's event-based bindings.

![Diagram showing the different compute resources on Azure](./assets/azure-compute-services.png)

Container Apps is built on top of [Azure Kubernetes Service](https://learn.microsoft.com/azure/aks/), including a deep integration with KEDA (event-driven auto scaling for Kubernetes), Dapr (distributed application runtime) and Envoy (a service proxy designed for cloud-native applications).
The underlying complexity is completely abstracted for you.
So, no need to configure your Kubernetes service, ingress, deployment, volume manifests... You get a very simple API and user interface to configure the desired configuration for your containerized application.
This simplification means also less control, hence the difference with AKS.

![Diagram showing the architecture of Azure Container Apps](./assets/azure-container-apps.png)

Azure Container Apps has the following features:
- *Revisions*: automatic versioning that helps to manage the application lifecycle of your container apps
- *Traffic control*: split incoming HTTP traffic across multiple revisions for Blue/Green deployments and A/B testing
- *Ingress*: simple HTTPS ingress configuration, without the need to worry about DNS and certificates
- *Autoscaling*: leverage all KEDA-supported scale triggers to scale your app based on external metrics
- *Secrets*: deploy secrets that are securely shared between containers, scale rules and Dapr sidecars
- *Monitoring*: the standard output and error streams are automatically written to Log Analytics
- *Dapr*: through a simple flag, you can enable native Dapr integration for your Container Apps

Azure Container Apps introduces the following concepts:
- *Environment*: this is a secure boundary around a group of Container Apps.
They are deployed in the same virtual network, these apps can easily intercommunicate easily with each other and they write logs to the same Log Analytics workspace. An environment can be compared with a Kubernetes namespace.

- *Container App*: this is a group of containers (pod) that is deployed and scale together. They share the same disk space and network.

- *Revision*: this is an immutable snapshot of a Container App.
New revisions are automatically created and are valuable for HTTP traffic redirection strategies, such as A/B testing.

![Diagram showing the environment concept in Azure Container Apps](./assets/aca-environment.png)

### Creating the infrastructure

Now that we know what we'll be using, let's create the infrastructure we'll need for this workshop.

You can use different ways to create Azure resources: the Azure CLI, the [Azure Portal](https://portal.azure.com), ARM templates, or even VS Code extensions or third party tools like Terraform.

All these tools have one thing in common: they all use the [Azure Resource Manager (ARM) API](https://docs.microsoft.com/azure/azure-resource-manager/management/overview) to create and manage Azure resources. The Azure CLI is just a wrapper around the ARM API, and the Azure Portal is a web interface to the same API.

![Diagram of how Azure Resource Manager interacts with different tools](./assets/azure-resource-manager.png)

Any resource you create in Azure is part of a **resource group**. A resource group is a logical container that holds related resources for an Azure solution, just like a folder.

When you ran the command `.azure/infra.sh update` earlier, it created a resource group name `rg-node-microservices-prod` with all the infrastructure for you, using Azure CLI and Infrastructure as Code (IaC) templates. We'll look at the details of the scripts later in this section.

### Introducing Infrastructure as Code

Infrastructure as Code (IaC) is a way to manage your infrastructure using the same tools and practices you use for your application code. In other words: you write code to describe the resources you need, and this code is committed to your project repository so you can use it to create, update, and delete your infrastructure as part of your CI/CD pipeline or locally.

It's a great way to ensure consistency and repeatability of your infrastructure, and allows to manage the infrastructure of your project just like you manage the code of your project.

There are many existing tools to manage your infrastructure as code, such as Terraform, Pulumi, or [Azure Resource Manager (ARM) templates](https://learn.microsoft.com/azure/azure-resource-manager/templates/overview). ARM templates are JSON files that allows you to define and configure Azure resources.

In this workshop, we'll use [Bicep](https://learn.microsoft.com/azure/azure-resource-manager/bicep/overview?tabs=bicep), a new language that abtracts ARM templates creation while being more concise, readable and easier to use.

#### What's Bicep?

Bicep is a Domain Specific Language (DSL) for deploying Azure resources declaratively. It aims to drastically simplify the authoring experience with a cleaner syntax, improved type safety, and better support for modularity and code re-use. It's a transparent abstraction over ARM templates, which means anything that can be done in an ARM Template can be done in Bicep.

Here's an example of a Bicep file that creates a Log Analytics workspace:

```bicep
resource logsWorkspace 'Microsoft.OperationalInsights/workspaces@2021-06-01' = {
  name: 'my-awesome-logs'
  location: 'westeurope'
  tags: {
    environment: 'production'
  }
  properties: {
    retentionInDays: 30
  }
}
```

A resource is made of differents parts. First, you have the `resource` keyword, followed by a symbolic name of the resource that you can use to reference that resource in other parts of the template. Next to it is a string with the resource type you want to create and API version.

<div class="info" data-title="note">

> The API version is important, as it defines the version of the template used for a resource type. Different API versions can have different properties or options, and may introduce breaking changes. By specifying the API version, you ensure that your template will work regardless of the product updates, making your infrastructure more resilient over time.

</div>

Inside the resource, you then specify the name of the resource, its location, and its properties. You can also add tags to your resources, which are key/value pairs that you can use to categorize and filter your resources.

Bicep templates can be split into multiple files, and you can use modules to reuse common parts of your infrastructure. You can also use parameters to make your templates more flexible and reusable.

Have a look at the files inside the folder `./azure/infra` to see how we created the infrastructure for this workshop. The entry point is the `main.bicep` file, which is the main template that use the differents modules located in the `./azure/infra/modules` folder.

Writing templates from scratch can be a bit tedious, but fortunately most of the time you don't have to:
- You can reuse templates for the [Azure Quickstart collection](https://github.com/Azure/azure-quickstart-templates/tree/master/quickstarts)
- The [Bicep VS Code extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-bicep) help you write your templates, providing snippets, syntax highlighting, auto-completion, and validation.
- The [Bicep playground](https://aka.ms/bicepdemo) allows you to convert an ARM template to Bicep, and vice versa.

### Details about the `infra.sh` script

Because entering a bunch of commands one after the other in a terminal is not very fun, we made a Bash script to automate all the heavy lifting. This is the `.azure/infra.sh` script we ran earlier.

This script is a wrapper around Azure CLI commands. The `update` command does the following:

1. Run the command `az group create` to create a resource group if it doesn't exist yet.

2. Run the command `az deployment group create` to create or update the resources in the resource group. This command takes a Bicep template as input, and creates or updates the resources defined in the template.

3. Reformat the JSON deployment output from the previous command into the file `.<environment>.env`. You should see the file `.azure/.prod.env` that was created earlier.

4. Run `az` commands specific to the resources created, to retrieve secrets like the connection string for database or the registry credentials, and store them in the `.env` file.

If you're curious, you can have a look at the script to see how it works, and reuse it for your own projects.

---

<div class="info" data-title="skip notice">

> This step is entirely optional, you can skip it if you want to jump directly to the next section. In that case, your services won't persist the data and continue to use the in-memory storage, but you'll still be able to test and deploy the application.

</div>

## Deploy the service


### Deploy the chat API


### Deploy the chat website



---



## Bonus: Integrate LangChain

### Why using LangChain

### Update the API

---

## Bonus: Chat streaming

---

## Conclusion

This is the end of the workshop. We hope you enjoyed it, learned something new and more importantly, that you'll be able to take this knowledge back to your projects.

<div class="warning" data-title="had issues?">

> If you experienced any issues during the workshop, please let us know by [creating an issue](https://github.com/Azure-Samples/nodejs-microservices/issues) on the GitHub repository.

</div>

### Cleaning up Azure resources

<div class="important" data-title="important">

> Don't forget to delete the Azure resources once you are done running the workshop, to avoid incurring unnecessary costs!

</div>

To delete the Azure resources, you can run this command:

```bash
.azure/infra.sh delete
```

Or directly use the Azure CLI:

```bash
az group delete --name rg-node-microservices-prod
```

### References

// TODO: Update links

- This workshop URL: [aka.ms/ws/node-microservices](https://aka.ms/ws/node-microservices)
- The source repository for this workshop: [GitHub link](https://github.com/Azure-Samples/nodejs-microservices)
- The base template for this workshop: [GitHub link](https://github.com/Azure-Samples/nodejs-microservices-template)
- If something does not work: [Report an issue](https://github.com/Azure-Samples/nodejs-microservices/issues)