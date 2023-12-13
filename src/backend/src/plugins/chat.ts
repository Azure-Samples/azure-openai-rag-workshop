import fp from 'fastify-plugin';
import { ChatOpenAI, type OpenAIChatInput } from 'langchain/chat_models/openai';
import { OpenAIEmbeddings, type OpenAIEmbeddingsParams } from 'langchain/embeddings/openai';
import { type Message, MessageBuilder, type ChatResponse, type ChatResponseChunk } from '../lib/index.js';

export class ChatService {
  tokenLimit: number = 4000;

  constructor(
    private searchClient: SearchClient<any>,
    private chatClient: (options?: Partial<OpenAIChatInput>) => ChatOpenAI,
    private embeddingsClient: (options?: Partial<OpenAIEmbeddingsParams>) => OpenAIEmbeddings,
    private chatGptModel: string,
    private embeddingModel: string,
    private sourcePageField: string,
    private contentField: string,
  ) {}

  async run(messages: Message[]): Promise<ChatResponse> {

    // TODO: implement Retrieval Augmented Generation (RAG) here

  }
}

export default fp(
  async (fastify, options) => {
    const config = fastify.config;

    // TODO: initialize clients here

    const chatService = new ChatService(
      /*
      searchClient,
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

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
  export interface FastifyInstance {
    chat: ChatService;
  }
}

