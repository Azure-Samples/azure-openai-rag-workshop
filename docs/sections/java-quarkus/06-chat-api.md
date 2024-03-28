## Chat API

We'll start the code by creating the Chat API. This API will implement the [ChatBootAI OpenAPI specification](https://editor.swagger.io/?url=https://raw.githubusercontent.com/ChatBootAI/chatbootai-openapi/main/openapi/openapi-chatbootai.yml) and will be used by the website to get message answers.

### Introducing Quarkus

We'll be using [Quarkus](https://quarkus.io) to create our Chat API. Quarkus is a Kubernetes Native Java stack tailored for OpenJDK HotSpot and GraalVM, crafted from the best of breed Java libraries and standards. It's a great choice for microservices, and it's very fast and lightweight.

### Creating the Chat API

Now that we have created the document ingestor, it's time to interact with our vector database and an LLM thanks to a REST API. 

![ChatResource and dependencies](./assets/class-diagram-rest.png)

Create the `ChatResource` under the `src/main/java` directory, inside the `ai.azure.openai.rag.workshop.backend` package. The `chat` method of the `ChatResource` class looks like the following:

```java
@Path("/chat")
public class ChatResource {

  private static final Logger log = LoggerFactory.getLogger(ChatResource.class);

  @POST
  @Consumes({"application/json"})
  @Produces({"application/json"})
  public String chat(ChatRequest chatRequest) {

    // Embed the question (convert the user's question into vectors that represent the meaning)
    // Find relevant embeddings from Qdrant based on the user's question
    // Builds chat history using the relevant embeddings
    // Invoke the LLM
    // Return the response
  }
}
```

![Model](./assets/class-diagram-model.png)

Notice that the `chat` method takes a `ChatRequest` parameter. This is the object that will be sent by the UI to the API, containing the messagess of the conversation (`ChatRequestMessage`).

```java
public class ChatRequest {

  public List<ChatRequestMessage> messages = new ArrayList();
  public String model;
  public float temperature = 1f;
  public float topP = 1f;
  public String user;
}
```

```java
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
```

Create the `ChatRequest` and `ChatRequestMessage` under the `src/main/java` directory, inside the `ai.azure.openai.rag.workshop.backend` package.

#### Embed the question

The first step is to embed the question. First, we get the question from the `ChatRequest`, and then we use the `AllMiniLmL6V2EmbeddingModel` to embed it. Notice that we use the exact same model in the ingestor and the Chat API. This is important to ensure that the embeddings are consistent across the system.

```java
@Path("/chat")
public class ChatResource {

  public String chat(ChatRequest chatRequest) {

    String question = chatRequest.messages.get(0).content;

    log.info("### Embed the question (convert the question into vectors that represent the meaning) using embeddedQuestion model");
    EmbeddingModel embeddingModel = new AllMiniLmL6V2EmbeddingModel();
    Embedding embeddedQuestion = embeddingModel.embed(question).content();

    // ...
  }
}
```

#### Retrieving the documents

It's time to start implementing the RAG pattern! Now that we have a vectorized version of the question asked by the user, time to retrieve the documents from the vector database. In the `ChatResource` class, we use the `QdrantEmbeddingStore` to connect to the Qdrant server and then, retrieve the relevant documents thanks to the `findRelevant` method. This method finds the most relevant (closest in space) embeddings to the provided reference embedding and returns only 3 text segments:

```java
@Path("/chat")
public class ChatResource {

  public String chat(ChatRequest chatRequest) {

    // Embed the question (convert the user's question into vectors that represent the meaning)
    // ...
    
    // Find relevant embeddings from Qdrant based on the user's question
    log.info("### Find relevant embeddings from Qdrant based on the question");
    EmbeddingStore<TextSegment> qdrantEmbeddingStore = QdrantEmbeddingStore.builder()
      .collectionName("rag-workshop-collection")
      .host("localhost")
      .port(6334)
      .build();

    List<EmbeddingMatch<TextSegment>> relevant = qdrantEmbeddingStore.findRelevant(embeddedQuestion, 3);

    // ...
  }
}
```

#### Creating the system prompt

Now that we have the content of the documents, we'll craft the base prompt that will be sent to the GPT model. Add the `SYSTEM_MESSAGE_PROMPT` variable at the top of the class, below the logger:

```java
@Path("/chat")
public class ChatResource {

  private static final Logger log = LoggerFactory.getLogger(ChatResource.class);

  private static final String SYSTEM_MESSAGE_PROMPT = """
    Assistant helps the Consto Real Estate company customers with support questions regarding terms of service, privacy policy, and questions about support requests.
    Be brief in your answers.
    Answer ONLY with the facts listed in the list of sources below.
    If there isn't enough information below, say you don't know.
    Do not generate answers that don't use the sources below.
    If asking a clarifying question to the user would help, ask the question.
    For tabular information return it as an html table.
    Do not return markdown format.
    If the question is not in English, answer in the language used in the question.
    Each source has a name followed by colon and the actual information, always include the source name for each fact you use in the response.
    Use square brackets to reference the source, for example: [info1.txt].
    Don't combine sources, list each source separately, for example: [info1.txt][info2.pdf].
    """;

  public String chat(ChatRequest chatRequest) {

    // ...
  }
}
```

