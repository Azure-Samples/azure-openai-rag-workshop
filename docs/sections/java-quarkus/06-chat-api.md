## Chat API

We'll start the code by creating the Chat API. This API will implement the [ChatBootAI OpenAPI specification](https://editor.swagger.io/?url=https://raw.githubusercontent.com/ChatBootAI/chatbootai-openapi/main/openapi/openapi-chatbootai.yml) and will be used by the website to get message answers.

### Introducing Quarkus

We'll be using [Quarkus](https://quarkus.io) to create our Chat API.

### Creating the model producers

We're going to use [Quarkus' Context And Dependency Injection (CDI) mechanism](https://quarkus.io/guides/cdi) to manage our AI services:

- The `ai.azure.openai.rag.workshop.backend.configuration.ChatLanguageModelAzureOpenAiProducer` will be responsible for configuring the Azure OpenAI chat language model API.
- The `ai.azure.openai.rag.workshop.backend.configuration.EmbeddingModelProducer` will be responsible for configuring the embedding model.
- The `ai.azure.openai.rag.workshop.backend.configuration.EmbeddingStoreProducer` will be responsible for configuring the Qdrant embedding store.

As those producers are configured in separate files, and use the LangChain4J API, they can later be switched easily to use other implementations: this will be useful for example to use a more powerful language or embedding model, or for running tests locally.

Let's start by configuring `ChatLanguageModelAzureOpenAiProducer`, using the Azure OpenAI API.

#### Managing Azure credentials

Before we can create the clients, we need to retrieve the credentials to access our Azure services. We'll use the [Azure Identity SDK](https://learn.microsoft.com/java/api/com.azure.identity?view=azure-java-stable) to do that.

Add this code under the `TODO:` to retrieve the token to build the `AzureOpenAIChatModel`:

```java
    AzureOpenAiChatModel model;

    try {
      // Use the current user identity to authenticate with Azure OpenAI.
      // (no secrets needed, just use `az login` or `azd auth login` locally, and managed identity when deployed on Azure).
      DefaultAzureCredential credentials = new DefaultAzureCredentialBuilder().build();

      // Try requesting a token, so we can fallback to the other builder if it doesn't work
      TokenRequestContext request = new TokenRequestContext();
      request.addScopes("https://cognitiveservices.azure.com/.default");
      credentials.getTokenSync(request);

      model = AzureOpenAiChatModel.builder()
        .tokenCredential(credentials)
        .endpoint(azureOpenAiEndpoint)
        .deploymentName(azureOpenAiDeploymentName)
        .timeout(ofSeconds(60))
        .logRequestsAndResponses(true)
        .build();
    } catch (Exception e) {
      // Default value for local execution
      // ...
    }
```

This will use the current user identity to authenticate with Azure OpenAI and AI Search. We don't need to provide any secrets, just use `az login` (or `azd auth login`) locally, and [managed identity](https://learn.microsoft.com/entra/identity/managed-identities-azure-resources/overview) when deployed on Azure.

<div class="info" data-title="note">

> When run locally inside a container, the Azure Identity SDK will not be able to retrieve the current user identity from the Azure Developer CLI. For simplicity, we'll use a dummy key in this case but it only works if you use the OpenAI proxy we provide if you attend this workshop in-person.
> If need to properly authenticate locally, you should either run the app outside of a container with `mvn compile quarkus:dev`, or create a [Service Principal](https://learn.microsoft.com/entra/identity-platform/howto-create-service-principal-portal), assign it the needed permissions and pass the environment variables to the container.

</div>

#### Fallback using keys

To use the fallback, add the following code in the catch statement and return the `model`.

```java
  } catch (Exception e) {
    // Default value for local execution
    log.info("### Using fallback configuration for OpenAI");
    model = AzureOpenAiChatModel.builder()
      .apiKey("__dummy")
      .endpoint(azureOpenAiEndpoint)
      .deploymentName(azureOpenAiDeploymentName)
      .timeout(ofSeconds(60))
      .logRequestsAndResponses(true)
      .build();
  }

  log.info("### Producing ChatLanguageModel with AzureOpenAiChatModel");

  return model;
```

<div class="info" data-title="Optional notice">

> As seen in the setup chapter, if you have a machine with enough resources, you can run a local Ollama model. You shloud already have installed [Ollama](https://ollama.com) and downloaded a Mistral 7B model on your machine with the `ollama pull mistral` command.
> 
> To use the local Ollama model, you need to create a new chat model producer. At the same location where you've created the `ChatLanguageModelAzureOpenAiProducer`, create a new class called `ChatLanguageModelOllamaProducer` with the following code
>
> ```java
> @Alternative
> public class ChatLanguageModelOllamaProducer {
> 
>   private static final Logger log = LoggerFactory.getLogger(ChatLanguageModelOllamaProducer.class);
> 
>   @ConfigProperty(name = "OLLAMA_BASE_URL", defaultValue = "http://localhost:11434")
>   String ollamaBaseUrl;
> 
>   @ConfigProperty(name = "OLLAMA_MODEL_NAME", defaultValue = "mistral")
>   String ollamaModelName;
> 
>   @Produces
>   public ChatLanguageModel chatLanguageModel() {
> 
>     log.info("### Producing ChatLanguageModel with OllamaChatModel");
> 
>     return OllamaChatModel.builder()
>       .baseUrl(ollamaBaseUrl)
>       .modelName(ollamaModelName)
>       .timeout(ofSeconds(60))
>       .build();
>   }
> }
> ```
> 
> Notice the `@Alternative` annotation. This tells Quarkus that this producer is an alternative to the default one (`ChatLanguageModelAzureOpenAiProducer`). This way, you can switch between the Azure OpenAI and the Ollama model by enabling the `@Alternative` annotation in the properties file (`@Alternative` are not enabled by default).
> So, if you want to use the Azure OpenAI model, you don't have to configure anything. If instedd you want to use the Ollama model, you will have to add the following property to the `src/backend/src/main/resources/application.properties` file:
> 
> ```properties
> quarkus.arc.selected-alternatives=ai.azure.openai.rag.workshop.backend.configuration.ChatLanguageModelOllamaProducer
> ```
> 
> That's it. If Ollama is running on the default port (http://localhost:11434) and you have the `mistral` model installed, you don't even have to configure anything. Just restart the Quarkus backend, and it will use the Ollama model instead of the Azure OpenAI model.

</div>

Now let's configure the `EmbeddingModelProducer`, using a local embedding model (less performant than using Azure OpenAI, but runs locally and for free):

```java
  @Produces
  public EmbeddingModel embeddingModel() {
    return new AllMiniLmL6V2EmbeddingModel();
  }
```

And let's finish with configuring the `EmbeddingStoreProducer`, using the Qdrant vector store:

```java
  @ConfigProperty(name = "AZURE_SEARCH_INDEX", defaultValue = "kbindex")
  String azureSearchIndexName;

  @ConfigProperty(name = "QDRANT_URL", defaultValue = "http://localhost:6334")
  String qdrantUrl;

  @Produces
  public EmbeddingStore<TextSegment> embeddingStore() throws URISyntaxException {
    String qdrantHostname = new URI(qdrantUrl).getHost();
    int qdrantPort = new URI(qdrantUrl).getPort();
    return QdrantEmbeddingStore.builder()
      .collectionName(azureSearchIndexName)
      .host(qdrantHostname)
      .port(qdrantPort)
      .build();
  }
```

### Creating the Chat API

Now that our data has been ingested, and that our services are configured in Quarkus, it's time to interact with our vector database and an LLM using LangChain4J. 

![ChatResource and dependencies](./assets/class-diagram-rest.png)

Create the `ChatResource` under the `src/main/java` directory, inside the `ai.azure.openai.rag.workshop.backend.rest` package. The `chat` method of the `ChatResource` class looks like the following:

```java
package ai.azure.openai.rag.workshop.backend.rest;

import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingStore;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;

@Path("/chat")
public class ChatResource {

  private static final Logger log = LoggerFactory.getLogger(ChatResource.class);

  @Inject
  EmbeddingModel embeddingModel;

  @Inject
  EmbeddingStore<TextSegment> embeddingStore;

  @Inject
  ChatLanguageModel chatLanguageModel;

  @POST
  @Consumes({"application/json"})
  @Produces({"application/json"})
  public ChatResponse chat(ChatRequest chatRequest) {

    // Embed the question (convert the user's question into vectors that represent the meaning)
    // Find relevant embeddings from Qdrant based on the user's question
    // Builds chat history using the relevant embeddings
    // Invoke the LLM
    // Return the response
  }
}
```

![Model](./assets/class-diagram-model.png)

Notice that the `chat` method takes a `ChatRequest` parameter. This is the object that will be sent by the UI to the API, containing the messages of the conversation (`ChatMessage`).

```java
package ai.azure.openai.rag.workshop.backend.rest;

import java.util.ArrayList;
import java.util.List;

public class ChatRequest {

  public List<ChatMessage> messages = new ArrayList<>();
  public double temperature = 1f;
  public double topP = 1f;
  public String user;
}
```

Create the `ChatRequest` class under the `src/main/java` directory, inside the `ai.azure.openai.rag.workshop.backend.rest` package.

#### Embed the question

The first step is to embed the question. First, we get the question from the `ChatRequest`, and then we use the `AllMiniLmL6V2EmbeddingModel` to embed it. Notice that we use the exact same model in the ingestor and the Chat API. This is important to ensure that the embeddings are consistent across the system.

```java
@Path("/chat")
public class ChatResource {

  @POST
  @Consumes({"application/json"})
  @Produces({"application/json"})
  public ChatResponse chat(ChatRequest chatRequest) {

    // Embed the question (convert the user's question into vectors that represent the meaning)
    String question = chatRequest.messages.get(chatRequest.messages.size() - 1).content;

    log.info("### Embed the question (convert the question into vectors that represent the meaning) using embeddedQuestion model");
    Embedding embeddedQuestion = embeddingModel.embed(question).content();
    log.debug("# Vector length: {}", embeddedQuestion.vector().length);

    // ...
  }
}
```

#### Retrieving the documents

It's time to start implementing the RAG pattern! Now that we have a vectorized version of the question asked by the user, time to retrieve the documents from the vector database. In the `ChatResource` class, we use the `QdrantEmbeddingStore` to connect to the Qdrant server and then, retrieve the relevant documents thanks to the `findRelevant` method. This method finds the most relevant (closest in space) embeddings to the provided reference embedding and returns only 3 text segments:

```java
@Path("/chat")
public class ChatResource {

  @POST
  @Consumes({"application/json"})
  @Produces({"application/json"})
  public ChatResponse chat(ChatRequest chatRequest) {

    // Embed the question (convert the user's question into vectors that represent the meaning)
    // ...
    
    // Find relevant embeddings from Qdrant based on the user's question
    log.info("### Find relevant embeddings from Qdrant based on the question");
    List<EmbeddingMatch<TextSegment>> relevant = embeddingStore.findRelevant(embeddedQuestion, 3);

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

  public ChatResponse chat(ChatRequest chatRequest) {

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

  @POST
  @Consumes({"application/json"})
  @Produces({"application/json"})
  public ChatResponse chat(ChatRequest chatRequest) {

    // Embed the question (convert the user's question into vectors that represent the meaning)
    // Find relevant embeddings from Qdrant based on the user's question
    // ...

    // Builds chat history using the relevant embeddings
    log.info("### Builds chat history using the relevant embeddings");
    List<ChatMessage> chatMessages = new ArrayList<>();
    chatMessages.add(SystemMessage.from(SYSTEM_MESSAGE_PROMPT));
    String userMessage = question + "\n\nSources:\n";
    for (EmbeddingMatch<TextSegment> textSegmentEmbeddingMatch : relevant) {
      userMessage += textSegmentEmbeddingMatch.embedded().metadata("filename") + ": " + textSegmentEmbeddingMatch.embedded().text() + "\n";
    }
    chatMessages.add(UserMessage.from(userMessage));

    // ...
  }
}
```

#### Invoking the LLM and generating the response

Now that we have our prompt setup, time to invoke the model. For that, we use the `AzureOpenAiChatModel` passing the API key, the endpoint and the deployment name. We also set the `temperature` to control the randomness of the model. Then, it's just a matter of invoking the `generate` method of the model and so it invokes the model and returns the response:

```java
@Path("/chat")
public class ChatResource {

  @POST
  @Consumes({"application/json"})
  @Produces({"application/json"})
  public ChatResponse chat(ChatRequest chatRequest) {

    // Embed the question (convert the user's question into vectors that represent the meaning)
    // Find relevant embeddings from Qdrant based on the user's question
    // Builds chat history using the relevant embeddings
    // ...

    // Invoke the LLM
    log.info("### Invoke the LLM");
    Response<AiMessage> response = chatLanguageModel.generate(chatMessages);

    return ChatResponse.fromMessage(response.content().text());
  }
}
```

Our API is now ready to be tested!

### Testing our API

Open a terminal and run the following commands to start the API:

```bash
cd src/backend
./mvnw clean quarkus:dev
```

This will start the API in development mode, which means it will automatically restart if you make changes to the code.

To test this API, you can either use the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension for VS Code, or a cURL request. Open up a new terminal in and run the following commands:

```bash
curl -X 'POST' 'http://localhost:3000/chat' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
    "messages": [
      {
        "content": "What is the information that is collected automatically?",
        "role": "user"
      }
    ]
  }'
```

You can play a bit and change the question to see how the model behaves.

When you're done with the testing, stop the Quarkus by pressing `Ctrl+C` in each of the terminals.

After you checked that everything works as expected, don't forget to commit your changes to the repository, to keep track of your progress.