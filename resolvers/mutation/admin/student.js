const bcrypt = require('bcryptjs');
const { toLower, reduce, forEach, filter } = require('lodash');

const { sendEmail, cardOverdueText } = require('../utils');

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
    notifyPastDueStudents: async (root, args, context) => {
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
        const pastDueStudents = await context.prisma.students({
            where: {
                cards_some: {
                    id_in: unpaidForTwoWeeks,
                },
            },
        });
        if (pastDueStudents.length > 0) {
            forEach(pastDueStudents, async student => {
                const memberships = await context.prisma
                    .student({ id: student.id })
                    .memberships();
                const numberOfCourses = filter(
                    memberships,
                    membership => membership.status === 'ACTIVE'
                ).length;
                sendEmail({
                    tag: 'CARD_PAST_DUE',
                    to: [student.email],
                    subject:
                        'Friendly reminder that your card payment is overdue. Please make a transfer before your next class.',
                    text: cardOverdueText(student.name, numberOfCourses),
                });
            });
        }
        return { count: pastDueStudents.length };
    },
};

module.exports = student;
