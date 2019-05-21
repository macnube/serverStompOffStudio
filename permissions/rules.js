const { rule, and, or, not } = require('graphql-shield');
const { isNil } = require('lodash');

const isStudent = rule()(async (parent, args, ctx, info) => {
    return !isNil(ctx.user.id);
});

const isAdmin = rule()(async (parent, args, ctx, info) => {
    return ctx.user && ctx.user.admin;
});

const isAuthenticated = or(isStudent, isAdmin);

const isUnauthenticated = rule()(async (parent, args, ctx, info) => {
    return true;
});

module.exports = {
    isAdmin,
    isStudent,
    isAuthenticated,
    isUnauthenticated,
};
