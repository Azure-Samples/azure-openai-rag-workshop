package ai.azure.openai.rag.workshop.backend.configuration;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.ollama.OllamaChatModel;
import jakarta.enterprise.inject.Alternative;
import jakarta.enterprise.inject.Produces;
import static java.time.Duration.ofSeconds;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Alternative
public class ChatLanguageModelOllamaProducer {

  private static final Logger log = LoggerFactory.getLogger(ChatLanguageModelOllamaProducer.class);

  @ConfigProperty(name = "OLLAMA_BASE_URL", defaultValue = "http://localhost:11434")
  String ollamaBaseUrl;

  @ConfigProperty(name = "OLLAMA_MODEL_NAME", defaultValue = "llama3")
  String ollamaModelName;

  @Produces
  public ChatLanguageModel chatLanguageModel() {

    log.info("### Producing ChatLanguageModel with OllamaChatModel");

    return OllamaChatModel.builder()
      .baseUrl(ollamaBaseUrl)
      .modelName(ollamaModelName)
      .timeout(ofSeconds(60))
      .build();
  }
}

