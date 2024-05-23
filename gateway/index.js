const { ApolloServer } = require('apollo-server');
const { ApolloGateway, IntrospectAndCompose } = require('@apollo/gateway');
const { applyMiddleware } = require('graphql-middleware');

const serviceList = [
  { name: 'Users', url: 'http://localhost:4001' },
];



const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: serviceList,
  })
});

async function loggingMiddleware(resolve, root, args, context, info) {
  console.log('Arguments:', args);
  const result = await resolve(root, args, context, info);
  console.log('Result:', result);
  return result;
}

(async () => {
  const { schema, executor } = await gateway.load();

  const server = new ApolloServer({
    schema: applyMiddleware(schema, {
      Query: loggingMiddleware,
    }),
    executor,
  });

  server.listen(4000).then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
  });
})();
