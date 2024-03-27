package ai.azure.openai.rag.workshop.backend.rest;

import java.util.ArrayList;
import java.util.List;

public class ChatRequest {

  public List<ChatMessage> messages = new ArrayList<>();
  public double temperature = 1f;
  public double topP = 1f;
  public String user;
}
