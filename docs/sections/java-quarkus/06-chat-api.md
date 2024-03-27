## Chat API

We'll start the code by creating the Chat API. This API will implement the [ChatBootAI OpenAPI specification](https://editor.swagger.io/?url=https://raw.githubusercontent.com/ChatBootAI/chatbootai-openapi/main/openapi/openapi-chatbootai.yml) and will be used by the website to get message answers.

### Introducing Quarkus

We'll be using [Quarkus](https://quarkus.io) to create our Chat API. Quarkus is a Kubernetes Native Java stack tailored for OpenJDK HotSpot and GraalVM, crafted from the best of breed Java libraries and standards. It's a great choice for microservices, and it's very fast and lightweight.

### Creating the Chat API

Now that we have created the document ingestor, it's time to interact with our vector database and an LLM thanks to a REST API. Create the `ChatResource` under the `src/main/java` directory, inside the `ai.azure.openai.rag.workshop.backend` package. The `chat` method of the `ChatResource` class looks like the following:

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

It's time to start implementing the RAG pattern! The first step is to retrieve the documents from the vector database. In the `ChatService` class, there's a method named `run` that is currently empty with a `// TODO: implement Retrieval Augmented Generation (RAG) here`. This is where we'll implement the RAG pattern.

Before retrieving the documents, we need to convert the question into a vector:

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

To compute the embedding, we first use the embeddings client we created earlier, and call the `embedQuery` method. This method will convert the query into a vector, using the embedding model we specified.

Now that we have the query vector, we can call the Qdrant client to retrieve the documents:

```ts
// Performs a vector search
const searchResults = await this.qdrantClient.search(this.config.indexName, {
  vector: queryVector,
  limit: 3,
  params: {
    hnsw_ef: 128,
    exact: false,
  },
});
```

We pass a few options to the `search` method:
- The name of the index (collection) to search in
- `limit` is the number of documents we want to retrieve
- The parameters for the vector search.
  * The `hnsw_ef` parameter controls the number of neighbors to visit during search. The higher the value, the more accurate and slower the search will be.
  * The `exact` parameter allows to perform an exact search, which will be slower, but more accurate. You can use it to compare results of the search with different `hnsw_ef` values versus the ground truth.

Let's process the search results to extract the documents' content:

```ts
const results: string[] = searchResults.map((result) => {
  const document = result.payload!;
  const sourcePage = document[this.sourcePageField] as string;
  let content = document[this.contentField] as string;
  content = content.replaceAll(/[\n\r]+/g, ' ');
  return `${sourcePage}: ${content}`;
});

const content = results.join('\n');
```

The object `searchResults.results` contains the search results. For each result, we extract the page information and the content of the document, and create a string from it.
For the content, we use a regular expression to replace all the new lines with spaces, so it's easier to feed it to the GPT model later.

Finally we join all the results into a single string, and separate each document with a new line. We'll use this content to generate the augmented prompt.

#### Creating the system prompt

Now that we have the content of the documents, we'll craft the base prompt that will be sent to the GPT model. Add this code at the top of the file below the imports:

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

We make it a constant so it's easier to tweak the prompt later without having to dive into the code.

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

We feed the `ChatService` instance with the different clients we created, and the a few configuration options that we need:
- The name of the GPT model to use (`gpt-35-turbo`)
- The name of the embedding model to use (`text-embedding-ada-002`)
- The name of the field in the search index that contains the page number of the document (`sourcepage`)
- The name of the field in the search index that contains the content of the document (`content`)



Note that in the previous prompt, we did not add the source content. This is because the model does not handle lengthy system messages well, so instead we'll inject the sources into the latest user message.

What the model expect as an input is an array of messages, with the latest message being the user message. Each message have a role, which can be `system` (which sets the context), `user` (the user questions), or `assistant` (which is the AI-generated answers).

