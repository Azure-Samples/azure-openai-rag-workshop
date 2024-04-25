package ai.azure.openai.rag.workshop.ingestion.configuration;

import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.qdrant.QdrantEmbeddingStore;
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CollectionOperationResponse;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;
import jakarta.enterprise.inject.Produces;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.util.concurrent.ListenableFuture;

import java.net.URI;

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
