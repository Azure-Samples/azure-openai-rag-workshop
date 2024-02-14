#!/usr/bin/env bash
cd "$(dirname "${BASH_SOURCE[0]}")/.."

template_name=$1
if [ -z "$template_name" ]; then
  echo "Usage: setup-template.sh [aisearch|qdrant]"
  exit 1
fi

if [ "$template_name" == "qdrant" ]; then
  echo "Preparing project template for Qdrant..."
  # mv src/backend-nodejs src/backend
  rm -rf src/backend-*

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

echo -e "version: '3.9'
services:
  # backend:
  #   build:
  #     dockerfile: ./src/backend/Dockerfile
  #   environment:
  #     - AZURE_OPENAI_URL=\${AZURE_OPENAI_URL}
  #     - QDRANT_URL=http://qdrant:6333
  #     - LOCAL=true
  #   ports:
  #     - 3000:3000

  indexer:
    build:
      dockerfile: ./src/indexer/Dockerfile
    environment:
      - AZURE_OPENAI_URL=\${AZURE_OPENAI_URL}
      - QDRANT_URL=http://qdrant:6333
    ports:
      - 3001:3001

  qdrant:
    image: docker.io/qdrant/qdrant:v1.7.3
    ports:
      - 6333:6333
    volumes:
      - .qdrant:/qdrant/storage:z
" > docker-compose.yml
  npm install
elif [ "$template_name" == "aisearch" ]; then
  echo "Preparing project template for Azure AI Search..."
  # mv src/backend-nodejs src/backend
  rm -rf src/backend-*
  npm install
elif [ "$template_name" == "quarkus" ]; then
  echo "Preparing project template for Quarkus..."
  rm -rf src/backend
  mv src/backend-java-quarkus src/backend
  rm -rf src/backend-*
else
  echo "Invalid template name. Please use 'aisearch', 'qdrant' or 'quarkus' as the template name."
  echo "Usage: setup-template.sh [aisearch|qdrant|quarkus]"
  exit 1
fi

rm -rf ./scripts/setup-template.sh

git add .
git commit -m "chore: complete project setup"

echo "Template ready!"

