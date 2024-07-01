import fp from 'fastify-plugin';
import { QdrantClient } from '@qdrant/qdrant-js';
import { DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity';
import { AzureChatOpenAI, AzureOpenAIEmbeddings } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/qdrant';
import { type BaseChatModel } from '@langchain/core/language_models/chat_models';
import { type VectorStore } from '@langchain/core/vectorstores';
import { AIChatMessage, AIChatCompletionDelta, AIChatCompletion } from '@microsoft/ai-chat-protocol';
import { MessageBuilder } from '../lib/message-builder.js';
import { type AppConfig } from './config.js';

const SYSTEM_MESSAGE_PROMPT = `Assistant helps the Consto Real Estate company customers with support questions regarding terms of service, privacy policy, and questions about support requests. Be brief in your answers.
Answer ONLY with the facts listed in the list of sources below. If there isn't enough information below, say you don't know. Do not generate answers that don't use the sources below. If asking a clarifying question to the user would help, ask the question.
Do not return markdown format. If the question is not in English, answer in the language used in the question.
Each source has a name followed by colon and the actual information, always include the source name for each fact you use in the response. Use square brackets to reference the source, for example: [info1.txt]. Don't combine sources, list each source separately, for example: [info1.txt][info2.pdf].
`;

const FOLLOW_UP_QUESTIONS_PROMPT = `Generate 3 very brief follow-up questions that the user would likely ask next.
Enclose the follow-up questions in double angle brackets. Example:
<<Am I allowed to invite friends for a party?>>
<<How can I ask for a refund?>>
<<What If I break something?>>

Do no repeat questions that have already been asked.
Make sure the last question ends with ">>".`;

export class ChatService {
  tokenLimit: number = 4000;

  constructor(
    private config: AppConfig,
    private model: BaseChatModel,
    private vectorStore: VectorStore,
  ) {}

  async run(messages: AIChatMessage[]): Promise<AIChatCompletion> {
    // STEP 1: Retrieve relevant documents from the search index
    // ---------------------------------------------------------

    // Get the content of the last message (the question)
    const query = messages[messages.length - 1].content;

    // Performs a vector similarity search.
    // Embedding for the query is automatically computed
    const documents = await this.vectorStore.similaritySearch(query, 3);

    const results: string[] = [];
    for await (const document of documents) {
      const source = document.metadata.source;
      const content = document.pageContent.replaceAll(/[\n\r]+/g, ' ');
      results.push(`${source}: ${content}`);
    }

    const content = results.join('\n');

    // STEP 2: Generate a contextual and content specific answer using the search results and chat history
    // ---------------------------------------------------------------------------------------------------

    const systemMessage = SYSTEM_MESSAGE_PROMPT + FOLLOW_UP_QUESTIONS_PROMPT;
    // Model does not handle lengthy system messages well,
    // so we inject the sources into the latest user message.
    const userMessage = `${messages[messages.length - 1].content}\n\nSources:\n${content}`;

    // Create the messages prompt
    const messageBuilder = new MessageBuilder(systemMessage, this.config.azureOpenAiApiModelName);
    messageBuilder.appendMessage('user', userMessage);

    // Add the previous messages to the prompt, as long as we don't exceed the token limit
    for (const historyMessage of messages.slice(0, -1).reverse()) {
      if (messageBuilder.tokens > this.tokenLimit) break;
      messageBuilder.appendMessage(historyMessage.role, historyMessage.content);
    }

    // Processing details, for debugging purposes
    const conversation = messageBuilder.messages.map((m) => `${m.role}: ${m.content}`).join('\n\n');
    const thoughts = `Search query:\n${query}\n\nConversation:\n${conversation}`.replaceAll('\n', '<br>');

    // STEP 3: Generate the completion (answer) using the prompt
    // ---------------------------------------------------------

    const completion = await this.model.invoke(messageBuilder.getMessages());

    return {
      message: {
        content: completion.content as string,
        role: 'assistant',
      },
      context: {
        data_points: results,
        thoughts: thoughts,
      },
    };
  }

  async *runWithStreaming(messages: AIChatMessage[]): AsyncGenerator<AIChatCompletionDelta, void> {
    // STEP 1: Retrieve relevant documents from the search index
    // ---------------------------------------------------------

    const query = messages[messages.length - 1].content;

    // Performs a hybrid search (vectors + text),
    // Embedding for the query is automatically computed
    const documents = await this.vectorStore.similaritySearch(query, 3);

    const results: string[] = [];
    for await (const document of documents) {
      const source = document.metadata.source;
      const content = document.pageContent.replaceAll(/[\n\r]+/g, ' ');
      results.push(`${source}: ${content}`);
    }

    const content = results.join('\n');

    // STEP 2: Generate a contextual and content specific answer using the search results and chat history
    // ---------------------------------------------------------------------------------------------------

    const systemMessage = SYSTEM_MESSAGE_PROMPT + FOLLOW_UP_QUESTIONS_PROMPT;
    // Model does not handle lengthy system messages well,
    // so we inject the sources into the latest user message.
    const userMessage = `${messages[messages.length - 1].content}\n\nSources:\n${content}`;

    // Create the messages prompt
    const messageBuilder = new MessageBuilder(systemMessage, this.config.azureOpenAiApiModelName);
    messageBuilder.appendMessage('user', userMessage);

    // Add the previous messages to the prompt, as long as we don't exceed the token limit
    for (const historyMessage of messages.slice(0, -1).reverse()) {
      if (messageBuilder.tokens > this.tokenLimit) break;
      messageBuilder.appendMessage(historyMessage.role, historyMessage.content);
    }

    // Processing details, for debugging purposes
    const conversation = messageBuilder.messages.map((m) => `${m.role}: ${m.content}`).join('\n\n');
    const thoughts = `Search query:\n${query}\n\nConversation:\n${conversation}`.replaceAll('\n', '<br>');

    // STEP 3: Generate the completion (answer) using the prompt
    // ---------------------------------------------------------

    const completion = await this.model.stream(messageBuilder.getMessages());
    let id = 0;

    // Process the completion in chunks
    for await (const chunk of completion) {
      const responseChunk = {
        delta: {
          content: (chunk.content as string) ?? '',
          role: 'assistant' as const,
        },
        context: id === 0 ? {
          data_points: results,
          thoughts,
        } : {},
      };
      yield responseChunk;
      id++;
    }
  }
}

export default fp(
  async (fastify, options) => {
    const config = fastify.config;

    // Use the current user identity to authenticate.
    // No secrets needed, it uses `az login` or `azd auth login` locally,
    // and managed identity when deployed on Azure.
    const credentials = new DefaultAzureCredential();

    // Set up OpenAI token provider
    const getToken = getBearerTokenProvider(credentials, 'https://cognitiveservices.azure.com/.default');
    const azureADTokenProvider = async () => {
      try {
        return await getToken();
      } catch {
        // Azure identity is not supported in local container environment,
        // so we use a dummy key (only works when using an OpenAI proxy).
        fastify.log.warn('Failed to get Azure OpenAI token, using dummy key');
        return '__dummy';
      }
    };

    // Set up LangChain.js clients
    fastify.log.info(`Using OpenAI at ${config.azureOpenAiApiEndpoint}`);

    const model = new AzureChatOpenAI({
      azureADTokenProvider,
      // Controls randomness. 0 = deterministic, 1 = maximum randomness
      temperature: 0.7,
      // Maximum number of tokens to generate
      maxTokens: 1024,
      // Number of completions to generate
      n: 1,
    });
    const embeddings = new AzureOpenAIEmbeddings({ azureADTokenProvider });
    const vectorStore = new QdrantVectorStore(embeddings, {
      client: new QdrantClient({
        url: config.qdrantUrl,
        // https://github.com/qdrant/qdrant-js/issues/59
        port: Number(config.qdrantUrl.split(':')[2]),
      }),
    });

    const chatService = new ChatService(config, model, vectorStore);

    fastify.decorate('chat', chatService);
  },
  {
    name: 'chat',
    dependencies: ['config'],
  },
);

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
  export interface FastifyInstance {
    chat: ChatService;
  }
}
