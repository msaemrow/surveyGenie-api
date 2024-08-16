"use strict";

const db = require("../db.js");
const Survey = require("./survey.js");
const {
  NotFoundError,
  ExpressError,
  BadRequestError,
} = require("../expressError");

let demoId;
let demoSurveyId;
let demoSurveyId2;
//******************************************************* */
beforeAll(async () => {
  await db.query("DELETE FROM users");
  const demoUsers = await db.query(`
    INSERT INTO users(email,
                      password,
                      first_name,
                      last_name,
                      num_surveys)
    VALUES ('u1@email.com', 'password', 'U1F', 'U1L', 0)
    RETURNING id`);
  demoId = demoUsers.rows[0].id;
  const demoSurvey = await db.query(`
    INSERT INTO surveys (user_id, title, survey_description)
    VALUES (${demoId}, 'Sample Survey', 'Testing the survey model'),
           (${demoId}, 'Sample Survey 2', 'Testing the survey model')
    RETURNING id`);
  demoSurveyId = demoSurvey.rows[0].id;
  demoSurveyId2 = demoSurvey.rows[1].id;

  await db.query(`
    INSERT INTO questions (question_id, question_text, survey_id, question_type)
    VALUES (11, 'Question #1', ${demoSurveyId}, 'Text'),
           (12, 'Question #2', ${demoSurveyId}, 'Yes or No'),
           (13, 'Question #3', ${demoSurveyId2}, 'Multiple Choice')`);

  await db.query(`
    INSERT INTO choices (choice_id, question_id, choice_text)
    VALUES (21, 13, 'Choice #1'),
           (22, 13, 'Choice #2')`);
});

beforeEach(async () => {
  await db.query("BEGIN");
});

afterEach(async () => {
  await db.query("ROLLBACK");
});

afterAll(async () => {
  await db.end();
});

