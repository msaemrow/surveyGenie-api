"use strict";

const db = require("../db.js");
const User = require("../models/user.js");
const { createToken } = require("../helpers/createToken");
const Survey = require("../models/survey.js");
let user1Id;
let u1Token;
let user2Id;
let u2Token;
let surveyId;
let questionId;
let demoResId;
let demoResId2;

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  console.log("BEFORE", await db.query("SELECT * FROM users").rows);
  await db.query("DELETE FROM users");
  await db.query("DELETE FROM responses");
  await db.query("DELETE FROM surveys");

  console.log("AFTER", await db.query("SELECT * FROM users").rows);

  const user1 = await User.register({
    email: "user1@user.com",
    first_name: "U1F",
    last_name: "U1L",
    password: "password",
    num_surveys: 0,
  });
  const user2 = await User.register({
    email: "user2@user.com",
    first_name: "U2F",
    last_name: "U2L",
    password: "password",
    num_surveys: 0,
  });
  await User.register({
    email: "user3@user.com",
    first_name: "U3F",
    last_name: "U3L",
    password: "password",
    num_surveys: 0,
  });
  user1Id = user1.id;
  user2Id = user2.id;
  u1Token = createToken({ id: user1.id, first_name: user1.first_name });
  u2Token = createToken({ id: user2.id, first_name: user2.first_name });

  await Survey.create(user1Id, {
    title: "Test Survey",
    survey_description: "This is a test survey.",
    questions: [
      {
        question_text: "What is your favorite color?",
        question_type: "Multiple Choice",
        options: [
          { choice_text: "Red" },
          { choice_text: "Blue" },
          { choice_text: "Green" },
        ],
      },
    ],
  });

  let survey = await Survey.create(user1Id, {
    title: "Test Survey",
    survey_description: "This is a test survey.",
    questions: [
      {
        question_text: "What is your favorite color?",
        question_type: "Multiple Choice",
        options: [
          { choice_text: "Red" },
          { choice_text: "Blue" },
          { choice_text: "Green" },
        ],
      },
    ],
  });
  surveyId = survey.id;
  questionId = survey.questions[0].question_id;
  await Survey.create(user1Id, {
    title: "Test Survey",
    survey_description: "This is a test survey.",
    questions: [
      {
        question_text: "What is your favorite color?",
        question_type: "Multiple Choice",
        options: [
          { choice_text: "Red" },
          { choice_text: "Blue" },
          { choice_text: "Green" },
        ],
      },
    ],
  });
  let timestamp = new Date().toISOString();
  let timestamp2 = new Date().toISOString();
  const demoRes = await db.query(
    `
        INSERT INTO responses (survey_id, completed_at)
        VALUES ($1, $2),
                ($3, $4)
        RETURNING id`,
    [surveyId, timestamp, surveyId, timestamp2]
  );
  demoResId = demoRes.rows[0].id;
  demoResId2 = demoRes.rows[1].id;

  await db.query(
    `
    INSERT INTO answers (response_id, question_id, answer_text)
    VALUES($1, $2, $3),
        ($4, $5, $6)`,
    [demoResId, questionId, "Test", demoResId2, questionId, "Yes"]
  );
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  getSurveyId: () => surveyId,
  getUser1Id: () => user1Id,
  getUser1Token: () => u1Token,
  getUser2Id: () => user2Id,
  getUser2Token: () => u2Token,
  getQuestionId: () => questionId,
  getResponse1Id: () => demoResId,
  getResponse2Id: () => demoResId2,
};
