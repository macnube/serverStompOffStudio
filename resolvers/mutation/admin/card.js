const { find, filter, map, forEach } = require('lodash');
const {
    parse,
    isBefore,
    startOfDay,
    subWeeks,
    addWeeks,
    subDays,
    addDays,
    getDay,
} = require('date-fns');

const { sendEmail, cardFinishedText, cardExpiredText } = require('../utils');

const isValidDate = expirationDate => {
    const startOfToday = startOfDay(new Date());
    const parsedExpiration = parse(expirationDate);
    return isBefore(startOfToday, parsedExpiration);
};

const getCardActiveStatus = (value, expirationDate) =>
    value > 0 && isValidDate(expirationDate);

const getPrivateLessonLength = value => {
    if (value >= 24) {
        return 45;
    } else if (value >= 16) {
        return 30;
    }
    return 0;
};

const getOpportunityWeekByActiveMemberships = memberships => {
    const opportunityWeek = {
        SUN: 0,
        MON: 0,
        TUE: 0,
        WED: 0,
        THU: 0,
        FRI: 0,
        SAT: 0,
    };
    forEach(memberships, m => {
        opportunityWeek[m.course.day]++;
    });
    return opportunityWeek;
};

const getFutureCancelledInstanceDatesByCourseIds = async (
    courseIds,
    startDate,
    context
) => {
    const instances = await context.prisma.courseInstances({
        where: {
            isCancelled: true,
            course: {
                id_in: courseIds,
            },
            date_gte: startOfDay(startDate),
        },
    });
    return map(instances, i => i.date);
};

const getActiveMembershipCoursesByCard = async (studentId, context) =>
    await context.prisma
        .memberships({
            where: {
                status: 'ACTIVE',
                student: {
                    id: studentId,
                },
            },
        })
        .course();

const getCardExpirationDate = async (studentId, startDate, context) => {
    const activeMemberships = await getActiveMembershipCoursesByCard(
        studentId,
        context
    );
    const opportunityWeek = getOpportunityWeekByActiveMemberships(
        activeMemberships
    );
    const courseIds = map(activeMemberships, m => m.course.id);
    const cancelledInstanceDates = await getFutureCancelledInstanceDatesByCourseIds(
        courseIds,
        startDate,
        context
    );
    let expirationDate = subDays(addWeeks(startDate, 10), 1);
    let opportunityDeficit = filter(cancelledInstanceDates, d =>
        isBefore(d, expirationDate)
    ).length;
    if (opportunityDeficit === 0) {
        return expirationDate;
    }
    const dayValueToDay = Object.keys(opportunityWeek);
    while (opportunityDeficit > 0) {
        expirationDate = addDays(expirationDate, 1);
        if (!cancelledInstanceDates.includes(expirationDate)) {
            const dayValue = getDay(expirationDate);
            opportunityDeficit -= opportunityWeek[dayValueToDay[dayValue]];
        }
    }
    return expirationDate;
};

