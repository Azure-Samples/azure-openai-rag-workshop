package ai.azure.openai.rag.workshop.backend.configuration;

import dev.langchain4j.model.azure.AzureOpenAiChatModel;
import dev.langchain4j.model.chat.ChatLanguageModel;
import jakarta.enterprise.inject.Produces;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import static java.time.Duration.ofSeconds;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ChatLanguageModelAzureOpenAiProducer {

  @Produces
  public ChatLanguageModel chatLanguageModel() {
    // TODO: initialize chat model here
    return null;
  }
}