To build this array of messages, we'll use a helper class named `MessageBuilder` that we created in the `src/backend/src/lib/message-builder.ts` file. Let's continue our implementation of the RAG pattern with this code:

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
    for (int i = 0; i < relevant.size(); i++) {
      EmbeddingMatch<TextSegment> textSegmentEmbeddingMatch = relevant.get(i);
      chatMessages.add(SystemMessage.from(textSegmentEmbeddingMatch.embedded().text()));
    }

    // ...
  }
}
```

Because the previous messages in the conversation may also help the model, we'll add them to the prompt as well. But here we need to be careful, as GPT models have a limit in the number of tokens they can process. So we'll only add messages until we reach the token limit we set.

```ts
// Add the previous messages to the prompt, as long as we don't exceed the token limit
for (const historyMessage of messages.slice(0, -1).reverse()) {
  if (messageBuilder.tokens > this.tokenLimit) {
    messageBuilder.popMessage();
    break;
  };
  messageBuilder.appendMessage(historyMessage.role, historyMessage.content);
}
```

As a final touch, it can be useful to create some debug information to help us understand what the model is doing.

```ts
// Processing details, for debugging purposes
const conversation = messageBuilder.messages.map((m) => `${m.role}: ${m.content}`).join('\n\n');
const thoughts = `Search query:\n${query}\n\nConversation:\n${conversation}`.replaceAll('\n', '<br>');
```

Here we create a `thoughts` string that we'll return along the answer, that contains the search query and the messages that were sent to the model.

#### Invoking the LLM and generating the response

We're now ready to generate the response from the model. Add this code below the previous one:

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
    chatMessages.add(SystemMessage.from(SYSTEM_MESSAGE_PROMPT));
    chatMessages.add(UserMessage.from(question));

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

First we create the LangChain chat client and pass a few options to control the behavior of the model:
- `temperature` controls the randomness of the model. A value of 0 will make the model deterministic, and a value of 1 will make it generate the most random answers.
- `maxTokens` is the maximum number of tokens the model will generate. If you set it too low, the model will not be able to generate long answers. If you set it too high, the model may generate answers that are too long.
- `n` is the number of answers the model will generate. In our case we only want one answer, so we set it to 1.

Then we call the `invoke` method to generate the response. We pass the messages we created earlier as input.

The final step is to return the result in the Chat specification format:

```ts
// Return the response in the Chat specification format
return {
  choices: [
    {
      index: 0,
      message: {
        content: completion.content as string,
        role: 'assistant',
        context: {
          data_points: results,
          thoughts: thoughts,
        },
      },
    },
  ],
};
```

The result of the completion is in the `completion.content` property. We also add the `data_points` containing the search document results and `thoughts` properties to the `context` object, so they can be used by the website to display the debug information.

Feeeeew, that was a lot of code! But we're done with the implementation of the RAG pattern.


Our API is now ready to be tested!

### Testing our API

Open a terminal and run the following commands to start the API:

```bash
cd src/backend
npm run dev
```

This will start the API in development mode, which means it will automatically restart if you make changes to the code.

To test this API, you can either use the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension for VS Code, or a cURL request.

#### Option 1: Using the REST Client extension

Open the file `src/backend/test.http` file. Go to the "Chat with the bot" comment and hit the **Send Request** button below to test the API.

You can play a bit and change the question to see how the model behaves.

When you're done with the testing, stop the server by pressing `Ctrl+C` in each of the terminals.

After you checked that everything works as expected, don't forget to commit your changes to the repository, to keep track of your progress.

#### Option 2: using cURL

Open up a new terminal in VS Code, and run the following commands:

```bash
curl -X POST "http://localhost:3000/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "content": "How to search and book rentals?",
      "role": "user"
    }]
  }'
```

You can play a bit and change the question to see how the model behaves.

When you're done with the testing, stop the server by pressing `Ctrl+C` in each of the terminals.

After you checked that everything works as expected, don't forget to commit your changes to the repository, to keep track of your progress.
