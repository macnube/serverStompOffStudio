const bcrypt = require('bcryptjs');
const { toLower } = require('lodash');

const user = {
    createUser: async (root, args, context) => {
        const email = toLower(args.email);
        const hashedPassword = await bcrypt.hash(args.password, 10);
        const user = {
            email,
            password: hashedPassword,
        };
        if (args.studentId) {
            user.student = {
                connect: {
                    id: args.studentId,
                },
            };
        }
        return context.prisma.createUser(user);
    },
    deleteUser(root, args, context) {
        return context.prisma.deleteUser({
            id: args.id,
        });
    },
    toggleUserAdminStatus: async (root, args, context) => {
        const user = await context.prisma.user({ id: args.id });

        return context.prisma.updateUser({
            data: {
                admin: !user.admin,
            },
            where: { id: args.id },
        });
    },
};

module.exports = user;
