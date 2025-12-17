import { Elysia } from 'elysia'
import { yoga } from '@elysiajs/graphql-yoga'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { createPubSub } from 'graphql-yoga'

import { resolvers } from '@/graphql/resolvers'
import { typeDefs } from '@/graphql/schema'
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
  .use(({ set }) => {
    set.headers['Access-Control-Allow-Origin'] = '*'
    set.headers['Access-Control-Allow-Credentials'] = 'true'
  })
  // Static files (équivalent de express.static)
  .get('/media/*', ({ request }) => {
    const filePath = path.join(__dirname, '../media', request.url.split('/media/')[1])
    return Bun.file(filePath)
  })
  // GraphQL Yoga avec contexte et subscriptions
  .use(
    yoga({
      schema,
      context: async ({ request }) => {
        console.log('/src/server.ts')
        console.log(' 🔵 Starting to get user from token:')

        const authHeader = request.headers.get('authorization')
        const token = authHeader?.split(' ')[1]
        console.log(' 🔵 Token', { token })

        const user = token ? await verifyToken(token) : null
        console.log(' 🔵 User found', { user })

        return { user, pubsub }
      },
    })
  )
  .listen(4001)

console.log(`🚀 Server ready at http://localhost:4001/graphql`)
console.log(`📡 Subscriptions ready at ws://localhost:4001/graphql`)