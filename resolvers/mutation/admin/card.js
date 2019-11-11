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
                console.log('here with card', card);
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
            expirationDate: args.expirationDate,
            value: args.value,
            originalValue: args.value,
        });
    },
    updateCard(root, args, context) {
        return context.prisma.updateCard({
            data: {
                expirationDate: args.expirationDate,
                value: args.value,
                active: getCardActiveStatus(args.value, args.expirationDate),
            },
            where: {
                id: args.id,
            },
        });
    },
    logCardParticipation: async (root, args, context) => {
        const card = await context.prisma.card({ id: args.id });
        const newValue = card.value - 1;
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
    expireOldCards(root, args, context) {
        const now = new Date();
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

module.exports = card;
