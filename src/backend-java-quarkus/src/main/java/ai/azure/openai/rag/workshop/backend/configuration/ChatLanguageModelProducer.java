package ai.azure.openai.rag.workshop.backend.configuration;

import dev.langchain4j.model.azure.AzureOpenAiChatModel;
import dev.langchain4j.model.chat.ChatLanguageModel;
import jakarta.enterprise.inject.Produces;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import static java.time.Duration.ofSeconds;

public class ChatLanguageModelProducer {

  @ConfigProperty(name = "AZURE_OPENAI_KEY", defaultValue = "")
  String azureOpenAiKey;

  @ConfigProperty(name = "AZURE_OPENAI_ENDPOINT")
  String azureOpenAiEndpoint;

  @ConfigProperty(name = "AZURE_OPENAI_DEPLOYMENT_NAME", defaultValue = "gpt-35-turbo")
  String azureOpenAiDeploymentName;

  @Produces
  public ChatLanguageModel chatLanguageModel() {
    return AzureOpenAiChatModel.builder()
      .apiKey(azureOpenAiKey)
      .endpoint(azureOpenAiEndpoint)
      .deploymentName(azureOpenAiDeploymentName)
      .timeout(ofSeconds(60))
      .logRequestsAndResponses(true)
      .build();
  }
}
