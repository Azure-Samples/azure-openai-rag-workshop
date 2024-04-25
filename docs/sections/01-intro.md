## Introduction

Organizations of all sizes have amassed a plethora of documents over time. While generative AI, such as ChatGPT, can provide answers about general knowledge and historical events with reasonable accuracy, they can also be tailored to answer questions based on a company's internal documents.

<div class="info" data-title="note">

> **Accuracy in Generative AI** 
> Large Language Models (LLMs), like the ones powering ChatGPT, aren't designed for high-precision answers. They may produce "hallucinations", offering responses that seem authoritative but are actually incorrect. It's crucial to **inform users that the responses are AI-generated**. In this workshop, we'll explore how to generate answers that link to their information sources — this is what we call *grounding* — enabling users to verify the accuracy of the AI's responses.

</div>

In this workshop, we'll guide you through building a chat application that generates responses based on your documents and deploy it to Azure. We'll touch on many different topics, but we'll take it one step at a time.

### Application architecture

Below is the architecture of the application we're going to build:

![Application architecture](./assets/architecture.png)

Our application consists of five main components:

1. **Vector Database**: The vector database stores mathematical representations of our documents, known as _embeddings_. These are used by the Chat API to find documents relevant to a user's question.

2. **Ingestion Service**: The ingestion service feeds data from your documents into this vector database.

3. **Chat API**: This API enables a client application to send chat messages and receive answers generated from the documents in the vector database.

4. **Chat Website**: This site offers a ChatGPT-like interface for users to ask questions and receive answers about the ingested documents.

5. **OpenAI Model Deployment**: We will use the `gpt-3.5-turbo` model, hosted on Azure, for this workshop. The code can also be adapted to work with OpenAI's APIs or Ollame with minimal changes.

### What is Retrievial-Augmented Generation?

Retrieval-Augmented generation (RAG) is a powerful technique that combines the strengths of two different approaches in natural language processing: retrieval-based methods and generative models. This hybrid approach allows for the generation of responses that are both contextually relevant and rich in content. Let's break down how this works in the context of creating a custom ChatGPT-like model.

At its core, RAG involves two main components:

- **Retriever**: Think "_like a search engine_", finding relevant information from a database. The retriever usually searches in a vector database. It could also - for some use cases - search on application dabases, APIs and other sources of information. In this workshop, we will implement this logic in the _Chat API_.

- **Generator**: Acts like a writer, taking the prompt and information retrieved to craft a response. In this workshop, OpenAI `gpt-3.5-turbo` will be our generator.

![](./assets/rag.png)

The RAG process involves the following steps:

1. **Embedding Computation**: Converts a user's prompt into an embedding for similarity comparisons.

2. **Document Retrieval**: Finds the most relevant documents using the prompt's embedding. This is where systems like Azure AI Search come into play, allowing for efficient vector similarity searches.

3. **Contextual Augmentation**: Enhances the user prompt with information from retrieved documents. This step is crucial as it provides additional context and information to the generator.

4. **Response Generation**: Use the model to generate a response using the augmented prompt. The model uses the additional context provided by the retrieved documents to produce a more informed and accurate output.

