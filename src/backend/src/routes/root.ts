import { Readable } from 'node:stream';
import { type FastifyPluginAsync } from 'fastify';

const root: FastifyPluginAsync = async (fastify, _options): Promise<void> => {
  fastify.get('/', async function (_request, _reply) {
    return { message: 'server up' };
  });

  fastify.post('/chat', async function (request, reply) {
    const { messages, stream } = request.body as any;
    try {
      if (stream) {
        const buffer = new Readable();
        // Dummy implementation needed
        buffer._read = () => {};
        reply.type('application/x-ndjson').send(buffer);

        const chunks = await fastify.chat.runWithStreaming(messages);
        for await (const chunk of chunks) {
          buffer.push(JSON.stringify(chunk) + '\n');
        }
        // eslint-disable-next-line unicorn/no-null
        buffer.push(null);
      } else {
        return await fastify.chat.run(messages);
      }
    } catch (_error: unknown) {
      const error = _error as Error;
      fastify.log.error(error);
      return reply.internalServerError(error.message);
    }
  });
};

export default root;
