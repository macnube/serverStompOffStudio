const { subWeeks, addWeeks, startOfDay } = require('date-fns');
const { AuthenticationError } = require('apollo-server');
const { map, reduce } = require('lodash');

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
    studentCards(root, args, context) {
        return context.prisma.cards({
            where: {
                student: {
                    id: args.id,
                },
            },
        });
    },
    course(root, args, context) {
        return context.prisma.course({
            id: args.id,
        });
    },
    studentsWithPastDueCards: async (root, args, context) => {
        const unpaidCards = await context.prisma.cards({
            where: {
                paid: false,
                active: true,
            },
        });
        const unpaidForTwoWeeks = reduce(
            unpaidCards,
            (result, card) => {
                if (card.originalValue - card.value > 2) {
                    result.push(card.id);
                    return result;
                }
                return result;
            },
            []
        );
        return context.prisma.students({
            where: {
                cards_some: {
                    id_in: unpaidForTwoWeeks,
                },
            },
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
    coursesByStudent(root, args, context) {
        return context.prisma.courses({
            where: {
                memberships_some: {
                    student: { id: args.id },
                },
            },
        });
    },
    upcomingAbsencesByStudent(root, args, context) {
        const startOfToday = startOfDay(new Date());
        return context.prisma.courseAbsences({
            where: {
                date_gte: startOfToday,
                student: { id: args.id },
            },
            orderBy: 'date_ASC',
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
        return context.prisma.students({ orderBy: 'name_ASC' });
    },
    payments(root, args, context) {
        return context.prisma.payments({ orderBy: 'date_DESC' });
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
    oldCards(root, args, context) {
        const now = new Date();
        return context.prisma.cards({
            where: {
                AND: [
                    { active: true },
                    {
                        expirationDate_lte: now,
                    },
                ],
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
