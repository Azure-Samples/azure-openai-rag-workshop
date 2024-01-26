import fp from 'fastify-plugin';
import { DefaultAzureCredential } from '@azure/identity';
import { SearchIndexClient } from '@azure/search-documents';
import { unusedService } from './config.js';

export type AzureClients = {
  credential: DefaultAzureCredential;
  searchIndex: SearchIndexClient;
};

export default fp(
  async (fastify, _options) => {
    const config = fastify.config;

    // Use the current user identity to authenticate with Azure OpenAI, AI Search and Blob Storage
    // (no secrets needed, just use 'az login' locally, and managed identity when deployed on Azure).
    // If you need to use keys, use separate AzureKeyCredential instances with the keys for each service
    const credential = new DefaultAzureCredential();

    let searchIndexClient: SearchIndexClient;
    if (config.azureSearchService !== unusedService) {
      // Set up Azure clients
      searchIndexClient = new SearchIndexClient(`https://${config.azureSearchService}.search.windows.net`, credential);
    }

    fastify.decorate('azure', {
      credential,
      searchIndex: searchIndexClient!,
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
