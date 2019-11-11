const studio = {
    createStudio(root, args, context) {
        return context.prisma.createStudio({
            name: args.name,
            address: args.address,
        });
    },
    updateStudio(root, args, context) {
        return context.prisma.updateStudio({
            data: { name: args.name, address: args.address },
            where: { id: args.id },
        });
    },
    deleteStudio(root, args, context) {
        return context.prisma.deleteStudio({
            id: args.id,
        });
    },
};

module.exports = studio;
