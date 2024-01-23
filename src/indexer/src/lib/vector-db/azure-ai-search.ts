import { type BaseLogger } from 'pino';
import { type SearchIndex } from '@azure/search-documents';
import { AzureClients } from '../../plugins/azure.js';
import { DocumentProcessor, type Section } from '../document-processor.js';
import { EmbeddingModel } from '../embedding-model.js';
import { FileInfos } from '../file.js';
import { type VectorDB } from './vector-db.js';

const INDEXING_BATCH_SIZE = 1000;

export class AzureAISearchVectorDB implements VectorDB {
  constructor(
    private logger: BaseLogger,
    private embeddingModel: EmbeddingModel,
    private azure: AzureClients,
  ) {}

  async addToIndex(indexName: string, fileInfos: FileInfos): Promise<void> {
    const { filename, data, type, category } = fileInfos;
    const documentProcessor = new DocumentProcessor(this.logger);
    const document = await documentProcessor.createDocumentFromFile(filename, data, type, category);
    const sections = document.sections;
    await this.embeddingModel.updateEmbeddingsInBatch(sections);

    const searchClient = this.azure.searchIndex.getSearchClient(indexName);

    const batchSize = INDEXING_BATCH_SIZE;
    let batch: Section[] = [];

    for (let index = 0; index < sections.length; index++) {
      batch.push(sections[index]);

      if (batch.length === batchSize || index === sections.length - 1) {
        const { results } = await searchClient.uploadDocuments(batch);
        const succeeded = results.filter((r) => r.succeeded).length;
        const indexed = batch.length;
        this.logger.debug(`Indexed ${indexed} sections, ${succeeded} succeeded`);
        batch = [];
      }
    }
  }

  async deleteFromIndex(indexName: string, filename?: string): Promise<void> {
    this.logger.debug(`Removing sections from "${filename ?? '<all>'}" from search index "${indexName}"`);
    const searchClient = this.azure.searchIndex.getSearchClient(indexName);

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const filter = filename ? `sourcefile eq '${filename}'` : undefined;
      const r = await searchClient.search('', { filter: filter, top: 1000, includeTotalCount: true });
      if (r.count === 0) {
        break;
      }
      const documents: any[] = [];
      for await (const d of r.results) {
        documents.push({ id: (d.document as any).id });
      }

      const { results } = await searchClient.deleteDocuments(documents);
      this.logger.debug(`Removed ${results.length} sections from index`);

      // It can take a few seconds for search results to reflect changes, so wait a bit
      await wait(2000);
    }
  }

  async ensureSearchIndex(indexName: string): Promise<void> {
    const searchIndexClient = this.azure.searchIndex;

    const names: string[] = [];
    const indexNames = await searchIndexClient.listIndexes();
    for await (const index of indexNames) {
      names.push(index.name);
    }
    if (names.includes(indexName)) {
      this.logger.debug(`Search index "${indexName}" already exists`);
    } else {
      const index: SearchIndex = {
        name: indexName,
        fields: [
          {
            name: 'id',
            type: 'Edm.String',
            key: true,
          },
          {
            name: 'content',
            type: 'Edm.String',
            searchable: true,
          },
          {
            name: 'embedding',
            type: 'Collection(Edm.Single)',
            searchable: true,
            vectorSearchDimensions: this.embeddingModel.size,
            vectorSearchProfileName: 'vector-search-profile',
          },
          {
            name: 'category',
            type: 'Edm.String',
            filterable: true,
            facetable: true,
          },
          {
            name: 'sourcepage',
            type: 'Edm.String',
            filterable: true,
            facetable: true,
          },
          {
            name: 'sourcefile',
            type: 'Edm.String',
            filterable: true,
            facetable: true,
          },
        ],
        semanticSearch: {
          defaultConfigurationName: "semantic-search-config",
          configurations: [
            {
              name: 'semantic-search-config',
              prioritizedFields: {
                contentFields: [{ name: 'content' }],
                keywordsFields: [{ name: 'content' }],
              },
            },
          ],
        },
        vectorSearch: {
          algorithms: [
            {
              name: "vector-search-algorithm",
              kind: 'hnsw',
              parameters: {
                metric: 'cosine',
              },
            },
          ],
          profiles: [
            {
              name: "vector-search-profile",
              algorithmConfigurationName: "vector-search-algorithm",
            },
          ],
        },
      };
      this.logger.debug(`Creating "${indexName}" search index...`);
      await searchIndexClient.createIndex(index);
    }
  }

  async deleteSearchIndex(indexName: string): Promise<void> {
    const searchIndexClient = this.azure.searchIndex;
    await searchIndexClient.deleteIndex(indexName);
  }
}

export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
