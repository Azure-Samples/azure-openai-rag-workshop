import { Readable } from 'node:stream';
import { type FastifyPluginAsync } from 'fastify';

const root: FastifyPluginAsync = async (fastify, options): Promise<void> => {
  fastify.get('/', async function (request, reply) {
    return { message: 'server up' };
  });

  // TODO: create /chat endpoint
  fastify.post('/chat', async function (request, reply) {
    const { messages } = request.body as any;
    try {
      return await fastify.chat.run(messages);
    } catch (_error: unknown) {
      const error = _error as Error;
      fastify.log.error(error);
      return reply.internalServerError(error.message);
    }
  });
  
};

export default root;

