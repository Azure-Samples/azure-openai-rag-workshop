## Chat API

We'll start the code by creating the Chat API. This API will implement the [ChatBootAI OpenAPI specification](https://editor.swagger.io/?url=https://raw.githubusercontent.com/ChatBootAI/chatbootai-openapi/main/openapi/openapi-chatbootai.yml) and will be used by the website to get message answers.

### Introducing Fastify

We'll be using [Fastify](https://www.fastify.io/) to create our Chat API. Fastify is a Web framework highly focused on providing the best developer experience with the least overhead and a powerful plugin architecture.

It's very similar to [Express](https://expressjs.com), but it's much faster and more lightweight making it a good choice for microservices. It also comes with first-class TypeScript support, and that's what we'll use in our base template.

### Setting up the chat plugin

We'll start by creating a plugin for Fastify that will implement our chat service. A plugin is a way to encapsulate a piece of functionality in Fastify, and it's a good way to organize your code.

Open the file `src/backend/src/plugins/chat.ts`. At the bottom you should see the following code:

```ts
export default fp(
  async (fastify, options) => {
    const config = fastify.config;

    // TODO: initialize clients here

    const chatService = new ChatService(
      /*
      config,
      qdrantClient,
      chatClient,
      embeddingsClient,
      config.azureOpenAiChatGptModel,
      config.azureOpenAiEmbeddingModel,
      config.kbFieldsSourcePage,
      config.kbFieldsContent,
      */
    );

    fastify.decorate('chat', chatService);
  },
  {
    name: 'chat',
    dependencies: ['config'],
  },
);
```

We have the starting point to implement our chat service. Let's have a look at the pieces we have here:

1. First we retrieve the configuration needed by our service with `const config = fastify.config;` It's initialized from environment variables in the `src/backend/src/plugins/config.ts` file.
2. Then we will create the different clients we need to call the Aure services. We'll see how to do that in the next section.
3. After that we create the `ChatService` instance that will be used by our API to generate answers. We'll pass the different clients we created as parameters to the constructor.
4. Finally we decorate the Fastify instance with our `ChatService` instance, so we can access it from our routes using `fastify.chat`.

### Initializing the SDK clients

We'll now replace the `// TODO: initialize clients here` with the actual code to set up our clients.

#### Qdrant client

Next we'll create the Qdrant client. Add this import at the top of the file:

```ts
import { QdrantClient } from '@qdrant/js-client-rest';
```

Then add this code below the `const config = fastify.config;` line:

```ts
// Set up Qdrant client
const qdrantClient = new QdrantClient({
  url: config.qdrantUrl,
  // Port needs to be set explicitly if it's not the default,
  // see https://github.com/qdrant/qdrant-js/issues/59
  port: Number(config.qdrantUrl.split(':')[2])
});
```

We just need to provide the URL of our Qdrant service.

<div class="info" data-title="note">

