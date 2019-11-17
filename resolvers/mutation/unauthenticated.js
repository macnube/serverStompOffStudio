const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { toLower } = require('lodash');
const { getDate, getMonth, getYear } = require('date-fns');

const { sendEmail, resetPasswordText } = require('./utils');

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
    resetPassword: async (root, args, context) => {
        const email = toLower(args.email);
        const user = await context.prisma.user({ email });
        console.log('args are: ', args);
        if (!user) {
            throw new Error('Invalid Login');
        }

        const emailMatch = await bcrypt.compare(
            args.email,
            args.encryptedEmail
        );

        if (!emailMatch) {
            throw new Error('Invalid Login');
        }

        const today = new Date();
        const date = `${getMonth(today)}/${getDate(today)}/${getYear(today)}`;
        const dateMatch = await bcrypt.compare(date, args.encryptedDate);

        if (!dateMatch) {
            throw new Error('Invalid Login');
        }

        const hashedPassword = await bcrypt.hash(args.password, 10);

        const updatedUser = await context.prisma.updateUser({
            data: {
                password: hashedPassword,
            },
            where: { id: user.id },
        });

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
            user: updatedUser,
        };
    },
    sendResetEmail: async (root, args, context) => {
        const email = toLower(args.email);
        const user = await context.prisma.user({ email });
        if (!user) {
            throw new Error('Not current user');
        }
        const today = new Date();
        const date = `${getMonth(today)}/${getDate(today)}/${getYear(today)}`;
        console.log('date is: ', date);
        const encryptedEmail = await bcrypt.hash(email, 10);
        console.log('before');
        const encryptedDate = await bcrypt.hash(date, 10);
        console.log('here');
        sendEmail({
            tag: 'RESET_PASSWORD',
            to: [user.email],
            subject: 'Reset LS Portal Password ',
            text: resetPasswordText(email, encryptedEmail, encryptedDate),
        });

        return user;
    },
};

module.exports = unauthenticated;
