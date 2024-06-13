#!/usr/bin/env bash
##############################################################################
# Usage: ./setup-template.sh [aisearch|qdrant|quarkus]
# Setup the current project template.
##############################################################################
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

template_name=$1
if [ -z "$template_name" ]; then
  echo "Usage: setup-template.sh [aisearch|qdrant|quarkus]"
  exit 1
fi

##############################################################################
# Common template setup
##############################################################################

# Remove unnecessary files
rm -rf node_modules
rm -rf .github
rm -rf TODO
rm -rf package-lock.json
rm -rf scripts/repo
rm -rf docs
rm -rf .prettierignore
rm -rf trainer
rm -rf .azure
rm -rf .qdrant
rm -rf .env
rm -rf ./*.env
rm -rf docker-compose.yml

# Prepare files
echo -e "import { type ChatResponse, type ChatRequestOptions, type ChatResponseChunk } from './models.js';

export const apiBaseUrl = import.meta.env.VITE_BACKEND_API_URI || '';

export async function getCompletion(options: ChatRequestOptions) {
  const apiUrl = options.apiUrl || apiBaseUrl;

  // TODO: complete call to Chat API here
  // const response =

  if (options.stream) {
    return getChunksFromResponse<ChatResponseChunk>(response as Response, options.chunkIntervalMs);
  }

  const json: ChatResponse = await response.json();
  if (response.status > 299 || !response.ok) {
    throw new Error(json.error || 'Unknown error');
  }

  return json;
}

export function getCitationUrl(citation: string): string {
  return \`\${apiBaseUrl}/content/\${citation}\`;
}

export class NdJsonParserStream extends TransformStream<string, JSON> {
  private buffer: string = '';
  constructor() {
    let controller: TransformStreamDefaultController<JSON>;
    super({
      start: (_controller) => {
        controller = _controller;
      },
      transform: (chunk) => {
        const jsonChunks = chunk.split('\\\\n').filter(Boolean);
        for (const jsonChunk of jsonChunks) {
          try {
            this.buffer += jsonChunk;
            controller.enqueue(JSON.parse(this.buffer));
            this.buffer = '';
          } catch {
            // Invalid JSON, wait for next chunk
          }
        }
      },
    });
  }
}

export async function* getChunksFromResponse<T>(response: Response, intervalMs: number): AsyncGenerator<T, void> {
  const reader = response.body?.pipeThrough(new TextDecoderStream()).pipeThrough(new NdJsonParserStream()).getReader();
  if (!reader) {
    throw new Error('No response body or body is not readable');
  }

  let value: JSON | undefined;
  let done: boolean;
  while ((({ value, done } = await reader.read()), !done)) {
    yield new Promise<T>((resolve) => {
      setTimeout(() => {
        resolve(value as T);
      }, intervalMs);
    });
  }
}
" > src/frontend/src/api.ts

##############################################################################

if [ "$template_name" == "qdrant" ]; then
  echo "Preparing project template for Qdrant..."

  rm -rf src/backend-node-aisearch/Dockerfile
  cp -f src/backend-node-aisearch/src/routes/root.ts src/backend-node-qdrant/src/routes/root.ts

  echo -e "import fp from 'fastify-plugin';
import { ChatOpenAI, OpenAIEmbeddings, type OpenAIChatInput, type OpenAIEmbeddingsParams } from '@langchain/openai';
import { type Message, MessageBuilder, type ChatResponse, type ChatResponseChunk } from '../lib/index.js';
import { type AppConfig } from './config.js';

export class ChatService {
  tokenLimit: number = 4000;

  constructor(
    private config: AppConfig,
    private qdrantClient: QdrantClient,
    private chatClient: (options?: Partial<OpenAIChatInput>) => ChatOpenAI,
    private embeddingsClient: (options?: Partial<OpenAIEmbeddingsParams>) => OpenAIEmbeddings,
    private chatGptModel: string,
    private embeddingModel: string,
    private sourcePageField: string,
    private contentField: string,
  ) {}

  async run(messages: Message[]): Promise<ChatResponse> {

    // TODO: implement Retrieval Augmented Generation (RAG) here

  }
}

export default fp(
  async (fastify, options) => {
    const config = fastify.config;

    // TODO: initialize clients here

    const chatService = new ChatService(
      /*
      config,
      qdrantClient,
      chatClient,
      embeddingsClient,
      config.azureOpenAiChatGptModel,
      config.azureOpenAiEmbeddingModel,
      config.kbFieldsSourcePage,
      config.kbFieldsContent,
      */
    );

    fastify.decorate('chat', chatService);
  },
  {
    name: 'chat',
    dependencies: ['config'],
  },
);

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
  export interface FastifyInstance {
    chat: ChatService;
  }
}
" > src/backend-node-qdrant/src/plugins/chat.ts

  mv src/backend-node-qdrant src/backend
  rm -rf src/backend-* | true
  rm -rf src/ingestion-* | true
  rm -rf pom.xml

  echo -e "services:
  # backend:
  #   build:
  #     dockerfile: ./src/backend/Dockerfile
  #   environment:
  #     - AZURE_OPENAI_URL=\${AZURE_OPENAI_URL}
  #     - QDRANT_URL=http://qdrant:6333
  #     - LOCAL=true
  #   ports:
  #     - 3000:3000

  ingestion:
    build:
      dockerfile: ./src/ingestion/Dockerfile
    environment:
      - AZURE_OPENAI_URL=\${AZURE_OPENAI_URL}
      - QDRANT_URL=http://qdrant:6333
    ports:
      - 3001:3001

  qdrant:
    image: docker.io/qdrant/qdrant:v1.8.2
    ports:
      - 6333:6333
      - 6334:6334
    volumes:
      - .qdrant:/qdrant/storage:z
