const bcrypt = require('bcryptjs');
const { toLower } = require('lodash');
const { startOfDay } = require('date-fns');

const student = {
    updateUserEmailPassword: async (root, args, context) => {
        const email = toLower(args.email);
        const user = {
            email,
        };
        if (args.password) {
            const hashedPassword = await bcrypt.hash(args.password, 10);
            user.password = hashedPassword;
        }
        return context.prisma.updateUser({
            data: user,
            where: { id: args.id },
        });
    },
    logCourseAbsence(root, args, context) {
        return context.prisma.createCourseAbsence({
            date: startOfDay(args.date),
            course: {
                connect: {
                    id: args.courseId,
                },
            },
            student: {
                connect: {
                    id: args.studentId,
                },
            },
        });
    },
    clearCourseAbsence(root, args, context) {
        return context.prisma.deleteCourseAbsence({
            id: args.id,
        });
    },
    logParticipantAbsence(root, args, context) {
        return context.prisma.updateParticipant({
            data: {
                status: 'ABSENT',
            },
            where: {
                id: args.id,
            },
        });
    },
    clearParticipantAbsence(root, args, context) {
        return context.prisma.updateParticipant({
            data: {
                status: 'NOT_LOGGED',
            },
            where: {
                id: args.id,
            },
        });
    },
};

module.exports = student;
