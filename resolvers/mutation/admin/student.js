const bcrypt = require('bcryptjs');
const { toLower } = require('lodash');

const student = {
    importStudent: async (root, args, context) => {
        const email = toLower(args.email);
        const student = await context.prisma.student({ email });
        const membership = {
            course: {
                connect: {
                    id: args.courseId,
                },
            },
            role: args.role,
            status: 'WAITLIST',
            waitlistDate: args.waitlistDate,
        };
        if (student) {
            return context.prisma.updateStudent({
                data: {
                    memberships: {
                        create: [membership],
                    },
                },
                where: {
                    id: student.id,
                },
            });
        }
        const hashedPassword = await bcrypt.hash(email, 10);
        return context.prisma.createStudent({
            name: args.name,
            email: email,
            mobile: args.mobile,
            memberships: {
                create: [membership],
            },
            user: {
                create: {
                    email: email,
                    password: hashedPassword,
                    admin: false,
                },
            },
        });
    },
    createStudent: async (root, args, context) => {
        const email = toLower(args.email);
        const hashedPassword = await bcrypt.hash(email, 10);
        return context.prisma.createStudent({
            name: args.name,
            email: email,
            mobile: args.mobile,
            user: {
                create: {
                    email: email,
                    password: hashedPassword,
                    admin: false,
                },
            },
        });
    },
    updateStudent(root, args, context) {
        return context.prisma.updateStudent({
            data: {
                name: args.name,
                email: args.email,
                mobile: args.mobile,
                hasReferralBonus: args.hasReferralBonus,
            },
            where: {
                id: args.id,
            },
        });
    },
    deleteStudent(root, args, context) {
        return context.prisma.deleteStudent({
            id: args.id,
        });
    },
};

module.exports = student;
