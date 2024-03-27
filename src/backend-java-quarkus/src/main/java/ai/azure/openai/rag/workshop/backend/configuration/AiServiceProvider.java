package ai.azure.openai.rag.workshop.backend.configuration;

import ai.azure.openai.rag.workshop.backend.AiService;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.content.retriever.EmbeddingStoreContentRetriever;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.store.embedding.EmbeddingStore;
import jakarta.enterprise.inject.Produces;
import jakarta.inject.Inject;

public class AiServiceProvider {

  @Inject
  EmbeddingModel embeddingModel;

  @Inject
  EmbeddingStore<TextSegment> embeddingStore;

  @Inject
  ChatLanguageModel chatLanguageModel;

  @Produces
  public AiService aiService() {
    ContentRetriever contentRetriever = EmbeddingStoreContentRetriever.builder()
      .embeddingStore(embeddingStore)
      .embeddingModel(embeddingModel)
      .maxResults(2) // on each interaction we will retrieve the 2 most relevant segments
      .minScore(0.5) // we want to retrieve segments at least somewhat similar to user query
      .build();

    return AiServices.builder(AiService.class)
      .chatLanguageModel(chatLanguageModel)
      //.chatMemory(MessageWindowChatMemory.withMaxMessages(10))
      .contentRetriever(contentRetriever)
      .build();
  }
}
