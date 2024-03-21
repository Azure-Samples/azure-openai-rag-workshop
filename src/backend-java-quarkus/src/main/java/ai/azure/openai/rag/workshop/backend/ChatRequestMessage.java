package ai.azure.openai.rag.workshop.backend;

public class ChatRequestMessage {

  public String content;
  public RoleEnum role;

  public static enum RoleEnum {

    SYSTEM(String.valueOf("system")),
    USER(String.valueOf("user")),
    ASSISTANT(String.valueOf("assistant")),
    FUNCTION(String.valueOf("function"));

    private String value;

    private RoleEnum(String v) {
      this.value = v;
    }

    public String value() {
      return this.value;
    }

  }
}
