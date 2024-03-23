package ai.azure.openai.rag.workshop.backend;

import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.embedding.AllMiniLmL6V2EmbeddingModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.openai.OpenAiModelName;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.qdrant.QdrantEmbeddingStore;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import dev.langchain4j.model.output.Response;
import static java.time.Duration.ofSeconds;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;

@Path("/chat")
public class ChatResource {

  private static final Logger log = LoggerFactory.getLogger(ChatResource.class);

  @POST
  @Consumes({"application/json"})
  @Produces({"application/json"})
  public String chat(ChatRequest chatRequest) {

    String question = chatRequest.messages.get(0).content;

    log.info("### Embed the question (convert the question into vectors that represent the meaning) using embeddedQuestion model");
    EmbeddingModel embeddingModel = new AllMiniLmL6V2EmbeddingModel();
    Embedding embeddedQuestion = embeddingModel.embed(question).content();
    log.debug("Vector length: {}", embeddedQuestion.vector().length);

    log.info("### Find relevant embeddings from Qdrant based on the question");
    EmbeddingStore<TextSegment> qdrantEmbeddingStore = QdrantEmbeddingStore.builder()
      .collectionName("rag-workshop-collection")
      .host("localhost")
      .port(6334)
      .build();

    List<EmbeddingMatch<TextSegment>> relevant = qdrantEmbeddingStore.findRelevant(embeddedQuestion, 3);

    log.info("### Builds chat history using the relevant embeddings");
    List<ChatMessage> chatMessages = new ArrayList<>();
    for (int i = 0; i < relevant.size(); i++) {
      EmbeddingMatch<TextSegment> textSegmentEmbeddingMatch = relevant.get(i);
      chatMessages.add(SystemMessage.from(textSegmentEmbeddingMatch.embedded().text()));
      log.debug("Relevant segment {}: {}", i, textSegmentEmbeddingMatch.embedded().text());
    }

    log.info("### Invoke the LLM");
    chatMessages.add(UserMessage.from(question));

    ChatLanguageModel model = OpenAiChatModel.builder()
      .apiKey(System.getenv("OPENAI_API_KEY"))
      .modelName(OpenAiModelName.GPT_3_5_TURBO)
      .temperature(0.3)
      .timeout(ofSeconds(60))
      .logRequests(true)
      .logResponses(true)
      .build();

    Response<AiMessage> response = model.generate(chatMessages);

    return response.content().text();
  }
}
