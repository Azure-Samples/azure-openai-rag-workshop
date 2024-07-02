import process from 'node:process';
import path from 'node:path';
import * as dotenv from 'dotenv';
import fp from 'fastify-plugin';

export interface AppConfig {
  azureAiSearchEndpoint: string;
  azureOpenAiApiEndpoint: string;
  azureOpenAiApiDeploymentName: string;
  azureOpenAiApiEmbeddingDeploymentName: string;
  qdrantUrl: string;
}

export const unusedService = '__not_used__';

const camelCaseToUpperSnakeCase = (s: string) => s.replaceAll(/[A-Z]/g, (l) => `_${l}`).toUpperCase();

export default fp(
  async (fastify, options) => {
    const environmentPath = path.resolve(process.cwd(), '../../.env');

    console.log(`Loading .env config from ${environmentPath}`);
    dotenv.config({ path: environmentPath });

    process.env.AZURE_OPENAI_API_INSTANCE_NAME ??= '__proxy';
    process.env.AZURE_OPENAI_API_VERSION ??= '2024-02-01';
    process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME ??= 'gpt-4';
    process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME ??= 'text-embedding-ada-002';

    const config: AppConfig = {
      azureAiSearchEndpoint: process.env.AZURE_AISEARCH_ENDPOINT || '',
      azureOpenAiApiEndpoint: process.env.AZURE_OPENAI_API_ENDPOINT || '',
      azureOpenAiApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
      azureOpenAiApiEmbeddingDeploymentName:
        process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME,
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
