---
short_title: Create your own ChatGPT with RAG
description: Discover how to create and populate a vector database, create a Web chat interface and an API to expose your agent to the Web interface. 
type: workshop
authors:
- Yohan Lasorsa
- Julien Dubois
- Christopher Maneu
- Sandra Ahlgrimm
- Antonio Goncalves
contacts:
- '@sinedied'
- '@juliendubois'
- '@cmaneu'
- '@sKriemhild'
- '@agoncal'
banner_url: assets/banner.jpg
duration_minutes: 120
audience: students, devs
level: intermediate
tags: chatgpt, openai, langchain4j, retrieval-augmented-generation, azure, containers, docker, static web apps, java, quarkus, azure ai search, azure container apps, qdrant, vector database
published: false
wt_id: java-0000-cxa
sections_title:
  - Welcome
---

# Create your own ChatGPT with Retrieval-Augmented-Generation

In this workshop, we'll explore the fundamentals of custom ChatGPT experiences based on a corpus of documents. We will create a vector database and fill-in with data from PDF documents, and then build a chat website and API to be able to ask questions about information contained in these documents. 

## You'll learn how to...

- Create a knowledge base using a vector database.
- Ingest documents in a vector database.
- Create a Web API with [Quarkus](https://quarkus.io/).
- Use [Azure OpenAI](https://azure.microsoft.com/products/ai-services/openai-service) models and [LangChain4j](https://langchain4j.github.io/langchain4j/) to generate answers based on a prompt.
- Query a vector database and augment a prompt to generate responses.
- Connect your Web API to a ChatGPT-like website.
- (optionally) Deploy your application to Azure.

## Prerequisites

<div data-hidden="$$proxy$$">

|                   |                                                                      |
|-------------------|----------------------------------------------------------------------|
| GitHub account    | [Get a free GitHub account](https://github.com/join)                 |
| Azure account        | [Get a free Azure account](https://azure.microsoft.com/free) |
| Access to Azure OpenAI API | [Request access to Azure OpenAI](https://aka.ms/oaiapply) |
| A Web browser     | [Get Microsoft Edge](https://www.microsoft.com/edge)                 |
| An HTTP client    | [For example curl](https://curl.se/)                                 |
| Java knowledge    | [Java tutorial on W3schools](https://www.w3schools.com/java/)        |
| Quarkus knowledge | [Quarkus Getting Started](https://quarkus.io/guides/getting-started) |

</div>

<div data-visible="$$proxy$$">

|                   |                                                                      |
|-------------------|----------------------------------------------------------------------|
| GitHub account    | [Get a free GitHub account](https://github.com/join)                 |
| A Web browser     | [Get Microsoft Edge](https://www.microsoft.com/edge)                 |
| An HTTP client    | [For example curl](https://curl.se/)                                 |
| Java knowledge    | [Java tutorial on W3schools](https://www.w3schools.com/java/)        |
| Quarkus knowledge | [Quarkus Getting Started](https://quarkus.io/guides/getting-started) |

</div>

We'll use [GitHub Codespaces](https://github.com/features/codespaces) to have an instant dev environment already prepared for this workshop.

If you prefer to work locally, we'll also provide instructions to setup a local dev environment using either VS Code with a [dev container](https://aka.ms/vscode/ext/devcontainer) or a manual install of the needed tools with your favourite IDE (Intellij IDEA, VS Code, etc.).

<div class="info" data-title="note" data-hidden="$$proxy$$">

> Your Azure account must have `Microsoft.Authorization/roleAssignments/write` permissions, such as [Role Based Access Control Administrator](https://learn.microsoft.com/azure/role-based-access-control/built-in-roles#role-based-access-control-administrator-preview), [User Access Administrator](https://learn.microsoft.com/azure/role-based-access-control/built-in-roles#user-access-administrator), or [Owner](https://learn.microsoft.com/azure/role-based-access-control/built-in-roles#owner). Your account also needs `Microsoft.Resources/deployments/write` permissions at a subscription level to allow deployment of Azure resources.
>
> If you have your own personal Azure subscription, you should be good to go. If you're using an Azure subscription provided by your company, you may need to contact your IT department to ensure you have the necessary permissions.

</div>