package ai.azure.openai.rag.workshop.ingestion.configuration;

import dev.langchain4j.model.embedding.AllMiniLmL6V2EmbeddingModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import jakarta.enterprise.inject.Produces;

public class EmbeddingModelProducer {

  @Produces
  public EmbeddingModel embeddingModel() {
    return new AllMiniLmL6V2EmbeddingModel();
  }
}
