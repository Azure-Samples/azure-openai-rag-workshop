package ai.azure.openai.rag.workshop.backend.rest.model;

import java.util.ArrayList;
import java.util.List;

public class ChatResponse {

  public static ChatResponse fromText(String text) {
    ChatResponse response = new ChatResponse();
    response.choices.add(new Choice());
    response.choices.get(0).message = new ChatMessage();
    response.choices.get(0).message.content = text;
    return response;
  }

  public List<Choice> choices = new ArrayList<>();

  public static class Choice {
    public int index;
    public ChatMessage message;
  }
}