const card = {
    createCard: async (root, args, context) => {
        const activeCards = await context.prisma.cards({
            where: {
                student: {
                    id: args.studentId,
                },
                active: true,
            },
        });
        const activeNonExpiredCard = find(activeCards, card =>
            isValidDate(card.expirationDate)
        );
        activeCards.forEach(async card => {
            if (!isValidDate(card.expirationDate)) {
                await context.prisma.updateCard({
                    data: {
                        active: false,
                    },
                    where: {
                        id: card.id,
                    },
                });
            }
        });

        if (activeNonExpiredCard) {
            throw new Error('Active card already exists');
        }
        return context.prisma.createCard({
            student: {
                connect: {
                    id: args.studentId,
                },
            },
            startDate: args.startDate,
            expirationDate: await getCardExpirationDate(
                args.studentId,
                args.startDate,
                context
            ),
            value: args.value,
            privateLessonLength: getPrivateLessonLength(args.value),
            originalValue: args.value,
        });
    },
    updateCard: async (root, args, context) => {
        const card = await context.prisma.card({ id: args.id });
        const data = {
            expirationDate: args.expirationDate,
            value: args.value,
            active: getCardActiveStatus(args.value, args.expirationDate),
        };
        if (card.privateLessonLength === 0 && args.privateLessonLength > 0) {
            data.privateLessonLength = args.privateLessonLength;
        }
        return context.prisma.updateCard({
            data,
            where: {
                id: args.id,
            },
        });
    },
    logCardParticipation: async (root, args, context) => {
        const card = await context.prisma.card({ id: args.id });
        const newValue = card.value - 1;
        if (newValue === 0) {
            const student = await context.prisma
                .card({
                    id: args.id,
                })
                .student();
            const memberships = await context.prisma
                .student({ id: student.id })
                .memberships();
            const numberOfCourses = filter(
                memberships,
                membership => membership.status === 'ACTIVE'
            ).length;
            sendEmail({
                tag: 'CARD_FINISHED',
                to: [student.email],
                subject:
                    'You just used your last class on your dance card! Please make a transfer to receive a new one',
                text: cardFinishedText(student.name, numberOfCourses),
            });
        }
        return context.prisma.updateCard({
            data: {
                participationHistory: {
                    connect: { id: args.participantId },
                },
                value: newValue,
                active: newValue === 0 ? false : true,
            },
            where: {
                id: args.id,
            },
        });
    },
    removeCardParticipation: async (root, args, context) => {
        const card = await context.prisma.card({ id: args.id });
        const newValue = ++card.value;
        await context.prisma.updateParticipant({
            data: {
                status: 'NOT_LOGGED',
            },
            where: { id: args.participantId },
        });
        return context.prisma.updateCard({
            data: {
                participationHistory: {
                    disconnect: [{ id: args.participantId }],
                },
                value: newValue,
                active: newValue > 0 && isValidDate(card.expirationDate),
            },
            where: {
                id: args.id,
            },
        });
    },
    deactivateCard(root, args, context) {
        return context.prisma.updateCard({
            data: {
                active: false,
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
    payCard(root, args, context) {
        return context.prisma.updateCard({
            data: {
                paid: true,
            },
            where: {
                id: args.id,
            },
        });
    },
    unpayCard(root, args, context) {
        return context.prisma.updateCard({
            data: {
                paid: false,
            },
            where: {
                id: args.id,
            },
        });
    },
    markPrivateLessonUsed(root, args, context) {
        return context.prisma.updateCard({
            data: {
                privateLessonUseDate: args.privateLessonUseDate,
            },
            where: {
                id: args.id,
            },
        });
    },
    expireOldCards: async (root, args, context) => {
        const now = new Date();
        let studentsWithOldCards = await context.prisma
            .cards({
                where: {
                    AND: [
                        {
                            active: true,
                        },
                        {
                            expirationDate_lt: now,
                        },
                    ],
                },
            })
            .student();
        studentsWithOldCards = map(studentsWithOldCards, s => s.student);
        if (studentsWithOldCards.length > 0) {
            forEach(studentsWithOldCards, async student => {
                const memberships = await context.prisma
                    .student({ id: student.id })
                    .memberships();
                const numberOfCourses = filter(
                    memberships,
                    membership => membership.status === 'ACTIVE'
                ).length;
                sendEmail({
                    tag: 'CARD_EXPIRED',
                    to: [student.email],
                    subject:
                        'Your card has expired this past week! Please make a transfer to purchase a new one before your next class',
                    text: cardExpiredText(student.name, numberOfCourses),
                });
            });
        }
        return context.prisma.updateManyCards({
            data: {
                active: false,
            },
            where: {
                AND: [
                    {
                        active: true,
                    },
                    {
                        expirationDate_lt: now,
                    },
                ],
            },
        });
    },
};

module.exports = { card, getCardExpirationDate };
