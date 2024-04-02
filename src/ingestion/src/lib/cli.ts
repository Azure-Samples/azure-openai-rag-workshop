import process from 'node:process';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, dirname, extname } from 'node:path';
import { type OptionValues, program } from 'commander';
import * as dotenv from 'dotenv';
import mime from 'mime';

export interface IndexFilesOptions {
  ingestionUrl: string;
  indexName?: string;
  category?: string;
  wait: boolean;
}

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function run(arguments_: string[] = process.argv) {
  dotenv.config();

  const file = await fs.readFile(join(__dirname, '../../package.json'), 'utf8');
  const packageJson = JSON.parse(file) as Record<string, string>;

  program
    .name('index-files')
    .arguments('<files...>')
    .description('CLI utility to send files to an ingestion service instance')
    .option('-u, --ingestion-url <url>', 'The ingestion service URL', 'http://localhost:3001')
    .option('-i, --index-name <name>', 'The name of the target index', process.env.INDEX_NAME || 'kbindex')
    .option('-c, --category <name>', 'Set document category')
    .option('-w, --wait', 'Wait for the ingestion to finish processing the files', false)
    .version(packageJson.version, '-v, --version', 'Show the current version')
    .showHelpAfterError()
    .action(async (files: string[], options: OptionValues) => {
      const { ingestionUrl, indexName, wait } = options;
      await indexFiles(files, {
        ingestionUrl,
        indexName,
        wait,
      });
    });
  program.parse(arguments_);
}

export async function indexFiles(files: string[], options: IndexFilesOptions) {
  try {
    if (!options.indexName) {
      throw new Error('Index name is required');
    }
    console.log(`Indexing ${files.length} file(s)...`);
    await ensureSearchIndex(options);

    for (const file of files) {
      await indexFile(file, options);
    }

    console.log('Completed.');
  } catch (_error: unknown) {
    const error = _error as Error;
    console.error(`Error indexing files: ${error.message}`);
    process.exitCode = 1;
  }
}

async function ensureSearchIndex(options: IndexFilesOptions) {
  const { ingestionUrl, indexName } = options;
  const response = await fetch(`${ingestionUrl}/indexes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: indexName?.trim(),
    }),
  });
  if (!response.ok) {
    const errorDetails = (await response.json()) as any;
    throw new Error(`Index creating "${indexName}": ${errorDetails.message}`);
  }
}

async function indexFile(file: string, options: IndexFilesOptions) {
  console.log(`Indexing file "${file}"...`);
  const { ingestionUrl, indexName, category, wait } = options;
  const formData = new FormData();
  const fileIndexOptions = {
    category,
    wait,
  };
  const type = mime.getType(extname(file)) ?? 'application/octet-stream';
  const fileData = await fs.readFile(file);
  formData.append('file', new Blob([fileData], { type }), file);
  formData.append('options', JSON.stringify(fileIndexOptions));
  const response = await fetch(`${ingestionUrl}/indexes/${indexName}/files`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const errorDetails = (await response.json()) as any;
    throw new Error(`Error indexing file "${file}": ${errorDetails.message}`);
  }
  console.log(`File "${file}" indexed successfully`);
}
