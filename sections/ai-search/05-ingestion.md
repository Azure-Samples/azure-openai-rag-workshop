## Data ingestion

We are going to ingest the content of PDF documents in the vector database. We'll use a
tool located in the `src/ingestion` folder of the project. This tool will extract the text from the PDF files, and send it to the vector database.

The code of this is already written for you, but let's have a look at how it works.

### The ingestion process

The file `src/ingestion/src/plugins/ingestion.ts` contains the code that is used to ingest the data in the vector database. This runs inside a Node.js application, and deployed to Azure Container Apps.

PDFs files, which are stored in the `data` folder, will be sent to this Node.js application using the command line. The files provided here are for demo purpose only, and suggested prompts we'll use later in the workshop are based on those files.

<div class="tip" data-title="tip">

> You can replace the PDF files in the `data` folder with your own PDF files if you want to use your custom data! Keep in mind that the PDF files must be text-based, and not scanned images. Since the ingestion process can take some time, we recommend to start with a small number of files, with not too many pages.

</div>

#### Reading the PDF files content

The content the PDFs files will be used as part of the *Retriever* component of the RAG architecture, to generate answers to your questions using the GPT model.

Text from the PDF files is extracted in the `src/ingestion/src/plugins/ingestion.ts` file, using the [pdf.js library](https://mozilla.github.io/pdf.js/) through LangChain.js [PDF file loader](https://js.langchain.com/docs/integrations/document_loaders/file_loaders/pdf/). Once the text is extracted, we split it into smaller chunks to improve the search results.

```ts
// Extract text from the PDF
const blob = new Blob([file.data]);
const loader = new PDFLoader(blob, {
  splitPages: false,
});
const rawDocuments = await loader.load();
rawDocuments[0].metadata.source = file.filename;

// Split the text into smaller chunks
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1500,
  chunkOverlap: 100,
});
const documents = await splitter.splitDocuments(rawDocuments);
```

#### Adding the documents to the vector database

LangChain.js vector store integrations then takes care of the heavy lifting for you. For every document:
1. The embeddings are computed.
2. A new document is created combining the original text and the embeddings (vector).
3. The document is added to the vector database, using the [Azure AI Search JavaScript client library](https://www.npmjs.com/package/@azure/search-documents).

This process is done in batches, to improve performance and limit the number of requests.

```ts
// Generate embeddings and save in database
await this.vectorStore.addDocuments(documents);
```

### Running the ingestion process

Let's now execute this process. First, you need to make sure you have deployed the ingestion service to Azure. If you forgot to do it during the **Azure Setup** step, just run this command:

```bash
azd deploy ingestion
```

![Screenshot of the ingestion deployement](./assets/ingestion-deployement.png)

Once the ingestion is deployed, you can run the ingestion process by running the `./scripts/ingest-data.sh` script on Linux or macOS, or `./scripts/ingest-data.ps1` on Windows:

```bash
./scripts/ingest-data.sh
```

![Screenshot of the ingestion result](./assets/ingestion-result.png)

Once this process is executed, a new index will be available in your Azure AI Search service, where you can see the documents that were ingested.

### Test the vector database

In the [Azure Portal](https://portal.azure.com/), you can now find again the service named `gptkb-<your_random_name>`, which will have a new index named `vectorsearch`.

In the **Search management** section on the left, select the **Indexes** tab. You should see the `vectorsearch` index in the list.

![Screenshot of the Azure AI Search indexes](./assets/azure-ai-search-indexes.png)

You can select that index and browse it. For example, in the **Search explorer** tab, if you ingested the original PDF files that were about the *Contoso Real Estate* company, you can search for `rentals` and see the results:

![Screenshot of the search results in the index](./assets/azure-ai-search-results.png)
