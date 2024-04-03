import fp from 'fastify-plugin';
import { Ingestor } from '../lib/ingestor.js';

export default fp(
  async (fastify, _options) => {
    const config = fastify.config;

    fastify.decorate(
      'ingestor',
      new Ingestor(fastify.log, fastify.config, fastify.azure, fastify.openai, config.azureOpenAiEmbeddingModel),
    );
  },
  {
    name: 'ingestor',
    dependencies: ['config', 'azure', 'openai'],
  },
);

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
  export interface FastifyInstance {
    ingestor: Ingestor;
  }
}
