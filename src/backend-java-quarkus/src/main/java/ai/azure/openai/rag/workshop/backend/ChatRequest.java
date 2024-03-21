package ai.azure.openai.rag.workshop.backend;

import java.util.ArrayList;
import java.util.List;

public class ChatRequest {

  public List<ChatRequestMessage> messages = new ArrayList();
  public String model;
  public float temperature = 1f;
  public float topP = 1f;
  public String user;
}
