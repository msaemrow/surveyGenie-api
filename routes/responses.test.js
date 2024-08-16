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
  getResponse1Id,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("GET response/summary/:survey_id", () => {
  it("gets a summary of all survey responses for one survey", async () => {
    const survey_id = getSurveyId();
    const u1Token = getUser1Token();
    const resp = await request(app)
      .get(`/response/summary/${survey_id}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toHaveProperty("responses");
    expect(resp.body.responses.length).toBe(2);
    expect(Array.isArray(resp.body.responses)).toBe(true);
  });
});

describe("GET response/data/:survey_id", () => {
  it("gets survey data and transforms it into chart and table readable data", async () => {
    const survey_id = getSurveyId();
    const u1Token = getUser1Token();
    const resp = await request(app)
      .get(`/response/data/${survey_id}`)
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.body).toHaveProperty("surveyChartData");
    expect(resp.body.surveyChartData.length).toBe(2);
    expect(Array.isArray(resp.body.surveyChartData)).toBe(true);
    expect(resp.body.surveyChartData[0]).toHaveProperty("response_id");
    expect(resp.body.surveyChartData[0]).toHaveProperty("timestamp");
    expect(resp.body.surveyChartData[0]).toHaveProperty("question_id");
    expect(resp.body.surveyChartData[0]).toHaveProperty("question_text");
    expect(resp.body.surveyChartData[0]).toHaveProperty("question_type");
    expect(resp.body.surveyChartData[0]).toHaveProperty("answer_text");
  });
});
describe("GET response/:response_id", () => {
  it("returns a single response", async () => {
    let responseId = getResponse1Id();
    const u1Token = getUser1Token();
    const resp = await request(app)
      .get(`/response/${responseId}`)
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.body).toHaveProperty("response");
    expect(resp.body.response).toHaveProperty("response_id");
    expect(resp.body.response).toHaveProperty("survey_id");
    expect(resp.body.response).toHaveProperty("completed_at");
    expect(resp.body.response).toHaveProperty("answers");
  });
});

describe("DELETE response/:response_id", () => {
  it("deletes a single response", async () => {
    let responseId = getResponse1Id();
    const u1Token = getUser1Token();
    const resp = await request(app)
      .delete(`/response/${responseId}`)
      .set("authorization", `Bearer ${u1Token}`);
    console.log("DELETE SINGLE RESPONSE", resp.body);
    expect(resp.body).toEqual({ deleted_response: `${responseId}` });
  });
});
