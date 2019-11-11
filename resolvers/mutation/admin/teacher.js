const teacher = {
    createTeacher(root, args, context) {
        return context.prisma.createTeacher({
            name: args.name,
            email: args.email,
            mobile: args.mobile,
            user: {
                create: {
                    email: args.email,
                    password: args.email,
                    admin: true,
                },
            },
        });
    },
    deleteTeacher(root, args, context) {
        return context.prisma.deleteTeacher({
            id: args.id,
        });
    },
    //To-do: figure out how to batch add classes to update teeacher
    updateTeacher(root, args, context) {
        return context.prisma.updateTeacher({
            data: {
                name: args.name,
                email: args.email,
                mobile: args.mobile,
            },
            where: { id: args.id },
        });
    },
};

module.exports = teacher;
