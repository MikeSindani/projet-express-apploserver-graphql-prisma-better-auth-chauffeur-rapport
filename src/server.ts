import { resolvers } from '@/graphql/resolvers';
import { typeDefs } from '@/graphql/schema';
import { verifyToken } from '@/utils/auth';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { makeExecutableSchema } from '@graphql-tools/schema';
import cors from 'cors';
import type { RequestHandler } from 'express';
import express from 'express';
import type { GraphQLSchema } from 'graphql';
import { useServer } from 'graphql-ws/lib/use/ws';
import http from 'http';
import { WebSocketServer } from 'ws';

// This file mirrors the app bootstrap used in src/index.ts but is provided
// at repository root for convenience. It mounts better-auth at /api/auth and
// the GraphQL endpoint at /api (same as the rest of the project).

const app = express();

// Apply middleware used by the whole app
app.use(cors());

const schema: GraphQLSchema = makeExecutableSchema({ typeDefs, resolvers });

const server = new ApolloServer({
  schema,
});
await server.start();

// Mount GraphQL endpoint with per-request context (authorization)
app.use(
  '/graphql',
  express.json(),
  (expressMiddleware as any)(server, {
    context: async ({ req } : { req : any }) => {
      const token = req.headers.authorization?.split(' ')[1];
      console.log(token);
      const user  = token ? await verifyToken(token) : null;
      console.log(user);
      return { user };
    },
  }) as unknown as RequestHandler
); 


const httpServer = http.createServer(app);

// 🔌 WebSocket pour les subscriptions
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});

useServer(
  {
    schema,
    context: async (ctx : any) => {
      const token = ctx.connectionParams?.authorization?.split(' ')[1];
      const user = token ? verifyToken(token) : null;
      return { user };
    },
  },
  wsServer
);


const PORT = process.env.PORT || 4001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  console.log(`📡 Subscriptions ready at ws://localhost:${PORT}/graphql`);
});
