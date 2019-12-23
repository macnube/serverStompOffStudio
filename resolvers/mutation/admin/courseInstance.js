const { map, includes, forEach, reduce } = require('lodash');
const { startOfDay, addDays, getDay } = require('date-fns');

const dayOfWeek = {
    MON: 1,
    TUE: 2,
    WED: 3,
    THU: 4,
    FRI: 5,
    SAT: 6,
    SUN: 7,
};

const getNextCardExpirationDate = async (card, context) => {
    const student = await context.prisma.card({ id: card.id }).student();
    const activeMemberships = await context.prisma
        .memberships({
            where: {
                status: 'ACTIVE',
                student: {
                    cards_some: {
                        id: card.id,
                    },
                },
            },
        })
        .course();
    if (activeMemberships.length === 1) {
        return addDays(card.expirationDate, 7);
    }
    const currentDayValue = getDay(card.expirationDate);
    const dateDifference = reduce(
        activeMemberships,
        (result, membership) => {
            const dayValue = dayOfWeek[membership.course.day];
            let difference;
            if (dayValue >= currentDayValue) {
                difference = dayValue - currentDayValue;
            } else {
                difference = 7 - dayValue;
            }
            if (difference < result && difference > 0) {
                return difference;
            }
            return result;
        },
        7
    );
    return addDays(card.expirationDate, dateDifference);
};

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
            },
        });
        forEach(cards, async card => {
            if (courseInstance.date <= card.expirationDate) {
                const newExpirationDate = await getNextCardExpirationDate(
                    card,
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
            }
        });
        return context.prisma.updateCourseInstance({
            data: {
                isCancelled: true,
            },
            where: { id: args.id },
        });
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
