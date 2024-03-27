package ai.azure.openai.rag.workshop.backend.configuration;

import dev.langchain4j.model.azure.AzureOpenAiChatModel;
import dev.langchain4j.model.chat.ChatLanguageModel;
import jakarta.enterprise.inject.Produces;

import static java.time.Duration.ofSeconds;

public class ChatLanguageModelProducer {

  @Produces
  public ChatLanguageModel chatLanguageModel() {
    return AzureOpenAiChatModel.builder()
      .apiKey(System.getenv("AZURE_OPENAI_KEY"))
      .endpoint(System.getenv("AZURE_OPENAI_ENDPOINT"))
      .deploymentName(System.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"))
      .timeout(ofSeconds(60))
      .logRequestsAndResponses(true)
      .build();
  }
}