//******************************************************* */
describe("getSurvey function", () => {
  it("returns a survey with its questions (text and yes/no questions)", async () => {
    let results = await Survey.getSurvey(demoSurveyId);
    expect(results).toEqual({
      id: demoSurveyId,
      title: "Sample Survey",
      survey_description: "Testing the survey model",
      questions: [
        {
          id: 11,
          text: "Question #1",
          type: "Text",
          options: [],
        },
        {
          id: 12,
          text: "Question #2",
          type: "Yes or No",
          options: [],
        },
      ],
    });
  });

  it("returns a survey with its questions and choices (multiple choice questions)", async () => {
    let results = await Survey.getSurvey(demoSurveyId2);
    expect(results).toEqual({
      id: demoSurveyId2,
      title: "Sample Survey 2",
      survey_description: "Testing the survey model",
      questions: [
        {
          id: 13,
          text: "Question #3",
          type: "Multiple Choice",
          options: [
            { id: 21, text: "Choice #1" },
            { id: 22, text: "Choice #2" },
          ],
        },
      ],
    });
  });

  it("throws a Not Found Error if the survey_id is not found", async () => {
    try {
      await Survey.getSurvey(99999);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

//******************************************************* */
describe("getAllSurveys function", () => {
  it("returns an array of survey objects for a user", async () => {
    let results = await Survey.getAllSurveys(demoId);
    expect(results).toEqual([
      {
        id: demoSurveyId,
        title: "Sample Survey",
        survey_description: "Testing the survey model",
      },
      {
        id: demoSurveyId2,
        title: "Sample Survey 2",
        survey_description: "Testing the survey model",
      },
    ]);
  });
  it("throws a Not Found Error if the user id is not found", async () => {
    try {
      await Survey.getAllSurveys(9999999);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

//*******************************************************
describe("create function", () => {
  const demoSurvey = {
    title: "Job Screener",
    survey_description: "Helps find qualified candidates quickly",
    questions: [
      {
        question_id: 7211,
        question_text: "Why do you want this job?",
        question_type: "Text",
        options: [],
      },
      {
        question_id: 7212,
        question_text: "Are you licensed to work in Iowa?",
        question_type: "Yes or No",
        options: [],
      },
      {
        question_id: 7213,
        question_text: "Who is your current employer?",
        question_type: "Text",
        options: [],
      },
      {
        question_id: 7214,
        question_text: "When can you start working?",
        question_type: "Multiple Choice",
        options: [
          {
            id: 1111,
            choice_text: "1 week",
          },
          {
            id: 1112,
            choice_text: "2 weeks",
          },
          {
            id: 1113,
            choice_text: "3 weeks",
          },
          {
            id: 1114,
            choice_text: "4 weeks",
          },
        ],
      },
    ],
  };

  const demoBadSurvey = {
    survey_description: "Helps find qualified candidates quickly",
    questions: [
      {
        question_id: 7211,
        question_text: "Why do you want this job?",
        question_type: "Text",
        options: [],
      },
    ],
  };

  const expectedResults = {
    createdSurvey: {
      id: expect.any(Number),
      user_id: demoId,
      title: demoSurvey.title,
      survey_description: demoSurvey.survey_description,
    },
    questions: [
      {
        question_id: expect.any(Number),
        question_text: "Why do you want this job?",
        question_type: "Text",
      },
      {
        question_id: expect.any(Number),
        question_text: "Are you licensed to work in Iowa?",
        question_type: "Yes or No",
      },
      {
        question_id: expect.any(Number),
        question_text: "Who is your current employer?",
        question_type: "Text",
      },
      {
        question_id: expect.any(Number),
        question_text: "When can you start working?",
        question_type: "Multiple Choice",
      },
    ],
  };

  it("adds a new survey to the database", async () => {
    let results = await Survey.create(demoId, demoSurvey);
    const surveyCheck = await db.query(
      `SELECT id, user_id, title, survey_description FROM surveys WHERE id = $1`,
      [results.id]
    );
    expect(surveyCheck.rows.length).toBe(1);
    expect(results).toEqual({
      id: surveyCheck.rows[0].id,
      user_id: surveyCheck.rows[0].user_id,
      title: surveyCheck.rows[0].title,
      survey_description: surveyCheck.rows[0].survey_description,
      questions: expect.any(Array),
    });
    const questionsCheck = await db.query(
      `SELECT question_id, question_text, question_type FROM questions WHERE survey_id = $1 ORDER BY question_id`,
      [results.id]
    );

    expect(results.questions.length).toBe(4);
    expect(results.questions).toEqual(expectedResults.questions);

    const multipleChoiceId = results.questions[3].question_id;

    const choicesCheck = await db.query(
      `SELECT choice_id, choice_text FROM choices WHERE question_id = $1 ORDER BY choice_id`,
      [results.questions[3].question_id]
    );

    expect(choicesCheck.rows.length).toBe(4);
    expect(choicesCheck.rows).toEqual([
      { choice_id: expect.any(Number), choice_text: "1 week" },
      { choice_id: expect.any(Number), choice_text: "2 weeks" },
      { choice_id: expect.any(Number), choice_text: "3 weeks" },
      { choice_id: expect.any(Number), choice_text: "4 weeks" },
    ]);
  });

  it("throws an error if user_id is missing", async () => {
    try {
      await Survey.create(demoSurvey);
    } catch (err) {
      expect(err instanceof ExpressError).toBeTruthy();
      expect(err.message).toBe("Invalid or missing user id");
    }
  });

  it("throws an error if survey object is an array", async () => {
    try {
      await Survey.create(demoId, ["title", "description"]);
    } catch (err) {
      expect(err instanceof ExpressError).toBeTruthy();
      expect(err.message).toBe("Invalid or missing survey data");
    }
  });

  it("throws an error if survey is missing the title", async () => {
    try {
      await Survey.create(demoId, demoBadSurvey);
    } catch (err) {
      expect(err instanceof ExpressError).toBeTruthy();
      expect(err.message).toBe("Invalid or missing survey data");
    }
  });

  it("throws an error if the question_text is missing", async () => {
    try {
      //removed question_text to intentionally throw an error
      await Survey.create(demoId, {
        title: "Test Survey",
        survey_description: "This should fail",
        questions: [
          {
            question_type: "Text",
          },
        ],
      });
    } catch (err) {
      expect(err instanceof ExpressError).toBeTruthy();
      expect(err.message).toBe(
        "Failed to create survey. Missing question data"
      );
    }
  });

  it("throws an error if the question option data is missing the text", async () => {
    try {
      //removed question_text to intentionally throw an error
      await Survey.create(demoId, {
        title: "Test Survey",
        survey_description: "This should fail",
        questions: [
          {
            question_id: 7211,
            question_text: "What is your age?",
            question_type: "Multiple Choice",
            options: [
              {
                id: 1111,
              },
            ],
          },
        ],
      });
    } catch (err) {
      expect(err instanceof ExpressError).toBeTruthy();
      expect(err.message).toBe(
        "Failed to create survey. Missing question option data"
      );
    }
  });

  it("throws an error if the question option data empty", async () => {
    try {
      //removed question_text to intentionally throw an error
      await Survey.create(demoId, {
        title: "Test Survey",
        survey_description: "This should fail",
        questions: [
          {
            question_id: 7211,
            question_text: "What is your age?",
            question_type: "Multiple Choice",
            options: [],
          },
        ],
      });
    } catch (err) {
      expect(err instanceof ExpressError).toBeTruthy();
      expect(err.message).toBe(
        "Failed to create survey. Missing question option data"
      );
    }
  });

  it("throws an error if something goes wrong while inserting to the database", async () => {
    try {
      //added an invalid question_type to intentionally throw an error
      await Survey.create(demoId, {
        title: "Test Survey",
        survey_description: "This should fail",
        questions: [
          {
            question_text: "Question 1?",
            question_type: "Not a valid type",
          },
        ],
      });
    } catch (err) {
      expect(err instanceof ExpressError).toBeTruthy();
      expect(err.message).toBe(
        'Failed to create survey. invalid input value for enum question_type_enum: "Not a valid type"'
      );
    }
  });
});

//*******************************************************
describe("deleteSurvey function", () => {
  it("removes a single survey from the database", async () => {
    await Survey.deleteSurvey(demoId, demoSurveyId);
    const checkDeletion = await db.query(
      `SELECT * FROM surveys WHERE id=${demoSurveyId}`
    );
    expect(checkDeletion.rows.length).toEqual(0);
  });
  it("throws a Not Found Error if survey id is not found", async () => {
    try {
      await Survey.deleteSurvey(999999);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

describe("completeSurvey function", () => {
  it("adds survey responses to the database", async () => {
    const surveyResponses = {
      survey_id: demoSurveyId,
      responses: {
        11: "Test answer 1",
        12: "Yes",
      },
    };

    const results = await Survey.completeSurvey(surveyResponses);
    const checkResponses = await db.query(
      `SELECT * FROM responses where survey_id = $1`,
      [demoSurveyId]
    );

    expect(checkResponses.rows.length).toBe(1);
    expect(checkResponses.rows[0].survey_id).toBe(demoSurveyId);

    const answersCheck = await db.query(
      `SELECT * FROM answers WHERE response_id = $1 ORDER BY question_id`,
      [results.id]
    );
    expect(answersCheck.rows.length).toBe(2);
    expect(answersCheck.rows).toEqual([
      {
        id: expect.any(Number),
        response_id: results.id,
        question_id: 11,
        answer_text: "Test answer 1",
      },
      {
        id: expect.any(Number),
        response_id: results.id,
        question_id: 12,
        answer_text: "Yes",
      },
    ]);
  });

  it("throws an error if the response is not an object", async () => {
    const invalidSurveyResponse = ["this is a response", 12];

    try {
      await Survey.completeSurvey(invalidSurveyResponse);
    } catch (err) {
      expect(err.message).toBe("Invalid response format");
    }
  });

  it("throws an error if responses data is invalid", async () => {
    const invalidSurveyResponse = {
      survey_id: demoSurveyId,
      responses: "invalid data",
    };

    try {
      await Survey.completeSurvey(invalidSurveyResponse);
    } catch (err) {
      expect(err.message).toBe("Invalid or missing responses");
    }
  });

  it("throws an error if survey_id is missing", async () => {
    const invalidSurveyResponse = {
      responses: {
        11: "Because I love coding!",
        12: "Yes",
      },
    };

    try {
      await Survey.completeSurvey(invalidSurveyResponse);
    } catch (err) {
      expect(err.message).toBe("Missing or invalid survey id");
    }
  });

  it("throws an error if responses data is invalid", async () => {
    const invalidSurveyResponse = {
      survey_id: demoSurveyId,
      responses: "invalid data",
    };

    try {
      await Survey.completeSurvey(invalidSurveyResponse);
    } catch (err) {
      expect(err.message).toBe("Invalid or missing responses");
    }
  });

  it("throws an error if answers are not of type text", async () => {
    const invalidSurveyResponse = {
      survey_id: demoSurveyId,
      responses: {
        11: 15,
        12: "Yes",
      },
    };

    try {
      await Survey.completeSurvey(invalidSurveyResponse);
    } catch (err) {
      expect(err.message).toBe(
        "Failed to complete survey. Invalid question_id or answer_text format"
      );
    }
  });

  it("throws an error if question_id is not of type number", async () => {
    const invalidSurveyResponse = {
      survey_id: demoSurveyId,
      responses: {
        not_a_number: "Yes",
        12: "Yes",
      },
    };

    try {
      await Survey.completeSurvey(invalidSurveyResponse);
    } catch (err) {
      expect(err.message).toBe(
        "Failed to complete survey. Invalid question_id or answer_text format"
      );
    }
  });

  it("throws an general error if unable to complete the survey", async () => {
    const invalidSurveyResponse = {
      survey_id: demoSurveyId,
      responses: {
        not_a_number: "Test answer 1",
        12: null,
      },
    };
    await expect(Survey.completeSurvey(invalidSurveyResponse)).rejects.toThrow(
      "Failed to complete survey"
    );
  });
});
