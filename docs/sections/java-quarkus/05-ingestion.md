## Data ingestion

We are going to ingest the content of PDF documents in the vector database. We'll use the service located under the `src/ingestion` folder of the project. This service will extract the text from the PDF files, and send it to the vector database.

The code of this is already written for you, but let's have a look at how it works.

### Introducing Quarkus

We'll be using [Quarkus](https://quarkus.io) to create our Ingestion service.

### Configuring Qdrant

Qdrant is configured as a Quarkus producer in the `src/main/java/ai/azure/openai/rag/workshop/ingestion/configuration/EmbeddingStoreProducer.java` class.

```java
public class EmbeddingStoreProducer {

  @ConfigProperty(name = "AZURE_SEARCH_INDEX", defaultValue = "kbindex")
  String azureSearchIndexName;

  @ConfigProperty(name = "QDRANT_URL", defaultValue = "http://localhost:6334")
  String qdrantUrl;

  @Produces
  public EmbeddingStore<TextSegment> embeddingStore() throws URISyntaxException {
    String qdrantHostname = new URI(qdrantUrl).getHost();
    int qdrantPort = new URI(qdrantUrl).getPort();
    return QdrantEmbeddingStore.builder()
      .collectionName(azureSearchIndexName)
      .host(qdrantHostname)
      .port(qdrantPort)
      .build();
  }
}
```

### Creating the ingestion process

The `src/ingestion/src/main/java/ai/azure/openai/rag/workshop/ingestion/rest/DocumentIngestor.java` Java class contains the code that is used to ingest the data in the vector database. It creates the `/ingest` endpoint that will be used to trigger the ingestion process.

PDFs files, which are stored in the `data` folder, will be sent to this endpoint using the command line. The PDF files provided here are for demo purpose only, and suggested prompts we'll use later in the workshop are based on those files.

<div class="tip" data-title="tip">

> You can replace the PDF files in the `data` folder with your own PDF files if you want to use your custom data! Keep in mind that the PDF files must be text-based, and not scanned images. Since the ingestion process can take some time, we recommend to start with a small number of files, with not too many pages.

</div>

The ingestion process is built with the following code:

```java
  @POST
  @Consumes("multipart/form-data")
  public void ingest(MultipartFormDataInput input) throws IOException {
    for (Map.Entry<String, Collection<FormValue>> attribute : input.getValues().entrySet()) {
      for (FormValue fv : attribute.getValue()) {
        if (fv.isFileItem()) {
          log.info("### Load file, size {}", fv.getFileItem().getFileSize());
          
          // Extract text from PDF and load them into the Qdrant vector database
        }
      }
    }
  }
```

#### Reading the PDF files content

The content the PDFs files will be used as part of the *Retriever* component of the RAG architecture, to generate answers to your questions using the GPT model.

Text from the PDF files is extracted in the `ingest()` method of the `DocumentIngestor` class, using the [Apache PDFBox library](https://pdfbox.apache.org/). This text is then split into smaller segments to improve the search results.

```java
          ApachePdfBoxDocumentParser pdfParser = new ApachePdfBoxDocumentParser();
          Document document = pdfParser.parse(fv.getFileItem().getInputStream());
          log.debug("# PDF size: {}", document.text().length());

          log.info("### Split document into segments 100 tokens each");
          DocumentSplitter splitter = DocumentSplitters.recursive(2000, 200);
          List<TextSegment> segments = splitter.split(document);
          for (TextSegment segment : segments) {
            log.debug("# Segment size: {}", segment.text().length());
            segment.metadata().add("filename", fv.getFileName());
          }
          log.debug("# Number of segments: {}", segments.size());
```

#### Computing the embeddings

After the text is extracted into segments, they are then transformed into embeddings using the [AllMiniLmL6V2EmbeddingModel](https://github.com/langchain4j/langchain4j-embeddings) from LangChain4j. This model runs locally in memory (no need to connect to a remote LLM) and generates embeddings for each segment.

AllMiniLmL6V2EmbeddingModel is configured as a Quarkus producer in the `src/main/java/ai/azure/openai/rag/workshop/ingestion/configuration/EmbeddingModelProducer.java` class:

```java
public class EmbeddingModelProducer {

  @Produces
  public EmbeddingModel embeddingModel() {
    return new AllMiniLmL6V2EmbeddingModel();
  }
}
```

It is then called in the `DocumentIngestor` class:

```java
          log.info("### Embed segments (convert them into vectors that represent the meaning) using embedding model");
          List<Embedding> embeddings = embeddingModel.embedAll(segments).content();
          log.debug("# Number of embeddings: {}", embeddings.size());
          log.debug("# Vector length: {}", embeddings.get(0).vector().length);
```

#### Adding the embeddings to the vector database

Last best not least, the embeddings are stored in the Qdrant vector database:

```java
          log.info("### Store embeddings into Qdrant store for further search / retrieval");
          embeddingStore.addAll(embeddings, segments);
```

### Running the ingestion process

Let's now execute this process. First, you need to make sure you have Qdrant running locally and all setup. Run the following command in a terminal to start up Qdrant (**make sure you stopped the Qdrant container before!**):

```bash
docker compose -f infra/docker-compose/qdrant.yml up
```

This will start Qdrant locally. Make sure you can access the Qdrant dashboard at the URL http://localhost:6333/dashboard. Then, create a new collection named `kbindex` with the following cUrl command:

```bash
curl -X PUT 'http://localhost:6333/collections/kbindex' \
     -H 'Content-Type: application/json' \
     --data-raw '{
       "vectors": {
         "size": 384,
         "distance": "Dot"
       }
     }'
```

You should see the collection in the dashabord:

![Collection listed in the Qdrant dashboard](./assets/qdrant-dashboard-collection.png)

You can also use a few cUrl commands to visualize the collection:

```bash
curl http://localhost:6333/collections
curl http://localhost:6333/collections/kbindex | jq
```

Once Qdrant is started and the collection is created, you can run the ingestion process by opening a new terminal and running the following Maven command under the `src/ingestion-java` folder. This will compile the code and run the Quarkus service in development mode, which will listen for incoming requests on port 3001:

```bash
./mvnw clean compile quarkus:dev
```

<div class="tip" data-title="tip">

> If you want to increase the logs you can set the level to debug instead of info in the src/main/resources/tinylog.properties file.

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