> You can optionally define an [authentication key](https://qdrant.tech/documentation/guides/security/#authentication) to secure your Qdrant service. If you do that, you'll need to pass it to the `QdrantClient` constructor using the `apiKey` property.

</div>

#### Managing Azure credentials

Before we can create the clients, we need to retrieve the credentials to access our Azure services. We'll use the [Azure Identity SDK](https://learn.microsoft.com/javascript/api/overview/azure/identity-readme?view=azure-node-latest) to do that.

Add this import at the top of the file:

```ts
import { DefaultAzureCredential } from '@azure/identity';
```

Then add this code to retrieve the credentials below the Qdrant client initialization:

```ts
// Automatic Azure identity is not supported in the local dev environment, so we use a dummy key.
let openAIApiKey = '__dummy';
try {
  // Use the current user identity to authenticate with Azure OpenAI.
  // (no secrets needed, just use 'az login' locally, and managed identity when deployed on Azure).
  const credential = new DefaultAzureCredential();
  const openAiToken = await credential.getToken('https://cognitiveservices.azure.com/.default');
  openAIApiKey = openAiToken.token;
} catch {
  fastify.log.warn('Failed to get Azure OpenAI token, using dummy key');
}
```

This will use the current user identity to authenticate with Azure OpenAI. We don't need to provide any secrets, just use `az login` (or `azd auth login`) locally, and [managed identity](https://learn.microsoft.com/entra/identity/managed-identities-azure-resources/overview) when deployed on Azure.

<div class="info" data-title="note">

> When run locally inside a container, the Azure Identity SDK will not be able to retrieve the current user identity from the Azure Developer CLI. For simplicity, we'll use a dummy key in this case but it only works if you use the OpenAI proxy we provide if you attend this workshop in-person.
> If need to properly authenticate locally, you should either run the app outside of a container with `npm run dev`, or create a [Service Principal](https://learn.microsoft.com/entra/identity-platform/howto-create-service-principal-portal), assign it the needed permissions and pass the environment variables to the container.

</div>

#### LangChain clients

Finally, it's time to create the LangChain clients. Add this code below the below the credentials retrieval:

```ts
// Show the OpenAI URL used in the logs
fastify.log.info(`Using OpenAI at ${config.azureOpenAiUrl}`);

// Set common options for the clients
const commonOptions = {
  openAIApiKey,
  azureOpenAIApiVersion: '2024-02-01',
  azureOpenAIApiKey: openAIApiKey,
  azureOpenAIBasePath: `${config.azureOpenAiUrl}/openai/deployments`,
};

// Create a getter for the OpenAI chat client
const chatClient = (options?: Partial<OpenAIChatInput>) =>
  new ChatOpenAI({
    ...options,
    ...commonOptions,
    azureOpenAIApiDeploymentName: config.azureOpenAiChatGptDeployment,
  });

// Create a getter for the OpenAI embeddings client
const embeddingsClient = (options?: Partial<OpenAIEmbeddingsParams>) =>
  new OpenAIEmbeddings({
    ...options,
    ...commonOptions,
    azureOpenAIApiDeploymentName: config.azureOpenAiEmbeddingDeployment,
  });
```

We first have to set up a few common options for the clients. Then instead of directly creating the clients, we create getter functions that will return the clients. We do it this way so we can pass additional options to change the behavior of the clients when needed.

### Creating the ChatService

Now that we have created all the clients, it's time to properly initialize the `ChatService` instance. Uncomment the parameters in the `ChatService` constructor call like this:

```ts
const chatService = new ChatService(
  config,
  qdrantClient,
  chatClient,
  embeddingsClient,
  config.azureOpenAiChatGptModel,
  config.azureOpenAiEmbeddingModel,
  config.kbFieldsSourcePage,
  config.kbFieldsContent,
);
```

We feed the `ChatService` instance with the different clients we created, and the a few configuration options that we need:
- The name of the GPT model to use (`gpt-35-turbo`)
- The name of the embedding model to use (`text-embedding-ada-002`)
- The name of the field in the search index that contains the page number of the document (`sourcepage`)
- The name of the field in the search index that contains the content of the document (`content`)

#### Retrieving the documents

It's time to start implementing the RAG pattern! The first step is to retrieve the documents from the vector database. In the `ChatService` class, there's a method named `run` that is currently empty with a `// TODO: implement Retrieval Augmented Generation (RAG) here`. This is where we'll implement the RAG pattern.

Before retrieving the documents, we need to convert the question into a vector:

```ts
// Get the content of the last message (the question)
const query = messages[messages.length - 1].content;

// Compute an embedding for the query
const embeddingsClient = this.embeddingsClient({ modelName: this.embeddingModel });
const queryVector = await embeddingsClient.embedQuery(query);
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

```ts
const SYSTEM_MESSAGE_PROMPT = `Assistant helps the Consto Real Estate company customers with support questions regarding terms of service, privacy policy, and questions about support requests. Be brief in your answers.
Answer ONLY with the facts listed in the list of sources below. If there isn't enough information below, say you don't know. Do not generate answers that don't use the sources below. If asking a clarifying question to the user would help, ask the question.
For tabular information return it as an html table. Do not return markdown format. If the question is not in English, answer in the language used in the question.
Each source has a name followed by colon and the actual information, always include the source name for each fact you use in the response. Use square brackets to reference the source, for example: [info1.txt]. Don't combine sources, list each source separately, for example: [info1.txt][info2.pdf].
`;
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

Note that in the previous prompt, we did not add the source content. This is because the model does not handle lengthy system messages well, so instead we'll inject the sources into the latest user message.

What the model expect as an input is an array of messages, with the latest message being the user message. Each message have a role, which can be `system` (which sets the context), `user` (the user questions), or `assistant` (which is the AI-generated answers).

To build this array of messages, we'll use a helper class named `MessageBuilder` that we created in the `src/backend/src/lib/message-builder.ts` file. Let's continue our implementation of the RAG pattern with this code:

```ts
// Set the context with the system message
const systemMessage = SYSTEM_MESSAGE_PROMPT;

// Get the latest user message (the question), and inject the sources into it
const userMessage = `${messages[messages.length - 1].content}\n\nSources:\n${content}`;

// Create the messages prompt
const messageBuilder = new MessageBuilder(systemMessage, this.chatGptModel);
messageBuilder.appendMessage('user', userMessage);
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

#### Generating the response

We're now ready to generate the response from the model. Add this code below the previous one:

```ts
const chatClient = this.chatClient({
  temperature: 0.7,
  maxTokens: 1024,
  n: 1,
});
const completion = await chatClient.invoke(messageBuilder.getMessages());
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

### Creating the API route

Now that we have our `ChatService` instance, we need to create the API route that will call it. Open the file `src/backend/src/routes/root.ts`. There's a comment that gives us a hint on what to do next: `// TODO: create /chat endpoint`

So let's create the `/chat` endpoint:

```ts
fastify.post('/chat', async function (request, reply) {
  const { messages } = request.body as any;
  try {
    return await fastify.chat.run(messages);
  } catch (_error: unknown) {
    const error = _error as Error;
    fastify.log.error(error);
    return reply.internalServerError(error.message);
  }
});
```

Using `fastify.post('/chat', ...)` we create a POST endpoint at the `/chat` route.
We retrieve the `messages` property from the request body, and call the `run` method of the `ChatService` instance we created earlier.
We also catch any errors that may happen, log them, and return an internal server error (HTTP status 500) to the client.

<div class="info" data-title="note">

> Here we bypassed the validation of the request body to keep things simple, hence the need to cast it to `any` (boo!). In a real-world application, you should always validate the request body to ensure it matches the expected format. Fastify allows you to do that by providing a [JSON schema to validate the body](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/#validation). By doing that, you'll be able to remove the `as any` cast, and get better error messages when the request body is invalid.

</div>

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
