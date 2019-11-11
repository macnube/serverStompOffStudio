const { map, includes } = require('lodash');
const { startOfDay } = require('date-fns');

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