" > docker-compose.yml
  npm install
elif [ "$template_name" == "aisearch" ]; then
  echo "Preparing project template for Azure AI Search..."

  rm -rf src/backend-node-aisearch/Dockerfile
  echo -e "import { type FastifyReply, type FastifyPluginAsync } from 'fastify';

const root: FastifyPluginAsync = async (fastify, options): Promise<void> => {
  fastify.get('/', async function (request, reply) {
    return { message: 'server up' };
  });

  // TODO: create /chat endpoint
};

export default root;
" > src/backend-node-aisearch/src/routes/root.ts

  echo -e "import fp from 'fastify-plugin';
import { ChatOpenAI, OpenAIEmbeddings, type OpenAIChatInput, type OpenAIEmbeddingsParams } from '@langchain/openai';
import { type Message, MessageBuilder, type ChatResponse, type ChatResponseChunk } from '../lib/index.js';

export class ChatService {
  tokenLimit: number = 4000;

  constructor(
    private searchClient: SearchClient<any>,
    private chatClient: (options?: Partial<OpenAIChatInput>) => ChatOpenAI,
    private embeddingsClient: (options?: Partial<OpenAIEmbeddingsParams>) => OpenAIEmbeddings,
    private chatGptModel: string,
    private embeddingModel: string,
    private sourcePageField: string,
    private contentField: string,
  ) {}

  async run(messages: Message[]): Promise<ChatResponse> {

    // TODO: implement Retrieval Augmented Generation (RAG) here

  }
}

export default fp(
  async (fastify, options) => {
    const config = fastify.config;

    // TODO: initialize clients here

    const chatService = new ChatService(
      /*
      searchClient,
      chatClient,
      embeddingsClient,
      config.azureOpenAiChatGptModel,
      config.azureOpenAiEmbeddingModel,
      config.kbFieldsSourcePage,
      config.kbFieldsContent,
      */
    );

    fastify.decorate('chat', chatService);
  },
  {
    name: 'chat',
    dependencies: ['config'],
  },
);

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
  export interface FastifyInstance {
    chat: ChatService;
  }
}
" > src/backend-node-aisearch/src/plugins/chat.ts

  mv src/backend-node-aisearch src/backend
  rm -rf src/backend-* | true
  rm -rf src/ingestion-* | true
  rm -rf pom.xml
  npm install
elif [ "$template_name" == "quarkus" ]; then
  echo "Preparing project template for Quarkus..."

  rm -rf src/backend-java-quarkus/src/main/java/ai/azure/openai/rag/workshop/backend/rest/ChatResource.java
  rm -rf src/backend-java-quarkus/src/main/java/ai/azure/openai/rag/workshop/backend/rest/ChatRequest.java
  rm -rf src/backend-java-quarkus/src/main/java/ai/azure/openai/rag/workshop/backend/configuration/ChatLanguageModelOllamaProducer.java

  echo -e "package ai.azure.openai.rag.workshop.backend.configuration;

