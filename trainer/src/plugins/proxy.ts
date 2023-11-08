import fp from 'fastify-plugin';
import proxy from '@fastify/http-proxy';
import { type AccessToken, DefaultAzureCredential } from '@azure/identity';

const AZURE_COGNITIVE_SERVICES_AD_SCOPE = 'https://cognitiveservices.azure.com/.default';

export default fp(
  async (fastify, options) => {
    const config = fastify.config;

    // Use the current user identity to authenticate with Azure OpenAI, Cognitive Search and Blob Storage
    // (no secrets needed, just use 'az login' locally, and managed identity when deployed on Azure).
    // If you need to use keys, use separate AzureKeyCredential instances with the keys for each service
    const credential = new DefaultAzureCredential();

    const openAiUrl = `https://${config.azureOpenAiService}.openai.azure.com`;
    fastify.log.info(`Using OpenAI at ${openAiUrl}`);

    let openAiToken: AccessToken;
    const refreshOpenAiToken = async () => {
      if (!openAiToken || openAiToken.expiresOnTimestamp < Date.now() + 60 * 1000) {
        openAiToken = await credential.getToken(AZURE_COGNITIVE_SERVICES_AD_SCOPE);
      }
    };

    fastify.register(proxy, {
      upstream: openAiUrl,
      prefix: '/openai',
      rewritePrefix: '/openai',
      preHandler: async (request, reply) => {
        if (!config.azureOpenAiApiKey) {
          await refreshOpenAiToken();
        }
      },
      replyOptions: {
        getUpstream: (request, base) => {
          // TODO: load balance
          return openAiUrl;
        },
        rewriteRequestHeaders: (request, headers) => {
          return {
            ...headers,
            'api-key': config.azureOpenAiApiKey || openAiToken.token,
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
