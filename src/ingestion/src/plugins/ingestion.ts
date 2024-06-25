import fp from 'fastify-plugin';
import { QdrantClient } from '@qdrant/qdrant-js';
import { DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity';
import { AzureOpenAIEmbeddings } from '@langchain/openai';
import { AzureAISearchVectorStore } from '@langchain/community/vectorstores/azure_aisearch';
import { QdrantVectorStore } from "@langchain/qdrant";
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { type VectorStore } from '@langchain/core/vectorstores';
import { type FileInfos } from '../lib/file.js';
import { unusedService } from './config.js';

export class IngestionService {
  constructor(private vectorStore: VectorStore) {}

  async ingestFile(file: FileInfos) {
    // Extract text from the PDF
    const blob = new Blob([file.data]);
    const loader = new PDFLoader(blob, {
      splitPages: false,
    });
    const rawDocument = await loader.load();
    rawDocument[0].metadata.source = file.filename;

    // Split the text into smaller chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1500,
      chunkOverlap: 100,
    });
    const documents = await splitter.splitDocuments(rawDocument);

    // Generate embeddings and save in database
    await this.vectorStore.addDocuments(documents);
  }
}

export default fp(
  async (fastify, _options) => {
    const config = fastify.config;

    // Use the current user identity to authenticate.
    // No secrets needed, it uses `az login` or `azd auth login` locally,
    // and managed identity when deployed on Azure.
    const credentials = new DefaultAzureCredential();

    // Set up OpenAI token provider
    const azureADTokenProvider = getBearerTokenProvider(
      credentials,
      'https://cognitiveservices.azure.com/.default'
    );

    // Set up LangChain clients
    fastify.log.info(`Using OpenAI at ${config.azureOpenAiEndpoint}`);

    const embeddings = new AzureOpenAIEmbeddings({ azureADTokenProvider });
    const vectorStore = config.qdrantUrl === unusedService ?
      new AzureAISearchVectorStore(embeddings, { credentials }) :
      new QdrantVectorStore(embeddings, {
        client: new QdrantClient({
          url: config.qdrantUrl,
          // https://github.com/qdrant/qdrant-js/issues/59
          port: Number(config.qdrantUrl.split(':')[2]),
        })
      });

    const ingestionService = new IngestionService(vectorStore);

    fastify.decorate('ingestion', ingestionService);
  },
  {
    name: 'ingestion',
    dependencies: ['config'],
  },
);

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
  export interface FastifyInstance {
    ingestion: IngestionService;
  }
}
