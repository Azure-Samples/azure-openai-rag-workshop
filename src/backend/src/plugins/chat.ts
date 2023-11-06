import fp from 'fastify-plugin';
import { ChatService } from '../lib/index.js';

export default fp(
  async (fastify, _options) => {
    const config = fastify.config;

    fastify.decorate('chat', new ChatService(
      fastify.azure.search,
      fastify.openai,
      config.azureOpenAiChatGptModel,
      config.azureOpenAiEmbeddingModel,
      config.kbFieldsSourcePage,
      config.kbFieldsContent,
    ));
  },
  {
    name: 'chat',
    dependencies: ['config', 'azure', 'openai', 'langchain'],
  },
);

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
  export interface FastifyInstance {
    chat: ChatService;
  }
}
