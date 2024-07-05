import { Readable } from 'node:stream';
import { type FastifyPluginAsync } from 'fastify';

const root: FastifyPluginAsync = async (fastify, options): Promise<void> => {
  fastify.get('/', async function (request, reply) {
    return { message: 'server up' };
  });

  // TODO: create /chat endpoint
};

export default root;

