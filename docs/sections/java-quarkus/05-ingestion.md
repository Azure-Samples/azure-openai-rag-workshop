## Data ingestion

We are going to ingest the content of PDF documents in the vector database. We'll use the service located under the `src/ingestion` folder of the project. This service will extract the text from the PDF files, and send it to the vector database.

The code of this is already written for you, but let's have a look at how it works.

### The ingestion process

The `src/ingestion/src/main/java/ai/azure/openai/rag/workshop/ingestion/rest/DocumentIngestor.java` Java class contains the code that is used to ingest the data in the vector database. It creates the `/ingest` endpoint that will be used to trigger the ingestion process.

PDFs files, which are stored in the `data` folder, will be sent to this endpoint using the command line. The PDF files provided here are for demo purpose only, and suggested prompts we'll use later in the workshop are based on those files.

<div class="tip" data-title="tip">

> You can replace the PDF files in the `data` folder with your own PDF files if you want to use your custom data! Keep in mind that the PDF files must be text-based, and not scanned images. Since the ingestion process can take some time, we recommend to start with a small number of files, with not too many pages.

</div>

The ingestion process is built with the following code:

```java
// Extract the text from the PDF files
ApachePdfBoxDocumentParser pdfParser = new ApachePdfBoxDocumentParser();
Document document = pdfParser.parse(fv.getFileItem().getInputStream());

// Split the document into smaller segments
DocumentSplitter splitter = DocumentSplitters.recursive(2000, 200);
List<TextSegment> segments = splitter.split(document);
for (TextSegment segment : segments) {
  segment.metadata().add("filename", fv.getFileName());
}

// Compute the embeddings
List<Embedding> embeddings = embeddingModel.embedAll(segments).content();

// Store the embeddings in Qdrant
embeddingStore.addAll(embeddings, segments);
```

#### Reading the PDF files content

The content the PDFs files will be used as part of the *Retriever* component of the RAG architecture, to generate answers to your questions using the GPT model.

Text from the PDF files is extracted in the `ingest()` method of the `DocumentIngestor` class, using the [Apache PDFBox library](https://pdfbox.apache.org/). This text is then split into smaller segments to improve the search results.

#### Computing the embeddings

After the text is extracted into segments, they are then transformed into embeddings using the [AllMiniLmL6V2EmbeddingModel](https://github.com/langchain4j/langchain4j-embeddings) from LangChain4j. This model runs locally in memory (no need to connect to a remote LLM) and generates embeddings for each segment

#### Adding the embeddings to the vector database

The embeddings along with the original texts are then added to the vector database using the `QdrantEmbeddingStore` API. We set up Qdrant as our embedding store in the file `src/main/java/ai/azure/openai/rag/workshop/ingestion/configuration/EmbeddingStoreProducer.java`.

```java
public class EmbeddingStoreProducer {

  private static final Logger log = LoggerFactory.getLogger(EmbeddingStoreProducer.class);

  @ConfigProperty(name = "AZURE_SEARCH_INDEX", defaultValue = "kbindex")
  String azureSearchIndexName;

  @ConfigProperty(name = "QDRANT_URL", defaultValue = "http://localhost:6334")
  String qdrantUrl;

  @Produces
  public EmbeddingStore<TextSegment> embeddingStore() throws Exception {
    String qdrantHostname = new URI(qdrantUrl).getHost();
    int qdrantPort = new URI(qdrantUrl).getPort();

    QdrantGrpcClient.Builder grpcClientBuilder = QdrantGrpcClient.newBuilder(qdrantHostname, qdrantPort, false);
    QdrantClient qdrantClient = new QdrantClient(grpcClientBuilder.build());
    try {
      qdrantClient.createCollectionAsync(
        azureSearchIndexName,
        VectorParams.newBuilder()
          .setSize(384)
          .setDistance(Distance.Cosine)
          .build()
      ).get();
    } catch (Exception e) {
      log.info("Collection already exists, skipping creation. Error: {}", e.getMessage());
    }

    return QdrantEmbeddingStore.builder()
      .client(qdrantClient)
      .collectionName(azureSearchIndexName)
      .build();
  }
}
```

If there's no collection found with the specified name in Qdrant, it will create one.

### Running the ingestion process

Let's now execute this process. First, you need to make sure you have Qdrant running locally and all setup. Run the following command in a terminal to start up Qdrant (**make sure you stopped the Qdrant container before!**):

```bash
docker compose up qdrant
```

This will start Qdrant locally. Now we'll start the ingestion process by opening a new terminal and running the following commands. This will compile the code and run the ingestion server:

```bash
cd src/ingestion
./mvnw clean quarkus:dev
```

Once the server is started, in another terminal you can send the PDF files to the ingestion service using the following cUrl command:

```bash
curl -F "file=@./data/privacy-policy.pdf" \
  -F "file=@./data/support.pdf" \
  -F "file=@./data/terms-of-service.pdf" \
  http://localhost:3001/ingest
```

### Test the vector database

Open the Qdrant dashboard again by opening the following URL in your browser: [http://localhost:6333/dashboard](http://localhost:6333/dashboard).

<div class="tip" data-title="tip">

> In Codespaces, you need to select the **Ports** tab in the bottom panel, right click on the URL in the **Forwarded Address** column next to the `6333` port, and select **Open in browser**.

</div>

You should see the collection named `kbindex` in the list:

![Screenshot of the Qdrant dashboard](./assets/qdrant-dashboard.png)

You can select that collection and browse it. You should see the entries that were created by the ingestion process. Documents are split into multiple overlapping sections to improve the search results, so you should see multiple entries for each document.

Keep the services running, as we'll use them in the next section.
