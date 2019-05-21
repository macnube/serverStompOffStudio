if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('./generated/prisma-client');
const { ApolloServer, gql, AuthenticationError } = require('apollo-server');
const { importSchema } = require('graphql-import');
const { applyMiddleware } = require('graphql-middleware');
const { makeExecutableSchema } = require('graphql-tools');
const {
    queryResolvers,
    mutationResolvers,
    typeResolvers,
} = require('./resolvers');
const { permissions } = require('./permissions');

const getUser = async (token, prisma) => {
    try {
        if (token) {
            const tokenUser = jwt.verify(token, 'stomp-off-studio-secret');
            return await prisma.user({ id: tokenUser.id });
        }
        return null;
    } catch (err) {
        return null;
    }
};

const resolvers = {
    Query: queryResolvers,
    Mutation: mutationResolvers,
    ...typeResolvers,
};

console.log('permissions are: ', permissions);

const schema = applyMiddleware(
    makeExecutableSchema({
        typeDefs: gql(importSchema('./schema.graphql')),
        resolvers,
    }),
    permissions
);

const server = new ApolloServer({
    schema,
    context: async ({ req }) => {
        const token = req.headers.authorization || '';
        const user = await getUser(token, prisma);
        console.log('user is: ', user);
        return { user, prisma };
    },
    introspection: true,
});

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
    console.log(`🚀  Prisma ready at ${process.env.PRISMA_ENDPOINT}`);
});
