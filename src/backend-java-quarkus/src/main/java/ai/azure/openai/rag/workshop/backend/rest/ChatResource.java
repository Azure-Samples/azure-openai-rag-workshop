package ai.azure.openai.rag.workshop.backend.rest;

import ai.azure.openai.rag.workshop.backend.AiService;
import ai.azure.openai.rag.workshop.backend.rest.model.ChatRequest;
import ai.azure.openai.rag.workshop.backend.rest.model.ChatResponse;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import static java.time.Duration.ofSeconds;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Path("/chat")
public class ChatResource {

  private static final Logger log = LoggerFactory.getLogger(ChatResource.class);

  @Inject
  AiService aiService;

  @POST
  @Consumes({"application/json"})
  @Produces({"application/json"})
  public ChatResponse chat(ChatRequest chatRequest) {
    String question = chatRequest.messages.get(0).content;
    String response = aiService.chat(question);
    return ChatResponse.fromText(response);
  }
}
