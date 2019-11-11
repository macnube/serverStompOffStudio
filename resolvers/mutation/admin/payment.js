const { startOfDay } = require('date-fns');

const payment = {
    createPayment(root, args, context) {
        const payment = {
            student: {
                connect: {
                    id: args.studentId,
                },
            },
            type: args.type,
            amount: args.amount,
            date: startOfDay(args.date),
        };
        if (args.cardId) {
            payment.card = {
                connect: {
                    id: args.cardId,
                },
            };
        }
        return context.prisma.createPayment(payment);
    },
    updatePayment(root, args, context) {
        const payment = {
            student: {
                connect: {
                    id: args.studentId,
                },
            },
            type: args.type,
            amount: args.amount,
            date: startOfDay(args.date),
        };
        if (args.cardId) {
            payment.card = {
                connect: {
                    id: args.cardId,
                },
            };
        }
        return context.prisma.updatePayment({
            data: payment,
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
};

module.exports = payment;
