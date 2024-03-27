package ai.azure.openai.rag.workshop.ingestion;

import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.DocumentSplitter;
import dev.langchain4j.data.document.loader.FileSystemDocumentLoader;
import dev.langchain4j.data.document.parser.apache.pdfbox.ApachePdfBoxDocumentParser;
import dev.langchain4j.data.document.splitter.DocumentSplitters;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.AllMiniLmL6V2EmbeddingModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import static dev.langchain4j.model.openai.OpenAiModelName.GPT_3_5_TURBO;
import dev.langchain4j.model.openai.OpenAiTokenizer;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;
import dev.langchain4j.store.embedding.qdrant.QdrantEmbeddingStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;

public class DocumentIngestor {

  private static final Logger log = LoggerFactory.getLogger(DocumentIngestor.class);

  public static void main(String[] args) {

    // Setup Qdrant store for embeddings storage and retrieval
    log.info("### Setup Qdrant store for embeddings storage and retrieval");
    EmbeddingStore<TextSegment> qdrantEmbeddingStore = QdrantEmbeddingStore.builder()
      .collectionName("rag-workshop-collection")
      .host("localhost")
      .port(6334)
      .build();

    // Load all the PDFs, compute embeddings and store them in Qdrant store
    log.info("### Read all the PDFs");
    List<Path> pdfFiles = findPdfFiles();
    for (Path pdfFile : pdfFiles) {

      log.info("### Load PDF: {}", pdfFile.toAbsolutePath());
      Document document = FileSystemDocumentLoader.loadDocument(pdfFile, new ApachePdfBoxDocumentParser());
      log.debug("# PDF size: {}", document.text().length());

      log.info("### Split document into segments 100 tokens each");
      DocumentSplitter splitter = DocumentSplitters.recursive(100, 0, new OpenAiTokenizer(GPT_3_5_TURBO));
      List<TextSegment> segments = splitter.split(document);
      log.debug("# Number of segments: {}", segments.size());

      log.info("### Embed segments (convert them into vectors that represent the meaning) using embedding model");
      EmbeddingModel embeddingModel = new AllMiniLmL6V2EmbeddingModel();
      List<Embedding> embeddings = embeddingModel.embedAll(segments).content();
      log.debug("# Number of embeddings: {}", embeddings.size());
      log.debug("# Vector length: {}", embeddings.get(0).vector().length);

      log.info("### Store embeddings into Qdrant store for further search / retrieval");
      qdrantEmbeddingStore.addAll(embeddings, segments);
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
