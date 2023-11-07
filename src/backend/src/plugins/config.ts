import process from 'node:process';
import path from 'node:path';
import * as dotenv from 'dotenv';
import fp from 'fastify-plugin';

export interface AppConfig {
  azureSearchService: string;
  azureSearchIndex: string;
  azureOpenAiUrl: string;
  azureOpenAiChatGptDeployment: string;
  azureOpenAiChatGptModel: string;
  azureOpenAiEmbeddingDeployment: string;
  azureOpenAiEmbeddingModel: string;
  kbFieldsContent: string;
  kbFieldsSourcePage: string;
}

const camelCaseToUpperSnakeCase = (s: string) => s.replaceAll(/[A-Z]/g, (l) => `_${l}`).toUpperCase();

export default fp(
  async (fastify, options) => {
    const environmentPath = path.resolve(process.cwd(), '../../.env');

    console.log(`Loading .env config from ${environmentPath}...`);
    dotenv.config({ path: environmentPath });

    const config: AppConfig = {
      azureSearchService: process.env.AZURE_SEARCH_SERVICE || '',
      azureSearchIndex: process.env.AZURE_SEARCH_INDEX || 'kbindex',
      azureOpenAiUrl: process.env.AZURE_OPENAI_URL || '',
      azureOpenAiChatGptDeployment: process.env.AZURE_OPENAI_CHATGPT_DEPLOYMENT || 'chat',
      azureOpenAiChatGptModel: process.env.AZURE_OPENAI_CHATGPT_MODEL || 'gpt-35-turbo',
      azureOpenAiEmbeddingDeployment: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'embedding',
      azureOpenAiEmbeddingModel: process.env.AZURE_OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
      kbFieldsContent: process.env.KB_FIELDS_CONTENT || 'content',
      kbFieldsSourcePage: process.env.KB_FIELDS_SOURCEPAGE || 'sourcepage',
    };

    // Check that all config values are set
    for (const [key, value] of Object.entries(config)) {
      if (!value) {
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
