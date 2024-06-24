import process from 'node:process';
import path from 'node:path';
import * as dotenv from 'dotenv';
import fp from 'fastify-plugin';

export interface AppConfig {
  azureOpenAiService: string;
  azureOpenAiChatGptDeployment: string;
  azureOpenAiChatGptModel: string;
  azureOpenAiEmbeddingDeployment: string;
  azureOpenAiEmbeddingModel: string;
}

const camelCaseToUpperSnakeCase = (s: string) => s.replaceAll(/[A-Z]/g, (l) => `_${l}`).toUpperCase();

export default fp(
  async (fastify, options) => {
    const environmentPath = path.resolve(process.cwd(), '.env');

    console.log(`Loading .env config from ${environmentPath}`);
    dotenv.config({ path: environmentPath });

    const config: AppConfig = {
      azureOpenAiService: process.env.AZURE_OPENAI_SERVICE || '',
      azureOpenAiChatGptDeployment: process.env.AZURE_OPENAI_CHATGPT_DEPLOYMENT || 'chat',
      azureOpenAiChatGptModel: process.env.AZURE_OPENAI_CHATGPT_MODEL || 'gpt-35-turbo',
      azureOpenAiEmbeddingDeployment: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'embedding',
      azureOpenAiEmbeddingModel: process.env.AZURE_OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
    };

    // Check that all config values are set
    for (const [key, value] of Object.entries(config)) {
      if (!value && key !== 'azureOpenAiApiKey') {
        const variableName = camelCaseToUpperSnakeCase(key).replace('OPEN_AI', 'OPENAI');
        const message = `${variableName} environment variable must be set`;
        fastify.log.error(message);
        throw new Error(message);
      }
    }

    fastify.decorate('config', config);
  },
  {
    name: 'config',
  },
);

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
  export interface FastifyInstance {
    config: AppConfig;
  }
}
