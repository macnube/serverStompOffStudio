const { queryResolvers } = require('./query');
const mutationResolvers = require('./mutation');
const { typeResolvers } = require('./type');

module.exports = {
    queryResolvers,
    mutationResolvers,
    typeResolvers,
};
