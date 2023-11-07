#!/usr/bin/env bash
##############################################################################
# Usage: ./create-github-template.sh [--local]
# Creates the project template and push it to GitHub.
##############################################################################

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
cd ../..

BASE_DIR=$(pwd)
TEMPLATE_HOME=/tmp/azure-openai-rag-workshop
GH_USER=$(git config user.name)
TEMPLATE_REPO=https://$GH_USER:$GH_TOKEN@github.com/Azure-Samples/azure-openai-rag-workshop-template.git

echo "Preparing GitHub project template..."
echo "(temp folder: $TEMPLATE_HOME)"
rm -rf "$TEMPLATE_HOME"
mkdir -p "$TEMPLATE_HOME"
find . -type d -not -path '*node_modules*' -not -path '*.git/*' -not -path '*dist*' -exec mkdir -p '{}' "$TEMPLATE_HOME/{}" ';'
find . -type f -not -path '*node_modules*' -not -path '*.git/*' -not -path '*dist*' -exec cp -r '{}' "$TEMPLATE_HOME/{}" ';'
cd "$TEMPLATE_HOME"
rm -rf .git
git init -b main

# Remove unnecessary files
rm -rf node_modules
rm -rf .github
rm -rf TODO
rm -rf docker-compose.yml
rm -rf package-lock.json
rm -rf scripts/repo
rm -rf docs
rm -rf .prettierignore
rm -rf trainer
rm -rf .azure
rm -rf .env

# Prepare files
rm -rf src/backend/src/plugins/chat-langchain.ts
rm -rf src/backend/src/Dockerfile

echo -e "import { Readable } from 'node:stream';
import { type FastifyReply, type FastifyPluginAsync } from 'fastify';

const root: FastifyPluginAsync = async (fastify, options): Promise<void> => {
  fastify.get('/', async function (request, reply) {
    return { message: 'server up' };
  });

  // TODO: create /chat endpoint
};

/**
 * Reply to a request with a stream of NDJSON chunks.
 * @param {FastifyReply} reply The Fastify reply object.
 * @param {AsyncGenerator<object>} chunks The chunks to send.
 * @returns {Promise<void>} A promise that resolves when the reply is sent.
 */
async function replyNdJsonStream(reply: FastifyReply, chunks: AsyncGenerator<object>) {
  // Create a new stream buffer
  const buffer = new Readable();
  // We must implement the _read method, but we don't need to do anything
  buffer._read = () => {};

  // Start streaming the buffer to the client
  reply.type('application/x-ndjson').send(buffer);

  for await (const chunk of chunks) {
    // Send JSON chunks, separated by newlines
    buffer.push(JSON.stringify(chunk) + '\\n');
  }

  // Signal end of stream
  buffer.push(null);
}

export default root;
" > src/backend/src/routes/root.ts

echo -e "import fp from 'fastify-plugin';
import { SearchClient } from '@azure/search-documents';
import { type Chat, type Embeddings } from 'openai/resources/index.js';
import { type Message, MessageBuilder, type ChatResponse, type ChatResponseChunk } from '../lib/index.js';

export class ChatService {
  tokenLimit: number = 4000;

  constructor(
    private search: SearchClient<any>,
    private chatClient: Chat,
    private embeddingsClient: Embeddings,
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

echo -e "import { type ChatResponse, type ChatRequestOptions, type ChatResponseChunk } from './models.js';

export const apiBaseUrl = import.meta.env.VITE_CHAT_API_URI || '';

export async function getCompletion(options: ChatRequestOptions, oneShot = false) {
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
        const jsonChunks = chunk.split('\\n').filter(Boolean);
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



if [[ ${1-} == "--local" ]]; then
  echo "Local mode: skipping GitHub push."
  open "$TEMPLATE_HOME"
else
  # Update git repo
  git remote add origin $TEMPLATE_REPO
  git add .
  git commit -m "chore: initial commit"
  git push -u origin main --force

  rm -rf "$TEMPLATE_HOME"
fi

echo "Successfully updated project template."
