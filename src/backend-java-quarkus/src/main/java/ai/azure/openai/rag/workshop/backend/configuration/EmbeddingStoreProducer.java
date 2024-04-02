package ai.azure.openai.rag.workshop.backend.configuration;

import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.qdrant.QdrantEmbeddingStore;
import jakarta.enterprise.inject.Produces;
import org.eclipse.microprofile.config.inject.ConfigProperty;

public class EmbeddingStoreProducer {

  @ConfigProperty(name = "AZURE_SEARCH_INDEX_NAME", defaultValue = "rag-workshop-collection")
  String azureSearchIndexName;

  @ConfigProperty(name = "QDRANT_HOSTNAME", defaultValue = "localhost")
  String qdrantHostname;

  @Produces
  public EmbeddingStore<TextSegment> embeddingStore() {
    return QdrantEmbeddingStore.builder()
      .collectionName(azureSearchIndexName)
      .host(qdrantHostname)
      .port(6334)
      .build();
  }
}
