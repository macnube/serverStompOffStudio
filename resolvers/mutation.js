const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const FormData = require('form-data');
require('isomorphic-fetch');
const { map, includes, toLower, find } = require('lodash');
const { parse, endOfDay, isBefore, startOfDay } = require('date-fns');

const isValidDate = expirationDate => {
    const startOfToday = startOfDay(new Date());
    const parsedExpiration = parse(expirationDate);
    return isBefore(startOfToday, parsedExpiration);
};

const getCardActiveStatus = (value, expirationDate) =>
    value > 0 && isValidDate(expirationDate);

const unauthenticatedMutations = {
    login: async (root, args, context) => {
        const email = toLower(args.email);
        console.log('email is: ', email);
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

const studentMutations = {
    updateUserEmailPassword: async (root, args, context) => {
        const email = toLower(args.email);
        const user = {
            email,
        };
        if (args.password) {
            const hashedPassword = await bcrypt.hash(args.password, 10);
            user.password = hashedPassword;
        }
        return context.prisma.updateUser({
            data: user,
            where: { id: args.id },
        });
    },
    logCourseAbsence(root, args, context) {
        return context.prisma.createCourseAbsence({
            date: startOfDay(args.date),
            course: {
                connect: {
                    id: args.courseId,
                },
            },
            student: {
                connect: {
                    id: args.studentId,
                },
            },
        });
    },
    clearCourseAbsence(root, args, context) {
        return context.prisma.deleteCourseAbsence({
            id: args.id,
        });
    },
    logParticipantAbsence(root, args, context) {
        return context.prisma.updateParticipant({
            data: {
                status: 'ABSENT',
            },
            where: {
                id: args.id,
            },
        });
    },
    clearParticipantAbsence(root, args, context) {
        return context.prisma.updateParticipant({
            data: {
                status: 'NOT_LOGGED',
            },
            where: {
                id: args.id,
            },
        });
    },
};

const adminMutations = {
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
    createCourse(root, args, context) {
        return context.prisma.createCourse({
            name: args.name,
            description: args.description,
            startDate: args.startDate,
            startTime: args.startTime,
            duration: args.duration,
            studentLimit: args.studentLimit,
            room: {
                connect: { id: args.roomId },
            },
            day: args.day,
        });
    },
    updateCourse(root, args, context) {
        return context.prisma.updateCourse({
            data: {
                name: args.name,
                description: args.description,
                startDate: args.startDate,
                startTime: args.startTime,
                duration: args.duration,
                studentLimit: args.studentLimit,
                day: args.day,
            },
            where: { id: args.id },
        });
    },
    deleteCourse(root, args, context) {
        return context.prisma.deleteCourse({
            id: args.id,
        });
    },
    addTeacherToCourse(root, args, context) {
        return context.prisma.updateCourse({
            data: {
                teachers: {
                    connect: { id: args.teacherId },
                },
            },
            where: { id: args.id },
        });
    },
    removeTeacherFromCourse(root, args, context) {
        return context.prisma.updateCourse({
            data: {
                teachers: {
                    disconnect: { id: args.teacherId },
                },
            },
            where: { id: args.id },
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
    createMembership(root, args, context) {
        const membership = {
            student: {
                connect: {
                    id: args.studentId,
                },
            },
            course: {
                connect: {
                    id: args.courseId,
                },
            },
            role: args.role,
            status: args.status,
        };
        if (membership.status === 'WAITLIST') {
            membership.waitlistDate = new Date();
        }
        return context.prisma.createMembership(membership);
    },
    deleteMembership(root, args, context) {
        return context.prisma.deleteMembership({
            id: args.id,
        });
    },
    updateMembershipStatus(root, args, context) {
        const data = {
            status: args.status,
        };
        if (data.status === 'WAITLIST') {
            data.waitlistDate = new Date();
        }
        return context.prisma.updateMembership({
            data,
            where: {
                id: args.id,
            },
        });
    },
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
        console.log('activeNonExpiredCard is: ', activeNonExpiredCard);
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
        const newValue = card.value++;
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
    createCourseInstance: async (root, args, context) => {
        const absentStudents = await context.prisma
            .courseAbsences({
                where: {
                    AND: [
                        {
                            course: {
                                id: args.courseId,
                            },
                        },
                        {
                            date: startOfDay(args.date),
                        },
                    ],
                },
            })
            .student();
        const absentStudentIds = map(absentStudents, s => s.student.id);
        const memberships = await context.prisma.memberships({
            where: {
                course: {
                    id: args.courseId,
                },
            },
        });
        const absentMemberships = await context.prisma.memberships({
            where: {
                AND: [
                    {
                        course: {
                            id: args.courseId,
                        },
                    },
                    {
                        student: {
                            id_in: absentStudentIds,
                        },
                    },
                ],
            },
        });
        const absentMembershipIds = map(absentMemberships, m => m.id);
        const participantsCreate = args.membershipIds.map(id => {
            let result = {
                membership: {
                    connect: {
                        id,
                    },
                },
            };
            if (includes(absentMembershipIds, id)) {
                result.status = 'ABSENT';
            }
            return result;
        });
        return context.prisma.createCourseInstance({
            course: {
                connect: { id: args.courseId },
            },
            participants: {
                create: participantsCreate,
            },
            date: startOfDay(args.date),
        });
    },
    deleteCourseInstance(root, args, context) {
        return context.prisma.deleteCourseInstance({
            id: args.id,
        });
    },
    updateCourseInstance(root, args, context) {
        return context.prisma.updateCourseInstance({
            data: {
                topic: args.topic,
                notes: args.notes,
                recapUrl: args.recapUrl,
                date: startOfDay(args.date),
            },
            where: { id: args.id },
        });
    },
    addParticipantToCourseInstance(root, args, context) {
        return context.prisma.updateCourseInstance({
            where: { id: args.id },
            data: {
                participants: {
                    create: [
                        {
                            membership: {
                                connect: {
                                    id: args.membershipId,
                                },
                            },
                        },
                    ],
                },
            },
        });
    },
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
    sendMailgunEmail: async (root, args, context) => {
        if (!process.env['MAILGUN_API_KEY']) {
            console.log('Please provide a valid mailgun secret key!');
            return { error: 'Module not configured correctly.' };
        }

        if (!process.env['MAILGUN_DOMAIN']) {
            console.log('Please provide a valid mailgun domain!');
            return { error: 'Module not configured correctly.' };
        }
        try {
            const token = new Buffer.from(
                `api:${process.env['MAILGUN_API_KEY']}`
            ).toString('base64');
            const endpoint = `https://api.mailgun.net/v3/${
                process.env['MAILGUN_DOMAIN']
            }/messages`;

            const { tag, to, subject, text } = args;
            const f = args.from;
            const recipientVariables = args.recipientVariables || {};

            if (to.length > 1000) {
                return { error: `Can't batch more than 1000 emails!` };
            }

            const form = new FormData();
            form.append('from', f);

            console.log('to is: ', to);

            for (var i = 0; i < to.length; i++) {
                form.append('to', to[i]);
            }

            form.append('subject', subject);
            form.append('text', text);
            form.append(
                'recipient-variables',
                JSON.stringify(recipientVariables)
            );

            const data = await fetch(endpoint, {
                headers: {
                    Authorization: `Basic ${token}`,
                },
                method: 'POST',
                body: form,
            }).then(response => response.json());

            return { success: true };
        } catch (e) {
            console.log(`Email could not be sent because an error occured:`);
            console.log(e);
            return {
                error: 'An unexpected error occured while sending email.',
                success: false,
            };
        }
    },
};

module.exports = {
    studentMutations,
    adminMutations,
    unauthenticatedMutations,
    mutationResolvers: {
        ...studentMutations,
        ...adminMutations,
        ...unauthenticatedMutations,
    },
};
