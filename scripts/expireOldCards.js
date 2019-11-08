require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env'),
});
const axios = require('axios');
const gql = require('graphql-tag');
const { print } = require('graphql');
const { get } = require('lodash');
const fs = require('fs');
const fileName = require('path').resolve(
  __dirname,
  '../cronJobLogs/oldCards.json'
);

const log = require(fileName);
const today = new Date();
const key = `${today.getFullYear()}/${today.getMonth()}/${today.getDate()}`;

const expireCards = gql`
  mutation ExpireOldCards {
    expireOldCards {
      count
    }
  }
`;

const getOldCards = gql`
  query OldCards {
    oldCards {
      id
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

console.log('PORTAL_ADMIN_PASSWORD is: ', process.env.PORTAL_ADMIN_PASSWORD);

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

const expireOldCardsPayload = {
  operationName: 'ExpireOldCards',
  query: print(expireCards),
};

const getOldCardsPayload = {
  operationName: 'OldCards',
  query: print(getOldCards),
};

let token = null;

let logEntry = {};

axios(loginConfig)
  .then(response => {
    token = get(response, 'data.data.login.token');
    const config = {
      method: 'post',
      url: 'http://localhost:4000',
      data: getOldCardsPayload,
      headers: {
        Authorization: token,
      },
    };
    return axios(config);
  })
  .then(response => {
    const oldCards = get(response, 'data.data.oldCards');
    logEntry.oldCards = oldCards;
    const config = {
      method: 'post',
      url: 'http://localhost:4000',
      data: expireOldCardsPayload,
      headers: {
        Authorization: token,
      },
    };
    return axios(config);
  })
  .then(response => {
    const count = get(response, 'data.data.expireOldCards.count');
    logEntry.count = count;
    log[key] = logEntry;
    fs.writeFile(fileName, JSON.stringify(log, null, 2), function(err) {
      if (err) return console.log(err);
      console.log(JSON.stringify(log));
      console.log('writing to ' + fileName);
    });
  })
  .catch(error => {
    console.log('error is: ', error);
  });
