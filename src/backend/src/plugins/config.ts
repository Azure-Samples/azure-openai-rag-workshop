import process from 'node:process';
import path from 'node:path';
import * as dotenv from 'dotenv';
import fp from 'fastify-plugin';

export interface AppConfig {
  azureAiSearchEndpoint: string;
  azureOpenAiApiEndpoint: string;
  azureOpenAiApiDeploymentName: string;
  azureOpenAiApiEmbeddingDeploymentName: string;
  azureOpenAiApiModelName: string;
  azureOpenAiApiEmbeddingsModelName: string;
  qdrantUrl: string;
}

export const unusedService = '__not_used__';

const camelCaseToUpperSnakeCase = (s: string) => s.replaceAll(/[A-Z]/g, (l) => `_${l}`).toUpperCase();

export default fp(
  async (fastify, options) => {
    const environmentPath = path.resolve(process.cwd(), '../../.env');

    console.log(`Loading .env config from ${environmentPath}`);
    dotenv.config({ path: environmentPath });

    const config: AppConfig = {
      azureAiSearchEndpoint: process.env.AZURE_AISEARCH_ENDPOINT || '',
      azureOpenAiApiEndpoint: process.env.AZURE_OPENAI_API_ENDPOINT || '',
      azureOpenAiApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME || 'gpt-4',
      azureOpenAiApiEmbeddingDeploymentName:
        process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME || 'text-embedding-ada-002',
      azureOpenAiApiModelName: process.env.AZURE_OPENAI_API_MODEL || 'gpt-4',
      azureOpenAiApiEmbeddingsModelName: process.env.AZURE_OPENAI_API_EMBEDDINGS_MODEL || 'text-embedding-ada-002',
      qdrantUrl: process.env.QDRANT_URL || '',
    };

    // Set the config value for unused database service to avoid errors
    if (config.qdrantUrl) {
      config.azureAiSearchEndpoint = unusedService;
    } else {
      config.qdrantUrl = unusedService;
    }

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
