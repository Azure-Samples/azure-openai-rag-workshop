## Data ingestion

We are going to ingest the content of PDF documents in the vector database. We'll use a
tool located in the `src/ingestion` folder of the project. This tool will extract the text from the PDF files, and send it to the vector database.

The code of this is already written for you, but let's have a look at how it works.

### The ingestion process

The `src/ingestion/src/lib/ingestor.ts` file contains the code that is used to ingest the data in the vector database. This runs inside a Node.js application, and deployed to Azure Container Apps.

PDFs files, which are stored in the `data` folder, will be sent to this Node.js application using the command line. The files provided here are for demo purpose only, and suggested prompts we'll use later in the workshop are based on those files.

<div class="tip" data-title="tip">

> You can replace the PDF files in the `data` folder with your own PDF files if you want to use your custom data! Keep in mind that the PDF files must be text-based, and not scanned images. Since the ingestion process can take some time, we recommend to start with a small number of files, with not too many pages.

</div>

#### Reading the PDF files content

The content the PDFs files will be used as part of the *Retriever* component of the RAG architecture, to generate answers to your questions using the GPT model.

Text from the PDF files is extracted in the `src/ingestion/src/lib/document-processor.ts` file, using the [pdf.js library](https://mozilla.github.io/pdf.js/). You can have a look at code of the `extractTextFromPdf()` function if you're curious about how it works.

#### Computing the embeddings

After the text is extracted, it's then transformed into embeddings using the [OpenAI JavaScript library](https://github.com/openai/openai-node):

```ts
async createEmbedding(text: string): Promise<number[]> {
  const embeddingsClient = await this.openai.getEmbeddings();
  const result = await embeddingsClient.create({ input: text, model: this.embeddingModelName });
  return result.data[0].embedding;
}
```

#### Adding the documents to the vector database

The embeddings along with the original texts are then added to the vector database using the [Qdrant JavaScript client library](https://www.npmjs.com/package/@qdrant/qdrant-js). This process is done in batches, to improve performance and limit the number of requests:

```ts
const points = sections.map((section) => ({
  // ID must be either a 64-bit integer or a UUID
  id: getUuid(section.id, 5),
  vector: section.embedding!,
  payload: {
    id: section.id,
    content: section.content,
    category: section.category,
    sourcepage: section.sourcepage,
    sourcefile: section.sourcefile,
  },
}));

await this.qdrantClient.upsert(indexName, { points });
```

### Running the ingestion process

Let's now execute this process. First, you need to make sure you have Qdrant and the ingestion service running locally. We'll use Docker Compose to run both services at the same time. Run the following command in a terminal (**make sure you stopped the Qdrant container before!**):

```bash
docker compose up
```

This will start both Qdrant and the ingestion service locally. This may takes a few minutes the first time, as Docker needs to download the images.

<div class="tip" data-title="tip">

> You can look at the `docker-compose.yml` file at the root of the project to see how the services are configured. Docker Compose automatically loads the `.env` file, so we can use the environment variables exposed there. To learn more about Docker Compose, check out the [official documentation](https://docs.docker.com/compose/).

</div>

Once all services are started, you can run the ingestion process by opening a new terminal and running the `./scripts/ingest-data.sh` script on Linux or macOS, or `./scripts/ingest-data.ps1` on Windows:

```bash
./scripts/ingest-data.sh
```

![Screenshot of the ingestion CLI](./assets/ingestion-cli.png)

Once this process is executed, a new collection will be available in your database, where you can see the documents that were ingested.

### Test the vector database

Open the Qdrant dashboard again by opening the following URL in your browser: [http://localhost:6333/dashboard](http://localhost:6333/dashboard).

<div class="tip" data-title="tip">

> In Codespaces, you need to select the **Ports** tab in the bottom panel, right click on the URL in the **Forwarded Address** column next to the `6333` port, and select **Open in browser**.

</div>

You should see the collection named `kbindex` in the list:

![Screenshot of the Qdrant dashboard](./assets/qdrant-dashboard.png)

You can select that collection and browse it. You should see the entries that were created by the ingestion process. Documents are split into multiple overlapping sections to improve the search results, so you should see multiple entries for each document.

Keep the services running, as we'll use them in the next section.
