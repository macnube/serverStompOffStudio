const room = {
    createRoom(root, args, context) {
        return context.prisma.createRoom({
            name: args.name,
            capacity: args.capacity,
            studio: {
                connect: { id: args.studioId },
            },
        });
    },
    deleteRoom(root, args, context) {
        return context.prisma.deleteRoom({
            id: args.id,
        });
    },
    updateRoom(root, args, context) {
        return context.prisma.updateRoom({
            data: { name: args.name, capacity: args.capacity },
            where: { id: args.id },
        });
    },
};

module.exports = room;
