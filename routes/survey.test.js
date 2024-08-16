const request = require("supertest");
const app = require("../app");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  getUser1Id,
  getUser2Id,
  getUser2Token,
  getUser1Token,
  getSurveyId,
  getQuestionId,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const validSurvey = {
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
};

const invalidSurvey = {
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
};

const invalidSurvey2 = {
  title: "Test Survey",
  survey_description: "This is a test survey.",
  questions: [
    {
      question_type: "Multiple Choice",
      options: [
        { choice_text: "Red" },
        { choice_text: "Blue" },
        { choice_text: "Green" },
      ],
    },
  ],
};

const invalidSurvey3 = {
  title: "Test Survey",
  survey_description: "This is a test survey.",
  questions: [
    {
      question_text: "What is your favorite color?",
      question_type: "Multiple Choice",
      options: [],
    },
  ],
};

describe("POST /survey/:user_id", () => {
  it("creates a survey with valid data", async () => {
    const userId = getUser1Id();
    const u1Token = getUser1Token();
    const resp = await request(app)
      .post(`/survey/${userId}`)
      .set("authorization", `Bearer ${u1Token}`)
      .send(validSurvey);

    expect(resp.body.survey).toHaveProperty("id");
    expect(resp.body.survey).toHaveProperty("user_id", userId);
    expect(resp.body.survey).toHaveProperty("title", validSurvey.title);
    expect(resp.body.survey).toHaveProperty(
      "survey_description",
      validSurvey.survey_description
    );
  });

  it("fails to create a survey when survey data with missing title is submitted", async () => {
    const userId = getUser1Id();
    const u1Token = getUser1Token();
    const resp = await request(app)
      .post(`/survey/${userId}`)
      .set("authorization", `Bearer ${u1Token}`)
      .send(invalidSurvey);

    expect(resp.statusCode).toBe(400);
    expect(resp.body.error.message).toContain(
      'instance requires property "title"'
    );
  });

  it("fails to create a survey when survey data with missing question_text is submitted", async () => {
    const userId = getUser1Id();
    const u1Token = getUser1Token();
    const resp = await request(app)
      .post(`/survey/${userId}`)
      .set("authorization", `Bearer ${u1Token}`)
      .send(invalidSurvey2);

    expect(resp.statusCode).toBe(400);
    expect(resp.body.error.message).toContain(
      'Question Validation Failed: instance requires property "question_text"'
    );
  });

  it("fails to create a survey when survey data with multiple choice question not having any options", async () => {
    const userId = getUser1Id();
    const u1Token = getUser1Token();
    const resp = await request(app)
      .post(`/survey/${userId}`)
      .set("authorization", `Bearer ${u1Token}`)
      .send(invalidSurvey3);

    expect(resp.statusCode).toBe(400);
    expect(resp.body.error.message).toContain(
      "Question Validation Failed: instance does not match allOf schema [subschema 0] with 1 error[s]:,instance.options does not meet minimum length of 1"
    );
  });

  it("fails to create a survey when a user token is not available", async () => {
    const userId = getUser1Id();
    const resp = await request(app).post(`/survey/${userId}`).send(validSurvey);

    expect(resp.statusCode).toBe(401);
    expect(resp.body.error.message).toBe("Unauthorized");
  });

  it("fails to create a survey when if the user token does not match the user_id", async () => {
    const userId = getUser1Id();
    const u2Token = getUser2Token();
    const resp = await request(app)
      .post(`/survey/${userId}`)
      .set("authorization", `Bearer ${u2Token}`)
      .send(validSurvey);

    expect(resp.statusCode).toBe(401);
    expect(resp.body.error.message).toBe("Unauthorized");
  });
});

describe("GET /survey/:user_id/all", () => {
  it("returns a list of surveys for a single user", async () => {
    const userId = getUser1Id();
    const u1Token = getUser1Token();
    const resp = await request(app)
      .get(`/survey/${userId}/all`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body.surveys).toEqual(expect.any(Array));
    expect(resp.body.surveys.length).toBe(4);
  });

  it("returns a list of surveys for a single user with no surveys created", async () => {
    const userId = getUser2Id();
    const u2Token = getUser2Token();
    const resp = await request(app)
      .get(`/survey/${userId}/all`)
      .set("authorization", `Bearer ${u2Token}`);
    console.log("GET /all RESPONSE", resp.body);
    expect(resp.body.surveys).toEqual(expect.any(Array));
    expect(resp.body.surveys.length).toBe(0);
  });

  it("throws an unauthorized error if token doesn't match user_id in params", async () => {
    const userId = getUser1Id();
    const u2Token = getUser2Token();
    const resp = await request(app)
      .get(`/survey/${userId}/all`)
      .set("authorization", `Bearer ${u2Token}`);

    expect(resp.statusCode).toBe(401);
    expect(resp.body.error.message).toBe("Unauthorized");
  });
});

