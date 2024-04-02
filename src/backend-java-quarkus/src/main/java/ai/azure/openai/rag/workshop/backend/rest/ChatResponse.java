package ai.azure.openai.rag.workshop.backend.rest;

import java.util.ArrayList;
import java.util.List;

public class ChatResponse {

  /**
   * Create a ChatResponse when there is only one message to return.
   */
  public static ChatResponse fromMessage(String message) {
    ChatResponse chatResponse = new ChatResponse();
    ChatResponse.Choice choice = new ChatResponse.Choice();
    choice.index = 0;
    choice.message = new ai.azure.openai.rag.workshop.backend.rest.ChatMessage();
    choice.message.content = message;
    chatResponse.choices.add(choice);
    return chatResponse;
  }

  public List<Choice> choices = new ArrayList<>();

  public static class Choice {
    public int index;
    public ChatMessage message;
  }
}
