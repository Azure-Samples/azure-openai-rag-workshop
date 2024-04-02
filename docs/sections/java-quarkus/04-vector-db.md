## The vector database

We'll start by creating a vector database. Vectors are arrays of numbers that represent the features or characteristics of the data. For example, an image can be converted into a vector of pixels, or a word can be converted into a vector of semantic meaning. A vector database can perform fast and accurate searches based on the similarity or distance between the vectors, rather than exact matches. This enables applications such as image recognition, natural language processing, recommendation systems, and more.

### Ingestion and retrieval

In our use-case, text will be extracted out of PDF files, and this text will be *tokenized*. Tokenization is the process of splitting our text into different tokens, which will be short portions of text. Those tokens will then be converted into a *vector* and added to the database. The vector database is then able to search for similar vectors based on the distance between them.

That's how our system will be able to find the most relevant data, coming from the original PDF files.

This will be used in the first component (the *Retriever*) of the Retrieval Augmented Generation (RAG) pattern that we will use to build our custom ChatGPT.

### About vector databases

There are many available vector databases, and a good list can be found in the supported Vector stores list from the LangChain4j project: [https://github.com/langchain4j/langchain4j](https://github.com/langchain4j/langchain4j).

Some of the popular ones are:

- [MemoryVectorStore](https://js.langchain.com/docs/integrations/vectorstores/memory) which is an in-memory vector store, which is great for testing and development, but not for production.
- [Qdrant](https://qdrant.tech/)
- [pgvector](https://github.com/pgvector/pgvector)
- [Redis](https://redis.io)

On Azure, you can run the vector databases listed above, or use specific Azure services that also provide this functionality, such as:

- [Azure AI Search](https://azure.microsoft.com/services/search/)
- [Azure Cosmos DB for MongoDB vCore](https://learn.microsoft.com/azure/cosmos-db/mongodb/vcore/)

### Introducing Qdrant

![Qdrant Logo](./assets/qdrant-logo.png)

[Qdrant](https://qdrant.tech/) is an open-source vector database that is easy to use and deploy. The core of Qdrant is a vector similarity search engine that provides a production-ready service with a convenient API to store, search, and manage vectors with an additional payload. You can think of the payloads as additional pieces of information that can help you hone in on your search and also receive useful information that you can give to your users.

For this workshop, we'll use Qdrant as our vector database as it works well with JavaScript and can run locally in Docker. For the RAG use-case, most vector databases will work in a similar way.

### Running Qdrant locally

To start Qdrant locally we have setup a Docker Compose file. You can use the following command from the root of the project:

```bash
docker compose up qdrant
```

This will pull the Docker image, start Qdrant on port `6333` and mount a volume to store the data in the `.qdrant` folder. You should see logs that look like:

```text
qdrant-1  | INFO qdrant::actix: Qdrant HTTP listening on 6333    
qdrant-1  | INFO actix_server::builder: Starting 9 workers
qdrant-1  | INFO qdrant::tonic: Qdrant gRPC listening on
qdrant-1  | INFO actix_server::server: Actix runtime found; starting in Actix runtime
```

You can test that Qdrant is running by opening the following URL in your browser: [http://localhost:6333/dashboard](http://localhost:6333/dashboard).

<div class="tip" data-title="tip">

> In Codespaces, once the servce is running, you click on the **Open in browser** button when prompted and add `/dashboard` at the end of the URL.
> You can also select the **Ports** tab in the bottom panel, right click on the URL in the **Forwarded Address** column next to the `6333` port, and select **Open in browser**.

</div>

Once you tested that Qdrant is running correctly, you can stop it by pressing `CTRL+C` in your terminal or executing the following command from the root directory of the project:

```bash
docker compose down qdrant
```
