
## The vector database

We'll start by creating a vector database. Vectors are arrays of numbers that represent the features or characteristics of the data. For example, an image can be converted into a vector of pixels, or a word can be converted into a vector of semantic meaning. A vector database can perform fast and accurate searches based on the similarity or distance between the vectors, rather than exact matches. This enables applications such as image recognition, natural language processing, recommendation systems, and more.

### Ingestion and retrieval

In our use-case, text will be extracted out of PDF files, and this text will be *tokenized*. Tokenization is the process of splitting our text into different tokens, which will be short portions of text. Those tokens will then be converted into a *vector* and added to the database. The vector database is then able to search for similar vectors based on the distance between them.

That's how our system will be able to find the most relevant data, coming from the original PDF files.

This will be used in the first component (the *Retriever*) of the Retrieval Augmented Generation (RAG) pattern that we will use to build our custom ChatGPT.

### About vector databases

There are many available vector databases, and a good list can be found in the supported Vector stores list from the LangChain project: [https://js.langchain.com/docs/integrations/vectorstores/](https://js.langchain.com/docs/integrations/vectorstores/).

Some of the most popular ones are:

- [MemoryVectorStore](https://js.langchain.com/docs/integrations/vectorstores/memory) which is an in-memory vector store, which is great for testing and development, but not for production.
- [Qdrant](https://qdrant.tech/)
- [pgvector](https://github.com/pgvector/pgvector)
- [Redis](https://redis.io)

On Azure, you can run the vector databases listed above, or use specific Azure services that also provide this functionality, such as:

- [Azure AI Search](https://azure.microsoft.com/services/search/)
- [Azure Cosmos DB for MongoDB vCore](https://learn.microsoft.com/azure/cosmos-db/mongodb/vcore/)

### Introducing Azure AI Search

![Azure AI Search Logo](./assets/azure-ai-search-logo.png)

[Azure AI Search](https://azure.microsoft.com/products/ai-services/cognitive-search/) can be used as a vector database that can store, index, and query vector embeddings from a search index. You can use it to power similarity search, multi-modal search, recommendation systems, or applications implementing the RAG architecture.

It supports various data types, such as *text, images, audio, video,* and *graphs*, and can perform fast and accurate searches based on the similarity or distance between the vectors, rather than exact matches. It also offers an *hybrid search*, which combines semantic and vector search in the same query.

For this workshop, we'll use Azure AI Search as our vector database as it's easy to create and manage within Azure. For the RAG use-case, most vector databases will work in a similar way.

### Exploring Azure AI Search

By now, you should already have an Azure AI Search service created in your subscription, done by the `azd provision` command you ran in the setup process.

Open the [Azure Portal](https://portal.azure.com/), and search for the **AI Search** service in the top navigation bar.

You should see a service named `gptkb-<your_random_name>` in the list. This instance is currently empty, and we will create an index and populate it with data in the next section.

![Screenshot of Azure AI Search](./assets/azure-ai-search.png)
