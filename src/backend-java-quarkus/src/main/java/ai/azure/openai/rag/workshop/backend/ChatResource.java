package ai.azure.openai.rag.workshop.backend;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.openai.OpenAiModelName;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Response;
import static java.time.Duration.ofSeconds;

@Path("/chat")
public class ChatResource {

  @POST
  @Consumes({"application/json"})
  @Produces({"application/json"})
  public Response chat(ChatRequest chatRequest) {

    ChatLanguageModel model = OpenAiChatModel.builder()
      .apiKey(System.getenv("OPENAI_API_KEY"))
      .modelName(OpenAiModelName.GPT_3_5_TURBO)
      .temperature(0.3)
      .timeout(ofSeconds(60))
      .logRequests(true)
      .logResponses(true)
      .build();

    String response = model.generate("Can you say hello in French?");

    return Response.ok().entity(response).build();

  }
}
