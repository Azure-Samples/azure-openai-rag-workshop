package ai.azure.openai.rag.workshop.backend.configuration;

import dev.langchain4j.model.azure.AzureOpenAiChatModel;
import dev.langchain4j.model.chat.ChatLanguageModel;
import jakarta.enterprise.inject.Produces;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import com.azure.core.credential.TokenRequestContext;
import com.azure.identity.DefaultAzureCredential;
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
    // initialize chat model here
    AzureOpenAiChatModel model;

    try {
      // Use the current user identity to authenticate with Azure OpenAI.
      // (no secrets needed, just use `az login` or `azd auth login` locally, and managed identity when deployed on Azure).
      DefaultAzureCredential credentials = new DefaultAzureCredentialBuilder().build();

      // Try requesting a token, so we can fallback to the other builder if it doesn't work
      TokenRequestContext request = new TokenRequestContext();
      request.addScopes("https://cognitiveservices.azure.com/.default");
      credentials.getTokenSync(request);

      model = AzureOpenAiChatModel.builder()
        .tokenCredential(credentials)
        .endpoint(azureOpenAiEndpoint)
        .deploymentName(azureOpenAiDeploymentName)
        .timeout(ofSeconds(60))
        .logRequestsAndResponses(true)
        .build();
    } catch (Exception e) {
      // Default value for local execution
      log.info("### Using fallback configuration for OpenAI");
      model = AzureOpenAiChatModel.builder()
        .apiKey("__dummy")
        .endpoint(azureOpenAiEndpoint)
        .deploymentName(azureOpenAiDeploymentName)
        .timeout(ofSeconds(60))
        .logRequestsAndResponses(true)
        .build();
    }

    log.info("### Producing ChatLanguageModel with AzureOpenAiChatModel");

    return model;
  }
}
