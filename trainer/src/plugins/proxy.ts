import fp from 'fastify-plugin';
import proxy from '@fastify/http-proxy';
import { DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity';

const AZURE_COGNITIVE_SERVICES_AD_SCOPE = 'https://cognitiveservices.azure.com/.default';

export default fp(
  async (fastify, options) => {
    const config = fastify.config;

    // Use the current user identity to authenticate with Azure OpenAI, AI Search and Blob Storage
    // (no secrets needed, just use 'az login' locally, and managed identity when deployed on Azure).
    // If you need to use keys, use separate AzureKeyCredential instances with the keys for each service
    const credential = new DefaultAzureCredential();
    const getToken = getBearerTokenProvider(credential, AZURE_COGNITIVE_SERVICES_AD_SCOPE);

    const openAiUrl = `https://${config.azureOpenAiService}.openai.azure.com`;
    fastify.log.info(`Using OpenAI at ${openAiUrl}`);

    let openAiToken: string;

    fastify.register(proxy, {
      upstream: openAiUrl,
      prefix: '/openai',
      rewritePrefix: '/openai',
      preHandler: async (request, reply) => {
        openAiToken = await getToken();
      },
      // TODO: add and check API key
      // preValidation:
      replyOptions: {
        getUpstream: (request, base) => {
          return openAiUrl;
        },
        rewriteRequestHeaders: (request, headers) => {
          const apiKey = openAiToken;
          return {
            ...headers,
            authorization: `Bearer ${apiKey}`,
            'api-key': apiKey,
          };
        },
      },
    });
  },
  {
    name: 'proxy',
    dependencies: ['config'],
  },
);
