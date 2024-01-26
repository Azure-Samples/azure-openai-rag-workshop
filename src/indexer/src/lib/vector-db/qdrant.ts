import { type BaseLogger } from 'pino';
import { QdrantClient } from '@qdrant/qdrant-js';
import getUuid from 'uuid-by-string';
import { type AppConfig } from '../../plugins/config.js';
import { DocumentProcessor } from '../document-processor.js';
import { type EmbeddingModel } from '../embedding-model.js';
import { type FileInfos } from '../file.js';
import { type VectorDB } from './vector-db.js';

export class QdrantVectorDB implements VectorDB {
  private qdrantClient: QdrantClient;

  constructor(
    private logger: BaseLogger,
    private embeddingModel: EmbeddingModel,
    config: AppConfig,
  ) {
    this.logger.debug(`Connecting to Qdrant at ${config.qdrantUrl}`);
    this.qdrantClient = new QdrantClient({
      url: config.qdrantUrl,
      // https://github.com/qdrant/qdrant-js/issues/59
      port: Number(config.qdrantUrl.split(':')[2])
    });
  }

  async addToIndex(indexName: string, fileInfos: FileInfos): Promise<void> {
    const { filename, data, type, category } = fileInfos;
    const documentProcessor = new DocumentProcessor(this.logger);
    const document = await documentProcessor.createDocumentFromFile(filename, data, type, category);
    const sections = document.sections;
    await this.embeddingModel.updateEmbeddingsInBatch(sections);

    const points = sections.map((section) => ({
      // ID must be either a 64-bit integer or a UUID
      id: getUuid(section.id, 5),
      vector: section.embedding!,
      payload: {
        id: section.id,
        content: section.content,
        category: section.category,
        sourcepage: section.sourcepage,
        sourcefile: section.sourcefile,
      },
    }));

    await this.qdrantClient.upsert(indexName, { points });
    this.logger.debug(`Indexed ${sections.length} sections from file "${filename}"`);
  }

  async deleteFromIndex(indexName: string, filename?: string): Promise<void> {
    await this.qdrantClient.delete(indexName, {
      filter: {
        must: [{ key: 'sourcefile', match: { value: filename } }],
      },
    });
  }

  async ensureSearchIndex(indexName: string): Promise<void> {
    try {
      await this.qdrantClient.getCollection(indexName);
      this.logger.debug(`Search index "${indexName}" already exists`);
    } catch (_error: unknown) {
      this.logger.debug(_error);
      const error = _error as Error;
      if (error.message === 'Not Found') {
        this.logger.debug(`Creating search index "${indexName}"`);
        await this.qdrantClient.createCollection(indexName, {
          vectors: {
            size: this.embeddingModel.size,
            distance: 'Cosine',
          },
        });
      } else {
        throw error;
      }
    }
  }

  async deleteSearchIndex(indexName: string): Promise<void> {
    await this.qdrantClient.deleteCollection(indexName);
  }
}
