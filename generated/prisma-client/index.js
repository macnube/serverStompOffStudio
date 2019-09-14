"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var prisma_lib_1 = require("prisma-client-lib");
var typeDefs = require("./prisma-schema").typeDefs;

var models = [
  {
    name: "User",
    embedded: false
  },
  {
    name: "LoginResponse",
    embedded: false
  },
  {
    name: "Student",
    embedded: false
  },
  {
    name: "CourseDay",
    embedded: false
  },
  {
    name: "Course",
    embedded: false
  },
  {
    name: "CourseAbsence",
    embedded: false
  },
  {
    name: "ParticipantStatus",
    embedded: false
  },
  {
    name: "Participant",
    embedded: false
  },
  {
    name: "DanceRole",
    embedded: false
  },
  {
    name: "MembershipStatus",
    embedded: false
  },
  {
    name: "Membership",
    embedded: false
  },
  {
    name: "Teacher",
    embedded: false
  },
  {
    name: "CourseInstance",
    embedded: false
  },
  {
    name: "Card",
    embedded: false
  },
  {
    name: "PaymentType",
    embedded: false
  },
  {
    name: "Payment",
    embedded: false
  },
  {
    name: "ExpenseType",
    embedded: false
  },
  {
    name: "Expense",
    embedded: false
  },
  {
    name: "Studio",
    embedded: false
  },
  {
    name: "Room",
    embedded: false
  },
  {
    name: "MailgunEmailPayload",
    embedded: false
  }
];
exports.Prisma = prisma_lib_1.makePrismaClientClass({
  typeDefs,
  models,
  endpoint: `http://localhost:4466`
});
exports.prisma = new exports.Prisma();
