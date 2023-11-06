import { Readable } from 'node:stream';
import { FastifyReply, type FastifyPluginAsync } from 'fastify';
import { ChatResponseChunk } from '../lib';

const root: FastifyPluginAsync = async (fastify, _options): Promise<void> => {
  fastify.get('/', async function (_request, _reply) {
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

async function replyNdJsonStream(reply: FastifyReply, chunks: AsyncGenerator<ChatResponseChunk>) {
  // Create new buffer stream
  const buffer = new Readable();  
  buffer._read = () => {};   // Dummy implementation needed

  reply.type('application/x-ndjson').send(buffer);

  for await (const chunk of chunks) {
    buffer.push(JSON.stringify(chunk) + '\n');
  }

  // eslint-disable-next-line unicorn/no-null
  buffer.push(null);
}

export default root;
