import fp from 'fastify-plugin';
import { type BaseChatModel } from '@langchain/core/language_models/chat_models';
import { type VectorStore } from '@langchain/core/vectorstores';
import { type AIChatMessage, type AIChatCompletionDelta, type AIChatCompletion } from '@microsoft/ai-chat-protocol';
import { MessageBuilder } from '../lib/message-builder.js';
import { type AppConfig } from './config.js';

export class ChatService {
  tokenLimit: number = 4000;

  constructor(
    private config: AppConfig,
    private model: BaseChatModel,
    private vectorStore: VectorStore,
  ) {}

  async run(messages: AIChatMessage[]): Promise<AIChatCompletion> {

    // TODO: implement Retrieval Augmented Generation (RAG) here

  }
}

export default fp(
  async (fastify, options) => {
    const config = fastify.config;

    // TODO: initialize clients here

    const chatService = new ChatService(/* config, model, vectorStore */);

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

