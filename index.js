if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const { prisma } = require('./generated/prisma-client');
const { ApolloServer, gql } = require('apollo-server');
const { importSchema } = require('graphql-import');
const { subWeeks, addWeeks } = require('date-fns');

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
        students(root, args, context) {
            return context.prisma.students();
        },
        student(root, args, context) {
            return context.prisma.student({
                id: args.id,
            });
        },
        payments(root, args, context) {
            return context.prisma.payments();
        },
        courseInstance(root, args, context) {
            return context.prisma.courseInstance({
                id: args.id,
            });
        },
        courseStudentsByCourseInstance(root, args, context) {
            return context.prisma
                .courseInstance({
                    id: args.courseInstanceId,
                })
                .course()
                .courseStudents();
        },
        overviewInstances(root, args, context) {
            const now = new Date();
            return context.prisma.courseInstances({
                where: {
                    date_lte: addWeeks(now, 3),
                    date_gte: subWeeks(now, 3),
                },
                orderBy: 'date_DESC',
            });
        },
        activeCards(root, args, context) {
            return context.prisma.cards({
                where: {
                    active: true,
                },
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
        createStudent(root, args, context) {
            return context.prisma.createStudent({
                name: args.name,
                email: args.email,
                mobile: args.mobile,
            });
        },
        deleteStudent(root, args, context) {
            return context.prisma.deleteStudent({
                id: args.id,
            });
        },
        updateStudent(root, args, context) {
            return context.prisma.updateStudent({
                data: {
                    name: args.name,
                    email: args.email,
                    mobile: args.mobile,
                },
                where: {
                    id: args.id,
                },
            });
        },
        createCourseStudent(root, args, context) {
            return context.prisma.createCourseStudent({
                student: {
                    connect: {
                        id: args.studentId,
                    },
                },
                course: {
                    connect: {
                        id: args.courseId,
                    },
                },
                role: args.role,
            });
        },
        deleteCourseStudent(root, args, context) {
            return context.prisma.deleteCourseStudent({
                id: args.id,
            });
        },
        createCard(root, args, context) {
            return context.prisma.createCard({
                student: {
                    connect: {
                        id: args.studentId,
                    },
                },
                expirationDate: args.expirationDate,
                validCount: args.validCount,
            });
        },
        updateCard(root, args, context) {
            return context.prisma.updateCard({
                data: {
                    expirationDate: args.expirationDate,
                    validCount: args.validCount,
                },
                where: {
                    id: args.id,
                },
            });
        },
        deleteCard(root, args, context) {
            return context.prisma.deleteCard({
                id: args.id,
            });
        },
        createPayment(root, args, context) {
            return context.prisma.createPayment({
                student: {
                    connect: {
                        id: args.studentId,
                    },
                },
                card: {
                    connect: {
                        id: args.cardId,
                    },
                },
                type: args.type,
                amount: args.amount,
                date: args.date,
            });
        },
        updatePayment(root, args, context) {
            return context.prisma.updatePayment({
                data: {
                    student: {
                        connect: {
                            id: args.studentId,
                        },
                    },
                    card: {
                        connect: {
                            id: args.cardId,
                        },
                    },
                    type: args.type,
                    amount: args.amount,
                    date: args.date,
                },
                where: {
                    id: args.id,
                },
            });
        },
        deletePayment(root, args, context) {
            return context.prisma.deletePayment({
                id: args.id,
            });
        },
        createCourseInstance(root, args, context) {
            return context.prisma.createCourseInstance({
                course: {
                    connect: { id: args.courseId },
                },
                topic: args.topic,
                notes: args.notes,
                recapUrl: args.recapUrl,
                date: args.date,
            });
        },
        deleteCourseInstance(root, args, context) {
            return context.prisma.deleteCourseInstance({
                id: args.id,
            });
        },
        updateCourseInstance(root, args, context) {
            return context.prisma.updateCourseInstance({
                data: {
                    topic: args.topic,
                    notes: args.notes,
                    recapUrl: args.recapUrl,
                    date: args.date,
                },
                where: { id: args.id },
            });
        },
        deleteParticipant(root, args, context) {
            return context.prisma.deleteParticipant({
                id: args.id,
            });
        },
        createParticipant(root, args, context) {
            return context.prisma.createParticipant({
                courseStudent: {
                    connect: {
                        id: args.courseStudentId,
                    },
                },
                courseInstance: {
                    connect: {
                        id: args.courseInstanceId,
                    },
                },
                status: args.status,
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
        courseStudents(root, args, context) {
            return context.prisma
                .course({
                    id: root.id,
                })
                .courseStudents();
        },
        instances(root, args, context) {
            return context.prisma
                .course({
                    id: root.id,
                })
                .instances({
                    orderBy: 'date_DESC',
                });
        },
    },
    Student: {
        courses(root, args, context) {
            return context.prisma
                .student({
                    id: root.id,
                })
                .courses();
        },
        cards(root, args, context) {
            return context.prisma
                .student({
                    id: root.id,
                })
                .cards();
        },
        payments(root, args, context) {
            return context.prisma
                .student({
                    id: root.id,
                })
                .payments();
        },
    },
    CourseStudent: {
        course(root, args, context) {
            return context.prisma
                .courseStudent({
                    id: root.id,
                })
                .course();
        },
        student(root, args, context) {
            return context.prisma
                .courseStudent({
                    id: root.id,
                })
                .student();
        },
    },
    Payment: {
        card(root, args, context) {
            return context.prisma
                .payment({
                    id: root.id,
                })
                .card();
        },
        student(root, args, context) {
            return context.prisma
                .payment({
                    id: root.id,
                })
                .student();
        },
    },
    Card: {
        payment(root, args, context) {
            return context.prisma
                .card({
                    id: root.id,
                })
                .payment();
        },
    },
    CourseInstance: {
        course(root, args, context) {
            return context.prisma
                .courseInstance({
                    id: root.id,
                })
                .course();
        },
        participants(root, args, context) {
            return context.prisma
                .courseInstance({
                    id: root.id,
                })
                .participants();
        },
    },
    Participant: {
        courseStudent(root, args, context) {
            return context.prisma
                .participant({
                    id: root.id,
                })
                .courseStudent();
        },
        courseInstance(root, args, context) {
            return context.prisma
                .participant({
                    id: root.id,
                })
                .courseInstance();
        },
    },
    Teacher: {
        courses(root, args, context) {
            return context.prisma
                .teacher({
                    id: root.id,
                })
                .courses();
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
