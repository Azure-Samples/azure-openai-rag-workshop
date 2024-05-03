package ai.azure.openai.rag.workshop.backend.configuration;

import dev.langchain4j.model.azure.AzureOpenAiChatModel;
import dev.langchain4j.model.chat.ChatLanguageModel;
import jakarta.enterprise.inject.Produces;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import com.azure.identity.DefaultAzureCredentialBuilder;

import static java.time.Duration.ofSeconds;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ChatLanguageModelAzureOpenAiProducer {

  private static final Logger log = LoggerFactory.getLogger(ChatLanguageModelAzureOpenAiProducer.class);

  @ConfigProperty(name = "AZURE_OPENAI_URL")
  String azureOpenAiEndpoint;

  @ConfigProperty(name = "AZURE_OPENAI_DEPLOYMENT_NAME", defaultValue = "gpt-35-turbo")
  String azureOpenAiDeploymentName;

  @Produces
  public ChatLanguageModel chatLanguageModel() {

    log.info("### Producing ChatLanguageModel with AzureOpenAiChatModel");

    return AzureOpenAiChatModel.builder()
      .tokenCredential(new DefaultAzureCredentialBuilder().build())
      .endpoint(azureOpenAiEndpoint)
      .deploymentName(azureOpenAiDeploymentName)
      .timeout(ofSeconds(60))
      .logRequestsAndResponses(true)
      .build();
  }
}
