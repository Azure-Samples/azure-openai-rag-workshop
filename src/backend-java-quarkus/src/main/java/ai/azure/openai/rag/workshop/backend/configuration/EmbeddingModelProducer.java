package ai.azure.openai.rag.workshop.backend.configuration;

import dev.langchain4j.model.embedding.AllMiniLmL6V2EmbeddingModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import jakarta.enterprise.inject.Produces;
import org.eclipse.microprofile.config.inject.ConfigProperty;

public class EmbeddingModelProducer {

  @Produces
  public EmbeddingModel embeddingModel() {
    // TODO: initialize embedding model here
    return null;
  }
}

