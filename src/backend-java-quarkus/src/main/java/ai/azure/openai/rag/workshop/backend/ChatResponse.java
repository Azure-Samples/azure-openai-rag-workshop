package ai.azure.openai.rag.workshop.backend;

import java.util.ArrayList;
import java.util.List;

public class ChatResponse {

  public List<Choice> choices = new ArrayList<>();

  public static class Choice {
    public int index;
    public ChatMessage message;
  }
}
