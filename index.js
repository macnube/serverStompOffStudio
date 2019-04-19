if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const { prisma } = require('./generated/prisma-client');
const { ApolloServer, gql } = require('apollo-server');
const { importSchema } = require('graphql-import');

const resolvers = {
    Query: {
        studios(root, args, context) {
            return context.prisma.studios();
        },
        studio(root, args, context) {
            return context.prisma.studio({
                id: args.id,
            });
        },
        roomsByStudio(root, args, context) {
            return context.prisma
                .studio({
                    id: args.studioId,
                })
                .rooms();
        },
        studioByRoom(root, args, context) {
            return context.prisma
                .room({
                    id: args.roomId,
                })
                .studio();
        },
    },
    Mutation: {
        createStudio(root, args, context) {
            return context.prisma.createStudio({
                name: args.name,
                address: args.address,
            });
        },
        deleteStudio(root, args, context) {
            return context.prisma.deleteStudio({
                id: args.id,
                name: args.name,
            });
        },
        createRoom(root, args, context) {
            return context.prisma.createRoom({
                name: args.name,
                capacity: args.capacity,
                studio: {
                    connect: { id: args.studioId },
                },
            });
        },
    },
    Studio: {
        rooms(root, args, context) {
            return context.prisma
                .studio({
                    id: root.id,
                })
                .rooms();
        },
    },
    Room: {
        studio(root, args, context) {
            return context.prisma
                .room({
                    id: root.id,
                })
                .studio();
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
