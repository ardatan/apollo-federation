const { ApolloServer } = require('apollo-server');
const {
  IntrospectAndCompose,
  RemoteGraphQLDataSource,
} = require("@apollo/gateway");
const { applyMiddleware } = require('graphql-middleware');
const { getStitchedSchemaFromSupergraphSdl } = require('@graphql-tools/federation');

const serviceList = [
  { name: 'Users', url: 'http://localhost:4001' },
];

async function loggingMiddleware(resolve, root, args, context, info) {
  console.log('Arguments:', args);
  const result = await resolve(root, args, context, info);
  console.log('Result:', result);
  return result;
}

(async () => {
  const { supergraphSdl } = await new IntrospectAndCompose({
    subgraphs: serviceList,
  }).initialize({ getDataSource: s => new RemoteGraphQLDataSource(s) });

  const schema = getStitchedSchemaFromSupergraphSdl({
    supergraphSdl,
  });
  const server = new ApolloServer({
    schema: applyMiddleware(
      schema, {
      Query: loggingMiddleware,
    }),
  });

  server.listen(4000).then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
  });
})();