Let's decompose the prompt to better understand what's going on. When creating a prompt, there are a few things to keep in mind to get the best results:

- Be explicit about the domain of the prompt. In our case, we're setting the context with this phrase: `Assistant helps the Consto Real Estate company customers with support questions regarding terms of service, privacy policy, and questions about support requests.`. This relates to the set of documents provided by default, so feel free to change it if you're using your own documents.

- Tell the model how long the answer should be. In our case, we want to keep the answers short, so we add this phrase: `Be brief in your answers.`.

- In the context of RAG, tell it to only use the content of the documents we provide: `Answer ONLY with the facts listed in the list of sources below.`. This is called *grounding* the model.

- To avoid having the model inventing facts, we tell to answer that it doesn't know if the information is not in the documents: `If there isn't enough information below, say you don't know. Do not generate answers that don't use the sources below.`. This is called adding an *escape hatch*.

- Allow the model to ask for clarifications if needed: `If asking a clarifying question to the user would help, ask the question.`.

- Tell the model the format and language you expect in the answer: `Do not return markdown format. If the question is not in English, answer in the language used in the question.`

- Finally, tell the model how it should understand the source format and quote it in the answer: `Each source has a name followed by colon and the actual information, always include the source name for each fact you use in the response. Use square brackets to reference the source, for example: [info1.txt]. Don't combine sources, list each source separately, for example: [info1.txt][info2.pdf].`

- Use examples when possible, like we do to explain the source format.

#### Creating the augmented prompt

Now that we have the `SYSTEM_MESSAGE_PROMPT` and the relevant documents, we can create the augmented prompt. The augmented prompt is the combination of the system prompt, the relevant documents as well as the question asked by the user. We use the `ChatMessage` class from LangChain4j to represent the messages in the conversation. This class contains the content of the message and the role of the message: `system` (which sets the context), `user` (the user questions), or `assistant` (which is the AI-generated answers).

```java
@Path("/chat")
public class ChatResource {

  public String chat(ChatRequest chatRequest) {

    // Embed the question (convert the user's question into vectors that represent the meaning)
    // Find relevant embeddings from Qdrant based on the user's question
    // ...

    // Builds chat history using the relevant embeddings
    log.info("### Builds chat history using the relevant embeddings");
    List<ChatMessage> chatMessages = new ArrayList<>();
    chatMessages.add(SystemMessage.from(SYSTEM_MESSAGE_PROMPT));
    for (int i = 0; i < relevant.size(); i++) {
      EmbeddingMatch<TextSegment> textSegmentEmbeddingMatch = relevant.get(i);
      chatMessages.add(SystemMessage.from(textSegmentEmbeddingMatch.embedded().text()));
    }
    chatMessages.add(UserMessage.from(question));

    // ...
  }
}
```

#### Invoking the LLM and generating the response

Now that we have our prompt setup, time to invoke the model. For that, we use the `AzureOpenAiChatModel` passing the API key, the endpoint and the deployment name. We also set the `temperature` to control the randomness of the model. Then, it's just a matter of invoking the `generate` method of the model and so it invokes the model and returns the response:

```java
@Path("/chat")
public class ChatResource {

  public String chat(ChatRequest chatRequest) {

    // Embed the question (convert the user's question into vectors that represent the meaning)
    // Find relevant embeddings from Qdrant based on the user's question
    // Builds chat history using the relevant embeddings
    // ...

    // Invoke the LLM
    log.info("### Invoke the LLM");
    ChatLanguageModel model = AzureOpenAiChatModel.builder()
      .apiKey(System.getenv("AZURE_OPENAI_KEY"))
      .endpoint(System.getenv("AZURE_OPENAI_ENDPOINT"))
      .deploymentName(System.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"))
      .temperature(0.3)
      .timeout(ofSeconds(60))
      .logRequestsAndResponses(true)
      .build();

    // Return the response
    Response<AiMessage> response = model.generate(chatMessages);

    return response.content().text();
  }
}
```

Our API is now ready to be tested!

### Testing our API

Open a terminal and run the following commands to start the API:

```bash
cd src/backend-java-quarkus
./mvnw clean quarkus:dev
```

This will start the API in development mode, which means it will automatically restart if you make changes to the code.

To test this API, you can either use the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension for VS Code, or a cURL request. Open up a new terminal in and run the following commands:

```bash
curl -X 'POST' \
'http://localhost:8080/chat' \
-H 'accept: */*' \
-H 'Content-Type: application/json' \
-d '{
  "messages": [
    {
      "content": "What is the information that is collected automatically?",
      "role": "USER"
    }
  ]
}'
```

You can play a bit and change the question to see how the model behaves.

When you're done with the testing, stop the Quarkus by pressing `Ctrl+C` in each of the terminals.

After you checked that everything works as expected, don't forget to commit your changes to the repository, to keep track of your progress.
