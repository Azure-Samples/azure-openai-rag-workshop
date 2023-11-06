import fp from 'fastify-plugin';
import { DefaultAzureCredential } from '@azure/identity';
import { SearchClient } from '@azure/search-documents';

export type AzureClients = {
  credential: DefaultAzureCredential;
  search: SearchClient<any>;
};

export default fp(
  async (fastify, _options) => {
    const config = fastify.config;

    // Use the current user identity to authenticate with Azure OpenAI, Cognitive Search and Blob Storage
    // (no secrets needed, just use 'az login' locally, and managed identity when deployed on Azure).
    // If you need to use keys, use separate AzureKeyCredential instances with the keys for each service
    const credential = new DefaultAzureCredential();

    // Set up Azure clients
    const searchClient = new SearchClient<any>(
      `https://${config.azureSearchService}.search.windows.net`,
      config.azureSearchIndex,
      credential,
    );

    fastify.decorate('azure', {
      credential,
      search: searchClient,
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
