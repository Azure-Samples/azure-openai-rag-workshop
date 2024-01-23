import { FileInfos } from "../file.js";

export interface VectorDB {
  addToIndex(indexName: string, fileInfos: FileInfos): Promise<void>;
  deleteFromIndex(indexName: string, filename?: string): Promise<void>;
  ensureSearchIndex(indexName: string): Promise<void>;
  deleteSearchIndex(indexName: string): Promise<void>;
}
