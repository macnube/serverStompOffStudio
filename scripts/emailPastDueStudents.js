require('dotenv').config({
    path: require('path').resolve(__dirname, '../.env'),
});
const axios = require('axios');
const gql = require('graphql-tag');
const { print } = require('graphql');
const { get, map } = require('lodash');

const pastDueStudents = gql`
    mutation NotifyPastDueStudents {
        notifyPastDueStudents {
            count
        }
    }
`;

const loginMutation = gql`
    mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
            token
        }
    }
`;

const loginPayload = {
    operationName: 'Login',
    query: print(loginMutation),
    variables: {
        email: 'admin@mccloud.io',
        password: process.env.PORTAL_ADMIN_PASSWORD,
    },
};

const loginConfig = {
    method: 'post',
    url: 'http://localhost:4000',
    data: loginPayload,
};

const pastDuePayload = {
    operationName: 'NotifyPastDueStudents',
    query: print(pastDueStudents),
};

let token = null;

axios(loginConfig)
    .then(response => {
        token = get(response, 'data.data.login.token');
        const config = {
            method: 'post',
            url: 'http://localhost:4000',
            data: pastDuePayload,
            headers: {
                Authorization: token,
            },
        };
        return axios(config);
    })
    .then(response => {
        console.log(
            'emails sent are: ',
            response.data.data.notifyPastDueStudents.count
        );
    })
    .catch(error => {
        console.log('error is: ', error);
    });
