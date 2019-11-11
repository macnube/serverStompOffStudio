const admin = require('./admin');
const student = require('./student');
const unauthenticated = require('./unauthenticated');

module.exports = {
    ...admin,
    ...student,
    ...unauthenticated,
};
