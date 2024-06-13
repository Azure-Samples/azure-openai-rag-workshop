#!/usr/bin/env bash
##############################################################################
# Usage: ./setup-template.sh [aisearch|qdrant]
# Setup the current project template.
##############################################################################
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

template_name=$1
if [ -z "$template_name" ]; then
  echo "Usage: setup-template.sh [aisearch|qdrant]"
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

rm -rf src/backend/Dockerfile
echo -e "import { type FastifyReply, type FastifyPluginAsync } from 'fastify';

const root: FastifyPluginAsync = async (fastify, options): Promise<void> => {
  fastify.get('/', async function (request, reply) {
    return { message: 'server up' };
  });

  // TODO: create /chat endpoint
};

export default root;
" > src/backend/src/routes/root.ts

##############################################################################

if [ "$template_name" == "qdrant" ]; then
  echo "Preparing project template for Qdrant..."

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
" > src/backend/src/plugins/chat.ts

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
    volumes:
      - .qdrant:/qdrant/storage:z
" > docker-compose.yml
  npm install
elif [ "$template_name" == "aisearch" ]; then
  echo "Preparing project template for Azure AI Search..."

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
" > src/backend/src/plugins/chat.ts

  npm install
else
  echo "Invalid template name. Please use 'aisearch' or 'qdrant' as the template name."
  echo "Usage: setup-template.sh [aisearch|qdrant]"
  exit 1
fi

rm -rf ./scripts/setup-template.sh

git add .
git commit -m "chore: complete project setup"

echo "Template ready!"
