package ai.azure.openai.rag.workshop.ingestion.rest;

import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.DocumentSplitter;
import dev.langchain4j.data.document.parser.apache.pdfbox.ApachePdfBoxDocumentParser;
import dev.langchain4j.data.document.splitter.DocumentSplitters;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import org.jboss.resteasy.reactive.server.multipart.FormValue;
import org.jboss.resteasy.reactive.server.multipart.MultipartFormDataInput;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Collection;
import java.util.List;
import java.util.Map;

@Path("/ingest")
public class DocumentIngestor {

  private static final Logger log = LoggerFactory.getLogger(DocumentIngestor.class);

  @Inject
  EmbeddingModel embeddingModel;

  @Inject
  EmbeddingStore<TextSegment> embeddingStore;

  @POST
  @Consumes("multipart/form-data")
  public void ingest(MultipartFormDataInput input) throws IOException {
    for (Map.Entry<String, Collection<FormValue>> attribute : input.getValues().entrySet()) {
      for (FormValue fv : attribute.getValue()) {
        if (fv.isFileItem()) {
          log.info("### Load file, size {}", fv.getFileItem().getFileSize());
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

          log.info("### Embed segments (convert them into vectors that represent the meaning) using embedding model");
          List<Embedding> embeddings = embeddingModel.embedAll(segments).content();
          log.debug("# Number of embeddings: {}", embeddings.size());
          log.debug("# Vector length: {}", embeddings.get(0).vector().length);

          log.info("### Store embeddings into Qdrant store for further search / retrieval");
          embeddingStore.addAll(embeddings, segments);
        }
      }
    }
  }
}
