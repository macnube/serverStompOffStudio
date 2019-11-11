require('isomorphic-fetch');
const FormData = require('form-data');

const { sendEmail } = require('../utils');

const mailgun = {
    sendMailgunEmail: async (root, args, context) => {
        return sendEmail(args);
    },
};

module.exports = mailgun;
