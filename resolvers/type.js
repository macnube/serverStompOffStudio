const typeResolvers = {
    Studio: {
        rooms(root, args, context) {
            return context.prisma
                .studio({
                    id: root.id,
                })
                .rooms();
        },
    },
    Room: {
        studio(root, args, context) {
            return context.prisma
                .room({
                    id: root.id,
                })
                .studio();
        },
    },
    Course: {
        room(root, args, context) {
            return context.prisma
                .course({
                    id: root.id,
                })
                .room();
        },
        teachers(root, args, context) {
            return context.prisma
                .course({
                    id: root.id,
                })
                .teachers();
        },
        memberships(root, args, context) {
            return context.prisma
                .course({
                    id: root.id,
                })
                .memberships();
        },
        instances(root, args, context) {
            return context.prisma
                .course({
                    id: root.id,
                })
                .instances({
                    orderBy: 'date_DESC',
                });
        },
    },
    Student: {
        memberships(root, args, context) {
            return context.prisma
                .student({
                    id: root.id,
                })
                .memberships();
        },
        cards(root, args, context) {
            return context.prisma
                .student({
                    id: root.id,
                })
                .cards();
        },
        payments(root, args, context) {
            return context.prisma
                .student({
                    id: root.id,
                })
                .payments();
        },
        user(root, args, context) {
            return context.prisma
                .student({
                    id: root.id,
                })
                .user();
        },
    },
    Membership: {
        course(root, args, context) {
            return context.prisma
                .membership({
                    id: root.id,
                })
                .course();
        },
        student(root, args, context) {
            return context.prisma
                .membership({
                    id: root.id,
                })
                .student();
        },
    },
    Payment: {
        card(root, args, context) {
            return context.prisma
                .payment({
                    id: root.id,
                })
                .card();
        },
        student(root, args, context) {
            return context.prisma
                .payment({
                    id: root.id,
                })
                .student();
        },
    },
    Card: {
        payment(root, args, context) {
            return context.prisma
                .card({
                    id: root.id,
                })
                .payment();
        },
        student(root, args, context) {
            return context.prisma
                .card({
                    id: root.id,
                })
                .student();
        },
        participationHistory(root, args, context) {
            return context.prisma.card({ id: root.id }).participationHistory();
        },
    },
    CourseInstance: {
        course(root, args, context) {
            return context.prisma
                .courseInstance({
                    id: root.id,
                })
                .course();
        },
        participants(root, args, context) {
            return context.prisma
                .courseInstance({
                    id: root.id,
                })
                .participants();
        },
    },
    Participant: {
        student(root, args, context) {
            return context.prisma
                .participant({
                    id: root.id,
                })
                .student();
        },
        courseInstance(root, args, context) {
            return context.prisma
                .participant({
                    id: root.id,
                })
                .courseInstance();
        },
    },
    Teacher: {
        courses(root, args, context) {
            return context.prisma
                .teacher({
                    id: root.id,
                })
                .courses();
        },
    },
    User: {
        student(root, args, context) {
            return context.prisma
                .user({
                    id: root.id,
                })
                .student();
        },
    },
};

module.exports = {
    typeResolvers,
};
