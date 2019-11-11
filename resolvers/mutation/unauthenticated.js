const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { toLower } = require('lodash');

const unauthenticated = {
    login: async (root, args, context) => {
        const email = toLower(args.email);
        const user = await context.prisma.user({ email });

        if (!user) {
            throw new Error('Invalid Login');
        }

        const passwordMatch = await bcrypt.compare(
            args.password,
            user.password
        );

        if (!passwordMatch) {
            throw new Error('Invalid Login');
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
            },
            process.env.TOKEN_SECRET,
            {
                expiresIn: '30d', // token will expire in 30days
            }
        );

        return {
            token,
            user,
        };
    },
};

module.exports = unauthenticated;
