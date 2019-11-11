const card = require('./card');
const course = require('./course');
const courseInstance = require('./courseInstance');
const mailgun = require('./mailgun');
const membership = require('./membership');
const participant = require('./participant');
const payment = require('./payment');
const room = require('./room');
const student = require('./student');
const studio = require('./studio');
const teacher = require('./teacher');
const user = require('./user');

module.exports = {
    ...card,
    ...course,
    ...courseInstance,
    ...mailgun,
    ...membership,
    ...participant,
    ...payment,
    ...room,
    ...student,
    ...studio,
    ...teacher,
    ...user,
};
