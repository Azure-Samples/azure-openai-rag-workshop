import fp from 'fastify-plugin';
import { DefaultAzureCredential } from '@azure/identity';
import { SearchIndexClient } from '@azure/search-documents';

export type AzureClients = {
  credential: DefaultAzureCredential;
  searchIndex: SearchIndexClient;
};

export default fp(
  async (fastify, _options) => {
    const config = fastify.config;

    // Use the current user identity to authenticate with Azure OpenAI, Cognitive Search and Blob Storage
    // (no secrets needed, just use 'az login' locally, and managed identity when deployed on Azure).
    // If you need to use keys, use separate AzureKeyCredential instances with the keys for each service
    const credential = new DefaultAzureCredential();

    // Set up Azure clients
    const searchIndexClient = new SearchIndexClient(
      `https://${config.azureSearchService}.search.windows.net`,
      credential,
    );

    fastify.decorate('azure', {
      credential,
      searchIndex: searchIndexClient,
    });
  },
  {
    name: 'azure',
    dependencies: ['config'],
  },
);

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
  export interface FastifyInstance {
    azure: AzureClients;
  }
}
