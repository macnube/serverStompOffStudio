const { shield, and } = require('graphql-shield');
const { mapValues } = require('lodash');
const { isAdmin, isAuthenticated, isUnauthenticated } = require('./rules');
const { studentQueries, adminQueries } = require('../resolvers/query');
const {
    unauthenticatedMutations,
    studentMutations,
    adminMutations,
} = require('../resolvers/mutation');

const authenticatedQueryRules = mapValues(
    studentQueries,
    () => isAuthenticated
);
const authenticatedMutationRules = mapValues(
    studentMutations,
    () => isAuthenticated
);
const adminQueryRules = mapValues(adminQueries, () => isAdmin);
const adminMutationRules = mapValues(adminMutations, () => isAdmin);
const unauthenticatedMutationRules = mapValues(
    unauthenticatedMutations,
    () => isUnauthenticated
);

const permissions = shield({
    Query: {
        ...authenticatedQueryRules,
        ...adminQueryRules,
    },
    Mutation: {
        ...authenticatedMutationRules,
        ...adminMutationRules,
        ...unauthenticatedMutationRules,
    },
});

module.exports = {
    permissions,
};
