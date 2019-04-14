if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const { prisma } = require('./generated/prisma-client');
const { ApolloServer, gql } = require('apollo-server');
const { importSchema } = require('graphql-import');

const resolvers = {
    Query: {
        users(root, args, context) {
            return context.prisma.users();
        },
    },
    Mutation: {
        createUser(root, args, context) {
            return context.prisma.createUser({
                name: args.name,
                email: args.email,
                password: args.password,
                admin: args.admin,
            });
        },
        createStudent(root, args, context) {
            return context.prisma.createStudent({
                name: args.name,
                email: args.email,
                mobile: args.mobile,
            });
        },
    },
};

const server = new ApolloServer({
    typeDefs: gql(importSchema('./schema.graphql')),
    resolvers,
    context: {
        prisma,
    },
    introspection: true,
});

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
    console.log(`🚀  Prisma ready at ${process.env.PRISMA_ENDPOINT}`);
});
