import { cacheGet, cacheSet, CACHE_TTL } from '../lib/redis.js';
import { config } from '../config.js';

const CACHE_PREFIX = 'ai:mentor:';

export async function aiRoutes(fastify) {
  // Mentor virtual - sugestões/feedback (integração OpenAI/Grok)
  fastify.post('/ai/mentor', {
    config: { requireAuth: true },
    schema: {
      body: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string' },
          context: { type: 'object' }, // projectId, challengeType, etc.
        },
      },
    },
    handler: async (request, reply) => {
      const { message, context } = request.body;
      const cacheKey = CACHE_PREFIX + Buffer.from(JSON.stringify({ message, context: context?.projectId })).toString('base64').slice(0, 64);
      const cached = await cacheGet(cacheKey);
      if (cached) return cached;

      if (!config.openaiApiKey) {
        return {
          reply: 'O Mentor Virtual está em configuração. Enquanto isso, sugerimos: revise a viabilidade do projeto com dados de mercado e consulte os módulos de aprendizado sobre BMC e Pitch.',
          fromCache: false,
        };
      }

      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.openaiApiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'Você é o Mentor Virtual da Saga SENAI de Inovação. Responda de forma objetiva, encorajadora e prática, com sugestões sobre inovação, viabilidade, BMC, pitch e metodologia SENAI. Respostas em português, máx 500 caracteres.',
              },
              { role: 'user', content: message },
            ],
            max_tokens: 300,
          }),
        });
        const data = await res.json();
        const replyText = data.choices?.[0]?.message?.content?.trim() || 'Não foi possível processar. Tente novamente.';
        const out = { reply: replyText, fromCache: false };
        await cacheSet(cacheKey, out, 600);
        return out;
      } catch (err) {
        console.error('OpenAI error', err);
        return {
          reply: 'O mentor está temporariamente indisponível. Use os materiais de apoio e os critérios do edital para orientar seu projeto.',
          fromCache: false,
        };
      }
    },
  });

  // Análise preditiva (placeholder - pode usar embeddings/ML depois)
  fastify.get('/ai/suggestions/:projectId', {
    config: { requireAuth: true },
    handler: async (request, reply) => {
      const projectId = request.params.projectId;
      const cacheKey = `ai:suggestions:${projectId}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return cached;
      const out = {
        suggestions: [
          'Projetos semelhantes na Saga costumam incluir dados de mercado no BMC.',
          'Considere destacar o caráter inovador no pitch em até 30 segundos.',
        ],
        fromCache: false,
      };
      await cacheSet(cacheKey, out, 3600);
      return out;
    },
  });
}
