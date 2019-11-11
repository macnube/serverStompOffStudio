const partcipant = {
    deleteParticipant(root, args, context) {
        return context.prisma.deleteParticipant({
            id: args.id,
        });
    },
    logParticipantStatus(root, args, context) {
        return context.prisma.updateParticipant({
            where: { id: args.id },
            data: { status: args.status },
        });
    },
};

module.exports = partcipant;
