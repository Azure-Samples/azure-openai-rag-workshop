<div class="info" data-title="skip notice">

> This step is entirely optional, you can skip it if you want to jump directly to the next section.

</div>

## Optional improvements

We now have a working application, but there are still a few things we can improve to make it better, like adding a follow-up questions feature.

### Add follow-up questions

After your chatbot has answered the user's question, it can be useful to provide some follow-up questions to the user, to help them find the information they need.

In order to do that, we'll improve our original prompt. Open the file `src/backend/src/plugins/chat.ts` and add this below the system prompt:

```ts
const FOLLOW_UP_QUESTIONS_PROMPT = `Generate 3 very brief follow-up questions that the user would likely ask next.
Enclose the follow-up questions in double angle brackets. Example:
<<Am I allowed to invite friends for a party?>>
<<How can I ask for a refund?>>
<<What If I break something?>>

Do no repeat questions that have already been asked.
Make sure the last question ends with ">>".`;
```

Let's analyze this prompt to understand what's going on:

1. We ask the model to generate 3 follow-up questions: `Generate 3 very brief follow-up questions that the user would likely ask next.`
2. We specify the format of the follow-up questions: `Enclose the follow-up questions in double angle brackets.`
3. We use the few-shot approach to give examples of follow-up questions:
    ```
    <<Am I allowed to invite friends for a party?>>
    <<How can I ask for a refund?>>
    <<What If I break something?>>
    ```
4. Based on testing, we improve the prompt with more rules: `Do no repeat questions that have already been asked.` and `Make sure the last question ends with ">>".`

Now that we have our prompt, we need to add it to the system prompt.
Replace this line in the chat service:

```ts
const systemMessage = SYSTEM_MESSAGE_PROMPT;
```

with:

```ts
const systemMessage = SYSTEM_MESSAGE_PROMPT + FOLLOW_UP_QUESTIONS_PROMPT;
```

That's it!
You can now test your changes by running `npm start` at the root of the repository to start the application. This command will start both the backend and frontend in development mode, so you can test your changes.

In the chat webapp you should now see the follow-up questions after the answer:

![Screenshot of the follow-up questions](./assets/follow-up-questions.png)

You can now redeploy your improved backend by running `azd deploy backend` and test it in production.

### Add streaming support

The current version of the chat API is using the `chat` endpoint to send the messages and get the response once the model has finished generating it. This creates longer wait times for the user, which is not ideal.

OpenAI API have an option to stream the response message, allowing to see the response as soon as it's generated. 
While it doesn't make the model generate the response faster, it allows you to display the response to the user faster so they can start reading it directly while it's being generated.

#### Implement streaming in the backend

To enable streaming, we first have to implement it in the backend. Open the file `src/backend/src/plugins/chat.ts`.

First, make a copy of your method `run()` and give it the name `runWithStreaming()`. Update the method signature with this one:

```ts
async *runWithStreaming(messages: Message[]): AsyncGenerator<ChatResponseChunk, void> {
```

You can notice a few changes here:
- The star `*` after `async` indicates that this method is an [async generator function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/async_function*#description). Generators are functions that can be exited and later re-entered, yielding multiple values. In our case, we'll use it to yield the response chunks as they are generated.
- We update the return type of the method to `AsyncGenerator<ChatResponseChunk, void>`. Since the method is now an async generator, it will yield partial results as they are generated. The `ChatResponseChunk` type is a new type similar to the `ChatResponse` type, but with a `delta` property in place of `message`, containing the new content delta since the last chunk.

Now that we update the signature, we need to update the method body to make it work. We need to change the last part of the method, where we call the chat client to get the completion result. Replace this code:

```ts
const completion = await chatClient.invoke(messageBuilder.getMessages());

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

with this:

```ts
const completion = await chatClient.stream(messageBuilder.getMessages());
let id = 0;

// Process the completion in chunks
for await (const chunk of completion) {
  const responseChunk = {
    choices: [
      {
        index: 0,
        delta: {
          content: (chunk.content as string) ?? '',
          role: 'assistant' as const,
          context: {
            data_points: id === 0 ? results : undefined,
            thoughts: id === 0 ? thoughts : undefined,
          },
        },
        finish_reason: '',
      },
    ],
  };
  yield responseChunk;
  id++;
}
```

Let's analyze the changes to understand what's going on:
- We call the `stream()` method instead of `invoke()`. This will return an [async iterable](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols) that we can iterate over to get the response chunks.
- We use [for-await-of](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/for-await...of) to iterate over the response chunks. This is a new syntax introduced in ES2018 that allows us to iterate over async iterables.
- We fill the `context` only for the first chunk, since we don't want to send the same data points and thoughts for each chunk.
- We use `yield` to return the response chunk to the caller. This is the syntax used to return values from a generator.

Now that we have our new method, we need to update the `/chat` endpoint to use it. Open the file `src/backend/src/routes/root.ts` and replace this code:

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

with this:

```ts
fastify.post('/chat', async function (request, reply) {
  const { messages, stream } = request.body as any;
  try {
    if (stream) {
      const chunks = await fastify.chat.runWithStreaming(messages);
      await replyNdJsonStream(reply, chunks);
    } else {
      return await fastify.chat.run(messages);
    }
  } catch (_error: unknown) {
    const error = _error as Error;
    fastify.log.error(error);
    return reply.internalServerError(error.message);
  }
});
```

We retrieve now a `stream` property from the request body, and if it's set to `true`, we call the `runWithStreaming()` method instead of `run()`. One key difference here is that we don't return the response directly, but we use a new helper function `replyNdJsonStream()` to send the response chunks to the client.

Let's add this new function to our file:

```ts
// Reply to a request with a stream of NDJSON chunks
async function replyNdJsonStream(reply: FastifyReply, chunks: AsyncGenerator<object>) {
  // Create a new stream buffer
  const buffer = new Readable();
  // We must implement the _read method, but we don't need to do anything
  buffer._read = () => {};

  // Start streaming the buffer to the client
  reply.type('application/x-ndjson').send(buffer);

  for await (const chunk of chunks) {
    // Send JSON chunks, separated by newlines
    buffer.push(JSON.stringify(chunk) + '\n');
  }

  // Signal end of stream
  buffer.push(null);
}
```

This function is a bit technical, but its overall goal it to transform the async iterable returned by `runWithStreaming()` into a stream that we can send to the client.

We use the [Newline Delimited JSON (ndjson) format](https://github.com/ndjson/ndjson-spec) to send the chunks to the client. This format is a sequence of JSON objects separated by newlines. 

At this point, you can run the backend again with `docker compose up --build` and test your changes using either the `REST Client` extension, or with this cURL command:

```bash
curl -X POST "http://localhost:3000/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "content": "How to search and book rentals?",
      "role": "user"
    }],
    "stream": true
  }'
```

#### Implement streaming in the frontend

Now that we have streaming support in the backend, we need to update the frontend to use it. Open the file `src/frontend/src/components/chat.ts` and set the `stream` property to `true` in the default options of the component:

```ts
export const defaultOptions: ChatComponentOptions = {
  enableContentLinks: false,
  stream: true,
  ...
```

This was the final step! Mae sure you still have the backend running, and run the command `npm run dev` from the `src/frontend` folder to start the frontend. You should now see the chat response being streamed as it's generated:

![Screenshot of the chat response streaming](./assets/chat-streaming.gif)

You can now redeploy your improved app by running `azd deploy` and test it in production.


<!-- TODO: explore langchain integrations: document retrievers & tools -->
