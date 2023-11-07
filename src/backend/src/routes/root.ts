import { Readable } from 'node:stream';
import { type FastifyReply, type FastifyPluginAsync } from 'fastify';

const root: FastifyPluginAsync = async (fastify, _options): Promise<void> => {
  fastify.get('/', async function (request, reply) {
    return { message: 'server up' };
  });

  fastify.post('/chat', async function (request, reply) {
    const { messages, stream } = request.body as any;
    try {
      if (stream) {
        const chunks = await fastify.chat.runWithStreaming(messages);
        await replyNdJsonStream(reply, chunks);
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

/**
 * Reply to a request with a stream of NDJSON chunks.
 * @param {FastifyReply} reply The Fastify reply object.
 * @param {AsyncGenerator<object>} chunks The chunks to send.
 * @returns {Promise<void>} A promise that resolves when the reply is sent.
 */
async function replyNdJsonStream(reply: FastifyReply, chunks: AsyncGenerator<object>) {
  // Create a new stream buffer
  const buffer = new Readable();
  // We must implement the _read method, but we don't need to do anything
  buffer._read = () => {};

  // Start streaming the buffer to the client
  reply.type('application/x-ndjson').send(buffer);

  for await (const chunk of chunks) {
    // Send JSON chunks, separated by newlines
    buffer.push(JSON.stringify(chunk) + '\n');
  }

  // Signal end of stream
  buffer.push(null);
}

export default root;
