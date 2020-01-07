const { map, includes, forEach, reduce } = require('lodash');
const {
    startOfDay,
    addDays,
    getDay,
    differenceInCalendarDays,
} = require('date-fns');

const { getCardExpirationDate } = require('./card');

const courseInstance = {
    createCourseInstance: async (root, args, context) => {
        const absentStudents = await context.prisma
            .courseAbsences({
                where: {
                    AND: [
                        {
                            course: {
                                id: args.courseId,
                            },
                        },
                        {
                            date: startOfDay(args.date),
                        },
                    ],
                },
            })
            .student();
        const absentStudentIds = map(absentStudents, s => s.student.id);
        const memberships = await context.prisma.memberships({
            where: {
                course: {
                    id: args.courseId,
                },
            },
        });
        const absentMemberships = await context.prisma.memberships({
            where: {
                AND: [
                    {
                        course: {
                            id: args.courseId,
                        },
                    },
                    {
                        student: {
                            id_in: absentStudentIds,
                        },
                    },
                ],
            },
        });
        const absentMembershipIds = map(absentMemberships, m => m.id);
        const participantsCreate = args.membershipIds.map(id => {
            let result = {
                membership: {
                    connect: {
                        id,
                    },
                },
            };
            if (includes(absentMembershipIds, id)) {
                result.status = 'ABSENT';
            }
            return result;
        });
        return context.prisma.createCourseInstance({
            course: {
                connect: { id: args.courseId },
            },
            participants: {
                create: participantsCreate,
            },
            date: startOfDay(args.date),
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
                date: startOfDay(args.date),
            },
            where: { id: args.id },
        });
    },
    cancelCourseInstance: async (root, args, context) => {
        const courseInstance = await context.prisma.courseInstance({
            id: args.id,
        });
        if (courseInstance.isCancelled) {
            return courseInstance;
        }
        const updatedCourseInstance = await context.prisma.updateCourseInstance(
            {
                data: {
                    isCancelled: true,
                },
                where: { id: args.id },
            }
        );
        const cards = await context.prisma.cards({
            where: {
                student: {
                    memberships_some: {
                        course: {
                            instances_some: {
                                id: args.id,
                            },
                        },
                    },
                },
                active: true,
                expirationDate_gte: startOfDay(courseInstance.date),
            },
        });
        forEach(cards, async card => {
            let startDate = card.startDate;
            const student = await context.prisma
                .card({
                    id: card.id,
                })
                .student();
            if (!startDate) {
                const instancesOnCard = await context.prisma
                    .card({
                        id: card.id,
                    })
                    .participationHistory()
                    .courseInstance();
                startDate = instancesOnCard[0].courseInstance.date;
            }
            const newExpirationDate = await getCardExpirationDate(
                student.id,
                startDate,
                context
            );
            await context.prisma.updateCard({
                data: {
                    expirationDate: newExpirationDate,
                },
                where: {
                    id: card.id,
                },
            });
        });
        return updatedCourseInstance;
    },
    addParticipantToCourseInstance(root, args, context) {
        return context.prisma.updateCourseInstance({
            where: { id: args.id },
            data: {
                participants: {
                    create: [
                        {
                            membership: {
                                connect: {
                                    id: args.membershipId,
                                },
                            },
                        },
                    ],
                },
            },
        });
    },
};

module.exports = courseInstance;
