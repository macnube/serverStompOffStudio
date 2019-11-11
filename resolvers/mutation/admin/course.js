const course = {
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
};

module.exports = course;
