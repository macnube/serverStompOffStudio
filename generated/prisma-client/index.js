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
    name: "Student",
    embedded: false
  },
  {
    name: "Course",
    embedded: false
  },
  {
    name: "Attendee",
    embedded: false
  },
  {
    name: "Absentee",
    embedded: false
  },
  {
    name: "DanceRole",
    embedded: false
  },
  {
    name: "CourseStudent",
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
    name: "Studio",
    embedded: false
  },
  {
    name: "Room",
    embedded: false
  }
];
exports.Prisma = prisma_lib_1.makePrismaClientClass({
  typeDefs,
  models,
  endpoint: `http://localhost:4466`
});
exports.prisma = new exports.Prisma();
