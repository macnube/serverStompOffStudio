const membership = {
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
};

module.exports = membership;