import dev.langchain4j.model.azure.AzureOpenAiChatModel;
import dev.langchain4j.model.chat.ChatLanguageModel;
import jakarta.enterprise.inject.Produces;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import com.azure.core.credential.TokenRequestContext;
import com.azure.identity.DefaultAzureCredential;
import com.azure.identity.DefaultAzureCredentialBuilder;

import static java.time.Duration.ofSeconds;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ChatLanguageModelAzureOpenAiProducer {

  private static final Logger log = LoggerFactory.getLogger(ChatLanguageModelAzureOpenAiProducer.class);

  @ConfigProperty(name = \"AZURE_OPENAI_URL\")
  String azureOpenAiEndpoint;

  @ConfigProperty(name = \"AZURE_OPENAI_DEPLOYMENT_NAME\", defaultValue = \"gpt-35-turbo\")
  String azureOpenAiDeploymentName;

  @Produces
  public ChatLanguageModel chatLanguageModel() {
    // TODO: initialize chat model here
    return null;
  }
}
" > src/backend-java-quarkus/src/main/java/ai/azure/openai/rag/workshop/backend/configuration/ChatLanguageModelAzureOpenAiProducer.java

  echo -e "package ai.azure.openai.rag.workshop.backend.configuration;

import dev.langchain4j.model.embedding.AllMiniLmL6V2EmbeddingModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import jakarta.enterprise.inject.Produces;
import org.eclipse.microprofile.config.inject.ConfigProperty;

public class EmbeddingModelProducer {

  @Produces
  public EmbeddingModel embeddingModel() {
    // TODO: initialize embedding model here
    return null;
  }
}
" > src/backend-java-quarkus/src/main/java/ai/azure/openai/rag/workshop/backend/configuration/EmbeddingModelProducer.java

  echo -e "package ai.azure.openai.rag.workshop.backend.configuration;

import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.qdrant.QdrantEmbeddingStore;
import jakarta.enterprise.inject.Produces;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URI;
import java.net.URISyntaxException;

public class EmbeddingStoreProducer {

  @Produces
  public EmbeddingStore<TextSegment> embeddingStore() {
    // TODO: initialize embedding store here
    return null;
  }
}
" > src/backend-java-quarkus/src/main/java/ai/azure/openai/rag/workshop/backend/configuration/EmbeddingStoreProducer.java

  mv src/backend-java-quarkus src/backend
  rm -rf src/ingestion
  mv src/ingestion-java-quarkus src/ingestion
  rm -rf src/backend-* | true
  rm -rf src/ingestion-* | true

  echo -e "services:
  # backend:
  #   build:
  #     dockerfile: ./src/backend/Dockerfile
  #   environment:
  #     - AZURE_OPENAI_URL=\${AZURE_OPENAI_URL}
  #     - QDRANT_URL=http://qdrant:6334
  #     - LOCAL=true
  #   ports:
  #     - 3000:3000

  ingestion:
    build:
      dockerfile: ./src/ingestion/Dockerfile
    environment:
      - AZURE_OPENAI_URL=\${AZURE_OPENAI_URL}
      - QDRANT_URL=http://qdrant:6334
    ports:
      - 3001:3001

  qdrant:
    image: docker.io/qdrant/qdrant:v1.8.2
    ports:
      - 6333:6333
      - 6334:6334
    volumes:
      - .qdrant:/qdrant/storage:z
" > docker-compose.yml

  perl -pi -e 's/api_mode=false/api_mode=true/g' scripts/ingest-data.sh
  perl -pi -e 's/$api_mode = false/$api_mode = true/g' scripts/ingest-data.ps1
  npm install
else
  echo "Invalid template name. Please use 'aisearch', 'qdrant' or 'quarkus' as the template name."
  echo "Usage: setup-template.sh [aisearch|qdrant|quarkus]"
  exit 1
fi

rm -rf ./scripts/setup-template.sh

git add .
git commit -m "chore: complete project setup"

echo "Template ready!"

