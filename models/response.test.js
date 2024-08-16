const db = require("../db.js");
const Response = require("./response.js");
const { NotFoundError } = require("../expressError");

let demoId;
let demoSurveyId;
let timestamp;
let timestamp2;
let demoResId;
let demoResId2;
//******************************************************* */
beforeAll(async () => {
  await db.query("DELETE FROM users");
  await db.query("DELETE FROM surveys");
  await db.query("DELETE FROM responses");
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
      VALUES (${demoId}, 'Sample Survey', 'Testing the survey model')
      RETURNING id`);
  demoSurveyId = demoSurvey.rows[0].id;

  await db.query(`
      INSERT INTO questions (question_id, question_text, survey_id, question_type)
      VALUES (11, 'Question #1', ${demoSurveyId}, 'Text'),
             (12, 'Question #2', ${demoSurveyId}, 'Yes or No'),
             (13, 'Question #3', ${demoSurveyId}, 'Multiple Choice')`);

  await db.query(`
      INSERT INTO choices (choice_id, question_id, choice_text)
      VALUES (21, 13, 'Choice #1'),
             (22, 13, 'Choice #2')`);
  timestamp = new Date().toISOString();
  timestamp2 = new Date().toISOString();

  const demoRes = await db.query(
    `
        INSERT INTO responses (survey_id, completed_at)
        VALUES ($1, $2),
                ($3, $4)
        RETURNING id`,
    [demoSurveyId, timestamp, demoSurveyId, timestamp2]
  );
  demoResId = demoRes.rows[0].id;
  demoResId2 = demoRes.rows[1].id;

  await db.query(
    `
    INSERT INTO answers (response_id, question_id, answer_text)
    VALUES($1, $2, $3),
        ($1, $5, $6),
        ($4, $2, $3),
        ($4, $5, $6)`,
    [demoResId, 11, "Test", demoResId2, 12, "Yes"]
  );
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
describe("getSurveySummary function", () => {
  it("returns a list of responses", async () => {
    const res = await Response.getSurveySummary(demoSurveyId);

    expect(res.length).toBe(2);
    expect(res).toEqual([
      {
        id: demoResId,
        survey_id: demoSurveyId,
        completed_at: expect.any(Date),
      },
      {
        id: demoResId2,
        survey_id: demoSurveyId,
        completed_at: expect.any(Date),
      },
    ]);
  });

  it("throws a Not Found Error if the survey ID is not found", async () => {
    try {
      await Response.getSurveySummary(9999999);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

describe("getSurveyChartData function", () => {
  it("retrieves chart data for a given survey", async () => {
    const expectedData = [
      {
        response_id: demoResId,
        timestamp: expect.any(Date),
        question_id: 11,
        question_text: "Question #1",
        question_type: "Text",
        answer_text: "Test",
      },
      {
        response_id: demoResId,
        timestamp: expect.any(Date),
        question_id: 12,
        question_text: "Question #2",
        question_type: "Yes or No",
        answer_text: "Yes",
      },
      {
        response_id: demoResId2,
        timestamp: expect.any(Date),
        question_id: 11,
        question_text: "Question #1",
        question_type: "Text",
        answer_text: "Test",
      },
      {
        response_id: demoResId2,
        timestamp: expect.any(Date),
        question_id: 12,
        question_text: "Question #2",
        question_type: "Yes or No",
        answer_text: "Yes",
      },
    ];

    const results = await Response.getSurveyChartData(demoSurveyId);
    expect(results).toHaveLength(expectedData.length);
    expect(results).toEqual(expectedData);
  });

  it("returns an empty array if there are no responses for the survey", async () => {
    const emptySurveyId = await db.query(`
      INSERT INTO surveys (user_id, title, survey_description)
      VALUES (${demoId}, 'Empty Survey', 'No responses')
      RETURNING id
    `);

    const results = await Response.getSurveyChartData(emptySurveyId.rows[0].id);

    expect(results).toEqual([]);
  });
});

describe("getResponse function", () => {
  it("returns a single response object", async () => {
    const res = await Response.getResponse(demoResId);

    expect(res).toEqual({
      response_id: demoResId,
      survey_id: expect.any(Number),
      completed_at: expect.any(Date),
      answers: [
        {
          id: expect.any(Number),
          question_id: 11,
          question_text: "Question #1",
          answer_text: "Test",
        },
        {
          id: expect.any(Number),
          question_id: 12,
          question_text: "Question #2",
          answer_text: "Yes",
        },
      ],
    });
  });
  it("throws a Not Found Error if the response ID is not found", async () => {
    try {
      await Response.getResponse(9999999);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

describe("deleteResponse function", () => {
  it("deletes a response from the database", async () => {
    await Response.deleteResponse(demoResId);
    const checkDeletion = await db.query(
      `SELECT * FROM responses WHERE id=${demoResId}`
    );
    expect(checkDeletion.rows.length).toBe(0);
  });
  it("throws a Not Found Error if the response ID is not found", async () => {
    try {
      await Response.deleteResponse(9999999);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
