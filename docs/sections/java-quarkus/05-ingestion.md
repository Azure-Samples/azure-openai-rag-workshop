## Data ingestion

We are going to ingest the content of PDF documents in the vector database. We'll use the service located under the `src/ingestion-java` folder of the project. This service will extract the text from the PDF files, and send it to the vector database.

The code of this is already written for you, but let's have a look at how it works.

### The ingestion process

The `src/ingestion-java/src/ingestion-java/src/main/java/ai/azure/openai/rag/workshop/ingestion/DocumentIngestor.java` Java class contains the code that is used to ingest the data in the vector database. It has a `public static void main` so it can be executed locally.

PDFs files, which are stored in the `data` folder, will be read by the `DocumentIngestor` using the command line. The PDF files provided here are for demo purpose only, and suggested prompts we'll use later in the workshop are based on those files.

<div class="tip" data-title="tip">

> You can replace the PDF files in the `data` folder with your own PDF files if you want to use your custom data! Keep in mind that the PDF files must be text-based, and not scanned images. Since the ingestion process can take some time, we recommend to start with a small number of files, with not too many pages.

</div>

Create the `DocumentIngestor` under the `src/main/java` directory, inside the `ai.azure.openai.rag.workshop.ingestion` package. The `main` method of the `DocumentIngestor` class looks like the following:

```java
public class DocumentIngestor {

  private static final Logger log = LoggerFactory.getLogger(DocumentIngestor.class);

  public static void main(String[] args) {
    
    // Setup Qdrant store for embeddings storage and retrieval
    // Load all the PDFs, compute embeddings and store them in Qdrant store
    
    System.exit(0);
  }
}
```

