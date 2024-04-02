package ai.azure.openai.rag.workshop.backend.configuration;

import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.qdrant.QdrantEmbeddingStore;
import jakarta.enterprise.inject.Produces;

public class EmbeddingStoreProducer {

  @Produces
  public EmbeddingStore<TextSegment> embeddingStore() {
    return QdrantEmbeddingStore.builder()
      .collectionName("rag-workshop-collection")
      .host("localhost")
      .port(6334)
      .build();
  }
}
