package ai.azure.openai.rag.workshop.indexer;

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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

public class DocumentProcessor {

  private static final Logger log = LoggerFactory.getLogger(DocumentProcessor.class);


  public static void main(String[] args) {

    log.info("Read the PDF");
    Path filePath = toPath("/privacy-policy.pdf");

    log.info("Load the PDF");
    Document document = FileSystemDocumentLoader.loadDocument(filePath, new ApachePdfBoxDocumentParser());

    log.info("Split document into segments 100 tokens each");
    DocumentSplitter splitter = DocumentSplitters.recursive(
      100,
      0,
      new OpenAiTokenizer(GPT_3_5_TURBO)
    );
    List<TextSegment> segments = splitter.split(document);

    log.info("Embed segments (convert them into vectors that represent the meaning) using embedding model");
    EmbeddingModel embeddingModel = new AllMiniLmL6V2EmbeddingModel();
    List<Embedding> embeddings = embeddingModel.embedAll(segments).content();

    log.info("Store embeddings into embedding store for further search / retrieval");
    EmbeddingStore<TextSegment> embeddingStore = new InMemoryEmbeddingStore<>();
    embeddingStore.addAll(embeddings, segments);

  }

  private static Path toPath(String fileName) {
    try {
      URL fileUrl = DocumentProcessor.class.getResource(fileName);
      return Paths.get(fileUrl.toURI());
    } catch (URISyntaxException e) {
      throw new RuntimeException(e);
    }
  }

}
