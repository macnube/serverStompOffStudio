const { subWeeks, addWeeks } = require('date-fns');
const { AuthenticationError } = require('apollo-server');
const { map } = require('lodash');

const studentQueries = {
    currentUser: (parent, args, { user, prisma }) => {
        // this if statement is our authentication check
        if (!user) {
            throw new AuthenticationError('Not Authenticated');
        }
        return prisma.user({ id: user.id });
    },
    student(root, args, context) {
        return context.prisma.student({
            id: args.id,
        });
    },
    courseInstance(root, args, context) {
        return context.prisma.courseInstance({
            id: args.id,
        });
    },
    card(root, args, context) {
        return context.prisma.card({
            id: args.id,
        });
    },
    course(root, args, context) {
        return context.prisma.course({
            id: args.id,
        });
    },
    unpaidCardsByStudent(root, args, context) {
        return context.prisma.cards({
            where: {
                paid: false,
                student: {
                    id: args.id,
                },
            },
        });
    },
    instancesByStudent(root, args, context) {
        const now = new Date();
        return context.prisma.courseInstances({
            where: {
                participants_some: {
                    membership: {
                        student: { id: args.id },
                    },
                },
                date_lte: addWeeks(now, 3),
                date_gte: subWeeks(now, 3),
            },
            orderBy: 'date_DESC',
        });
    },
    getParticipantByStudent(root, args, context) {
        return context.prisma.participant({
            where: {
                student: {
                    where: {
                        id: args.id,
                    },
                },
            },
        });
    },
};

const adminQueries = {
    users(root, args, context) {
        return context.prisma.users();
    },
    courses(root, args, context) {
        return context.prisma.courses();
    },
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
    students(root, args, context) {
        return context.prisma.students();
    },
    payments(root, args, context) {
        return context.prisma.payments();
    },
    membershipsByCourseInstance(root, args, context) {
        return context.prisma
            .courseInstance({
                id: args.courseInstanceId,
            })
            .course()
            .memberships({
                where: {
                    status: 'ACTIVE',
                },
            });
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
    unpaidCards(root, args, context) {
        return context.prisma.cards({
            where: {
                paid: false,
            },
        });
    },
    unlinkedCardPayments(root, args, context) {
        return context.prisma.payments({
            where: {
                type: 'CARD',
                card: null,
            },
        });
    },
};

module.exports = {
    studentQueries,
    adminQueries,
    queryResolvers: { ...studentQueries, ...adminQueries },
};
