if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const { prisma } = require('./generated/prisma-client');
const { ApolloServer, gql } = require('apollo-server');
const { importSchema } = require('graphql-import');

const resolvers = {
    Query: {
        teachers(root, args, context) {
            return context.prisma.teachers();
        },
        studios(root, args, context) {
            return context.prisma.studios();
        },
        studio(root, args, context) {
            return context.prisma.studio({
                id: args.id,
            });
        },
        room(root, args, context) {
            return context.prisma.room({
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
        courses(root, args, context) {
            return context.prisma.courses();
        },
        course(root, args, context) {
            return context.prisma.course({
                id: args.id,
            });
        },
    },
    Mutation: {
        createTeacher(root, args, context) {
            return context.prisma.createTeacher({
                name: args.name,
                email: args.email,
                mobile: args.mobile,
            });
        },
        deleteTeacher(root, args, context) {
            return context.prisma.deleteTeacher({
                id: args.id,
            });
        },
        //To-do: figure out how to batch add classes to update teeacher
        updateTeacher(root, args, context) {
            return context.prisma.updateTeacher({
                data: {
                    name: args.name,
                    email: args.email,
                    mobile: args.mobile,
                },
                where: { id: args.id },
            });
        },
        createStudio(root, args, context) {
            return context.prisma.createStudio({
                name: args.name,
                address: args.address,
            });
        },
        updateStudio(root, args, context) {
            return context.prisma.updateStudio({
                data: { name: args.name, address: args.address },
                where: { id: args.id },
            });
        },
        deleteStudio(root, args, context) {
            return context.prisma.deleteStudio({
                id: args.id,
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
        deleteRoom(root, args, context) {
            return context.prisma.deleteRoom({
                id: args.id,
            });
        },
        updateRoom(root, args, context) {
            return context.prisma.updateRoom({
                data: { name: args.name, capacity: args.capacity },
                where: { id: args.id },
            });
        },
        createCourse(root, args, context) {
            return context.prisma.createCourse({
                name: args.name,
                description: args.description,
                startDate: args.startDate,
                startTime: args.startTime,
                duration: args.duration,
                studentLimit: args.studentLimit,
                room: {
                    connect: { id: args.roomId },
                },
            });
        },
        updateCourse(root, args, context) {
            return context.prisma.updateCourse({
                data: {
                    name: args.name,
                    description: args.description,
                    startDate: args.startDate,
                    startTime: args.startTime,
                    duration: args.duration,
                    studentLimit: args.studentLimit,
                    room: {
                        connect: { id: args.roomId },
                    },
                },
                where: { id: args.id },
            });
        },
        deleteCourse(root, args, context) {
            return context.prisma.deleteCourse({
                id: args.id,
            });
        },
        addTeacherToCourse(root, args, context) {
            return context.prisma.updateCourse({
                data: {
                    teachers: {
                        connect: { id: args.teacherId },
                    },
                },
                where: { id: args.id },
            });
        },
        removeTeacherFromCourse(root, args, context) {
            return context.prisma.updateCourse({
                data: {
                    teachers: {
                        disconnect: { id: args.teacherId },
                    },
                },
                where: { id: args.id },
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
    Course: {
        room(root, args, context) {
            return context.prisma
                .course({
                    id: root.id,
                })
                .room();
        },
        teachers(root, args, context) {
            return context.prisma
                .course({
                    id: root.id,
                })
                .teachers();
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
