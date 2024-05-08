import fp from 'fastify-plugin';
import { ChatOpenAI, OpenAIEmbeddings, type OpenAIChatInput, type OpenAIEmbeddingsParams } from '@langchain/openai';
import { type Message, MessageBuilder, type ChatResponse, type ChatResponseChunk } from '../lib/index.js';
import { type AppConfig } from './config.js';

export class ChatService {
  tokenLimit: number = 4000;

  constructor(
    private config: AppConfig,
    private qdrantClient: QdrantClient,
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

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
  export interface FastifyInstance {
    chat: ChatService;
  }
}

