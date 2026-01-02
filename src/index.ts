import cors from '@elysiajs/cors'
import { yoga } from '@elysiajs/graphql-yoga'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { Elysia } from 'elysia'
import { createPubSub } from 'graphql-yoga'

import { resolvers } from '@/graphql/resolvers'
import { typeDefs } from '@/graphql/schema'
import log from '@/lib/log'
import { verifyToken } from '@/utils/auth'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)





// ✅ PubSub pour les subscriptions
const pubsub = createPubSub()

// ✅ Construire le schéma GraphQL
const schema = makeExecutableSchema({ typeDefs, resolvers })

// ✅ Création du serveur Elysia + Yoga
const app = new Elysia()
  
  // Middleware CORS (simple)
  .use(cors({
    origin: '*',       // autorise toutes les origines
    credentials: true, // autorise les cookies/headers d’auth
  }))
  // Static files (équivalent de express.static)
  .get('/media/*', ({ request }: any) => {
    const url = request.url || ''
    const filePath = path.join(__dirname, '../media', url.split('/media/')[1] || '')
    return Bun.file(filePath)
  })
  // Middleware de logging pour toutes les requêtes
  .onRequest(({ request }) => {
    const timestamp = new Date().toLocaleTimeString("fr-FR");
    const url = new URL(request.url);

    // Identification de la source
    const ip =
      request.headers.get("x-forwarded-for") || // utile derrière un proxy
      request.headers.get("cf-connecting-ip") || // Cloudflare
      request.headers.get("x-real-ip") || // Nginx
      "unknown";

    const userAgent = request.headers.get("user-agent") || "unknown";

    log(
      `\n[${timestamp}] 📥 ${request.method} ${url.pathname}`,
      `🌐 IP: ${ip}`,
      `🖥️ UA: ${userAgent}`
    );
  })
  // GraphQL Yoga avec contexte et subscriptions
  .use(
    yoga({
      schema,
      context: async ({ request }) => {
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        log('🔵 GraphQL Request Context')
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        const authHeader = request.headers.get('authorization')
        const token = authHeader?.split(' ')[1]
        log(`🔑 Token: ${token ? token.substring(0, 20) + '...' : 'None'}`)

        const user = token ? await verifyToken(token) : null
        log(`👤 User: ${user ? `${user.name} (${user.role})` : 'Anonymous'}`)
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

        return { user, pubsub, request }
      },
    })
  )
  .listen({ port: 4001, hostname: '0.0.0.0' }, (server: any) => {
    log('')
    log(`🚀 Server ready at http://localhost:${server.port}/graphql`)
    log(`📡 Subscriptions ready at ws://localhost:${server.port}/graphql`)
    log(`🚀 Server ready at http://${server.hostname}:${server.port}/graphql`)
    log(`📡 Subscriptions ready at ws://${server.hostname}:${server.port}/graphql`)
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  })