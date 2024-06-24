import { Readable } from 'node:stream';
import { type FastifyPluginAsync } from 'fastify';

const root: FastifyPluginAsync = async (fastify, _options): Promise<void> => {
  fastify.get('/', async function (request, reply) {
    return { message: 'server up' };
  });

  fastify.post('/chat', async function (request, reply) {
    const { messages, stream } = request.body as any;
    try {
      if (stream) {
        const chunks = createNdJsonStream(await fastify.chat.runWithStreaming(messages));
        reply.type('application/x-ndjson').send(Readable.from(chunks));
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

// Transform the response chunks into a JSON stream
async function* createNdJsonStream(chunks: AsyncGenerator<object>) {
  for await (const chunk of chunks) {
    // Format response chunks in Newline delimited JSON
    // see https://github.com/ndjson/ndjson-spec
    yield JSON.stringify(chunk) + '\n';
  }
}

export default root;
