import { type FastifyPluginAsync } from 'fastify';

const root: FastifyPluginAsync = async (fastify, _options): Promise<void> => {
  fastify.get('/', async function (_request, _reply) {
    return { message: 'server up' };
  });
  
  fastify.post('/documents', async function (request, reply) {
    const { file } = request.body as any;
    if (file.type !== 'file') {
      return reply.badRequest('field "file" must be a file');
    }
    try {
      const filesInfos = {
        filename: file.filename,
        data: await file.toBuffer(),
        type: file.mimetype,
      };
      fastify.log.info(`Ingesting file "${filesInfos.filename}"...`);
      await fastify.ingestion.ingestFile(filesInfos);
      reply.code(204);
    } catch (_error: unknown) {
      const error = _error as Error;
      fastify.log.error(error);
      reply.internalServerError(`Internal server error: ${error.message}`);
    }
  });

};

export default root;