LangChain4j uses [TinyLog](https://tinylog.org) as a logging framework. Create the `src/ingestion-java/src/main/resources/tinylog.properties` and set the log level to `info` (you can also set it to `debug` if you want more logs):

```properties
writer.level = info
```

#### Setup the Qadrant client

Now that we have the `DocumentIngestor` class, we need to setup the Qdrant client to interact with the vector database. We'll use the `QdrantEmbeddingStore` class from LangChain4j to interact with Qdrant. Notice the name of the collection (`rag-workshop-collection`), the port (`localhost` as Qdrant is running locally) and th GRPC port (`6334`):

```java
public class DocumentIngestor {

  public static void main(String[] args) {

    // Setup Qdrant store for embeddings storage and retrieval
    log.info("### Setup Qdrant store for embeddings storage and retrieval");
    EmbeddingStore<TextSegment> qdrantEmbeddingStore = QdrantEmbeddingStore.builder()
      .collectionName("rag-workshop-collection")
      .host("localhost")
      .port(6334)
      .build();

    // Load all the PDFs, compute embeddings and store them in Qdrant store

    System.exit(0);
  }
}
```

#### Reading the PDF files content

The content of the PDFs files will be used as part of the *Retriever* component of the RAG architecture, to generate answers to your questions using the GPT model. To read these files we need to iterate through the PDF files located under the classpath. We'll use the `findPdfFiles()` method to get the list of PDF files and then load them with the `FileSystemDocumentLoader` from LangChain4j:

```java
public class DocumentIngestor {

  public static void main(String[] args) {

    // Setup Qdrant store for embeddings storage and retrieval

    // Load all the PDFs, compute embeddings and store them in Qdrant store
    log.info("### Read all the PDFs");
    List<Path> pdfFiles = findPdfFiles();
    for (Path pdfFile : pdfFiles) {

      log.info("### Load PDF: {}", pdfFile.toAbsolutePath());
      Document document = FileSystemDocumentLoader.loadDocument(pdfFile, new ApachePdfBoxDocumentParser());

      // ...
    }

    System.exit(0);
  }

  public static List<Path> findPdfFiles() {
    try (var files = Files.walk(Paths.get("./"))) {
      return files
        .filter(path -> path.toString().endsWith(".pdf"))
        .collect(Collectors.toList());
    } catch (IOException e) {
      throw new RuntimeException("Error reading files from directory", e);
    }
  }
}
```

#### Split the document into segments

Now that the PDF files are loaded, we need to split each PDF file (thanks to `DocumentSplitter`) into smaller chunks, called `TextSegment`:


```java
public class DocumentIngestor {

  public static void main(String[] args) {

    // Setup Qdrant store for embeddings storage and retrieval

    // Load all the PDFs, compute embeddings and store them in Qdrant store
    for (Path pdfFile : pdfFiles) {

      // ...
      log.info("### Split document into segments 100 tokens each");
      DocumentSplitter splitter = DocumentSplitters.recursive(100, 0, new OpenAiTokenizer(GPT_3_5_TURBO));
      List<TextSegment> segments = splitter.split(document);

      // ...
    }

    System.exit(0);
  }
}
```

#### Computing the embeddings

After the text is extracted into segments, they are then transformed into embeddings using the [AllMiniLmL6V2EmbeddingModel](https://github.com/langchain4j/langchain4j-embeddings) from LangChain4j. This model runs locally in memory (no need to connect to a remote LLM) and generates embeddings for each segment:

```java
public class DocumentIngestor {

  public static void main(String[] args) {

    // Setup Qdrant store for embeddings storage and retrieval

    // Load all the PDFs, compute embeddings and store them in Qdrant store
    for (Path pdfFile : pdfFiles) {

      // ...

      log.info("### Embed segments (convert them into vectors that represent the meaning) using embedding model");
      EmbeddingModel embeddingModel = new AllMiniLmL6V2EmbeddingModel();
      List<Embedding> embeddings = embeddingModel.embedAll(segments).content();

      // ...
    }
  }
}
```

#### Adding the embeddings to the vector database

The embeddings along with the original texts are then added to the vector database using the `QdrantEmbeddingStore` API:

```java
public class DocumentIngestor {

  public static void main(String[] args) {

    // Setup Qdrant store for embeddings storage and retrieval

    // Load all the PDFs, compute embeddings and store them in Qdrant store
    for (Path pdfFile : pdfFiles) {

      // ...

      log.info("### Store embeddings into Qdrant store for further search / retrieval");
      qdrantEmbeddingStore.addAll(embeddings, segments);
    }
  }
}
```

### Running the ingestion process

Let's now execute this process. First, you need to make sure you have Qdrant running locally and all setup. Run the following command in a terminal to start up Qdrant (**make sure you stopped the Qdrant container before!**):

```bash
docker compose -f infra/docker-compose/qdrant.yml up
```

This will start Qdrant locally. Make sure you can access the Qdrant dashboard at the URL http://localhost:6333/dashboard. Then, create a new collection named `rag-workshop-collection` with the following cUrl command:

```bash
curl -X PUT 'http://localhost:6333/collections/rag-workshop-collection' \
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
curl http://localhost:6333/collections/rag-workshop-collection | jq
```

Once Qdrant is started and the collection is created, you can run the ingestion process by opening a new terminal and running the following Maven command under the `src/ingestion-java` folder. This will compile the code and run the ingestion process by running `DocumentIngestor`:

```bash
mvn clean compile exec:java
```

<div class="tip" data-title="tip">

> If you want to increase the logs you can set the level to debug instead of info in the src/main/resources/tinylog.properties file.

> writer.level = debug

</div>

Once this process is executed, a new collection will be available in your database, where you can see the documents that were ingested.

### Test the vector database

Open the Qdrant dashboard again by opening the following URL in your browser: [http://localhost:6333/dashboard](http://localhost:6333/dashboard).

<div class="tip" data-title="tip">

> In Codespaces, you need to select the **Ports** tab in the bottom panel, right click on the URL in the **Forwarded Address** column next to the `6333` port, and select **Open in browser**.

</div>

You should see the collection named `rag-workshop-collection` in the list:

![Screenshot of the Qdrant dashboard](./assets/qdrant-dashboard.png)

You can select that collection and browse it. You should see the entries that were created by the ingestion process. Documents are split into multiple overlapping sections to improve the search results, so you should see multiple entries for each document.

Keep the services running, as we'll use them in the next section.
