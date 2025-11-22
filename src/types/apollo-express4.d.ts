declare module '@apollo/server/express4' {
  import { ApolloServer } from '@apollo/server';
  import { RequestHandler } from 'express';

  export function expressMiddleware(server: ApolloServer): RequestHandler;
}
