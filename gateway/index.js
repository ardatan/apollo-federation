const { ApolloServer } = require('apollo-server');
const { ApolloGateway, IntrospectAndCompose } = require('@apollo/gateway');
const { applyMiddleware } = require('graphql-middleware');
const { wrapSchema } = require('@graphql-tools/wrap');
const { print, getOperationAST, printSchema } = require('graphql');

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

  const schemaHash = printSchema(schema);
  const server = new ApolloServer({
    schema: applyMiddleware(
      // We create a schema that creates proxy resolvers from the executor,
      // so you can wrap resolvers with graphql-middleware
      wrapSchema({
        schema,
        executor: executionRequest => {
          const operation = getOperationAST(executionRequest.document, executionRequest.operationName);
          const queryStr = print(executionRequest.document);
          const operationName = operation?.name?.value || "";
          return executor({
            request: {
              query: queryStr,
              variables: executionRequest.variables || {},
              operationName,
              extensions: executionRequest.extensions,
              http: {
                method: executionRequest.context?.req?.method,
                url: executionRequest.context?.req?.url,
                headers: new Headers(executionRequest.context?.req?.headers),
              },
            },
            schema,
            schemaHash,
            context: executionRequest.context || {},
            queryHash: queryStr,
            document: executionRequest.document,
            source: queryStr,
            operationName,
            operation,
          });
        },
        batch: true,
      }),{
      Query: loggingMiddleware,
    }),
    context: ctx => ctx,
  });

  server.listen(4000).then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
  });
})();