describe("GET /survey/:user_id/:survey_id", () => {
  it("returns a survey object", async () => {
    const userId = getUser1Id();
    const u1Token = getUser1Token();
    const surveyId = getSurveyId();
    const resp = await request(app)
      .get(`/survey/${userId}/${surveyId}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body.survey).toHaveProperty("id");
    expect(resp.body.survey).toHaveProperty("title");
    expect(resp.body.survey).toHaveProperty("survey_description");
    expect(resp.body.survey).toHaveProperty("questions");
  });

  it("throws unauthorized error if no token is provided", async () => {
    const userId = getUser1Id();
    const surveyId = getSurveyId();
    const resp = await request(app).get(`/survey/${userId}/${surveyId}`);

    expect(resp.statusCode).toBe(401);
    expect(resp.body.error.message).toBe("Unauthorized");
  });

  it("throws unauthorized error if token provided doesn't match user_id param", async () => {
    const userId = getUser1Id();
    const surveyId = getSurveyId();
    const u2Token = getUser2Token();
    const resp = await request(app)
      .get(`/survey/${userId}/${surveyId}`)
      .set("authorization", `Bearer ${u2Token}`);

    expect(resp.statusCode).toBe(401);
    expect(resp.body.error.message).toBe("Unauthorized");
  });
});

describe("DELETE /survey/:user_id/:survey_id", () => {
  it("deletes a survey as expected", async () => {
    const user1Id = getUser1Id();
    const u1Token = getUser1Token();
    const surveyId = getSurveyId();
    const resp = await request(app)
      .delete(`/survey/${user1Id}/${surveyId}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted_survey: `${surveyId}` });
  });

  it("deletes a survey as expected even if survey is not found", async () => {
    const user1Id = getUser1Id();
    const u1Token = getUser1Token();
    const surveyId = 999999;
    const resp = await request(app)
      .delete(`/survey/${user1Id}/${surveyId}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body.error).toEqual({
      message: "No survey found with id: 999999",
      status: 404,
    });
  });

  it("deletes a survey as expected", async () => {
    const user1Id = getUser1Id();
    const u2Token = getUser2Token();
    const surveyId = getSurveyId();
    const resp = await request(app)
      .delete(`/survey/${user1Id}/${surveyId}`)
      .set("authorization", `Bearer ${u2Token}`);
    console.log("deleted: ", resp.body);

    expect(resp.statusCode).toBe(401);
    expect(resp.body.error.message).toBe("Unauthorized");
  });
});

describe("POST /survey/complete", () => {
  it("should successfully complete a survey without an auth token", async () => {
    let survey_id = getSurveyId();
    const u1Token = getUser1Token();
    let question_id = getQuestionId();
    const surveyResponse = {
      survey_id: `${survey_id}`,
      responses: { [`${question_id}`]: "Blue" },
    };
    const resp = await request(app)
      .post("/survey/complete")
      .set("authorization", `Bearer ${u1Token}`)
      .send(surveyResponse);

    expect(resp.body.completedSurvey).toHaveProperty("id");
    expect(resp.body.completedSurvey).toHaveProperty("survey_id");
    expect(resp.body.completedSurvey).toHaveProperty("completed_at");
    expect(resp.body.completedSurvey).toHaveProperty("answers");
  });

  it("should successfully complete a survey with an auth token", async () => {
    let survey_id = getSurveyId();
    let question_id = getQuestionId();
    const surveyResponse = {
      survey_id: `${survey_id}`,
      responses: { [`${question_id}`]: "Blue" },
    };

    const resp = await request(app)
      .post("/survey/complete")
      .send(surveyResponse);

    expect(resp.body.completedSurvey).toHaveProperty("id");
    expect(resp.body.completedSurvey).toHaveProperty("survey_id");
    expect(resp.body.completedSurvey).toHaveProperty("completed_at");
    expect(resp.body.completedSurvey).toHaveProperty("answers");
  });
});
