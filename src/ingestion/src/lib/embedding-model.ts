import { type BaseLogger } from 'pino';
import { encoding_for_model, type TiktokenModel } from '@dqbd/tiktoken';
import { type OpenAiService } from '../plugins/openai.js';
import { type Section } from './document-processor.js';
import { MODELS_SUPPORTED_BATCH_SIZE } from './model-limits.js';

export class EmbeddingModel {
  constructor(
    private logger: BaseLogger,
    private openai: OpenAiService,
    private embeddingModelName: string = 'text-embedding-ada-002',
  ) {}

  get size(): number {
    return 1536;
  }

  async createEmbedding(text: string): Promise<number[]> {
    // TODO: add retry
    const embeddingsClient = await this.openai.getEmbeddings();
    const result = await embeddingsClient.create({ input: text, model: this.embeddingModelName });
    return result.data[0].embedding;
  }

  async createEmbeddingsInBatch(texts: string[]): Promise<Array<number[]>> {
    // TODO: add retry
    const embeddingsClient = await this.openai.getEmbeddings();
    const result = await embeddingsClient.create({ input: texts, model: this.embeddingModelName });
    return result.data.map((d) => d.embedding);
  }

  async updateEmbeddingsInBatch(sections: Section[]): Promise<Section[]> {
    const batchSize = MODELS_SUPPORTED_BATCH_SIZE[this.embeddingModelName];
    const batchQueue: Section[] = [];
    let tokenCount = 0;

    for (const [index, section] of sections.entries()) {
      tokenCount += getTokenCount(section.content, this.embeddingModelName);
      batchQueue.push(section);

      if (
        tokenCount > batchSize.tokenLimit ||
        batchQueue.length >= batchSize.maxBatchSize ||
        index === sections.length - 1
      ) {
        const embeddings = await this.createEmbeddingsInBatch(batchQueue.map((section) => section.content));
        for (const [index_, section] of batchQueue.entries()) section.embedding = embeddings[index_];
        this.logger.debug(`Batch Completed. Batch size ${batchQueue.length} Token count ${tokenCount}`);

        batchQueue.length = 0;
        tokenCount = 0;
      }
    }

    return sections;
  }
}

export function getTokenCount(input: string, model: string): number {
  const encoder = encoding_for_model(model as TiktokenModel);
  const tokens = encoder.encode(input).length;
  encoder.free();
  return tokens;
}
