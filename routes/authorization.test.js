"use strict";

const request = require("supertest");

const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /auth/token */

describe("POST /auth/token", function () {
  it("works", async function () {
    const resp = await request(app).post("/auth/token").send({
      email: "user1@user.com",
      password: "password",
    });
    expect(resp.body).toEqual({
      token: expect.any(String),
    });
  });

  it("unauth with non-existent user", async function () {
    const resp = await request(app).post("/auth/token").send({
      email: "no-such-user",
      password: "password1",
    });
    expect(resp.statusCode).toEqual(401);
  });

  it("unauth with wrong password", async function () {
    const resp = await request(app).post("/auth/token").send({
      email: "user1@user.com",
      password: "wrong_password",
    });
    expect(resp.statusCode).toEqual(401);
  });

  it("bad request with missing data", async function () {
    const resp = await request(app).post("/auth/token").send({
      username: "u1",
      password: "password",
    });
    expect(resp.statusCode).toEqual(401);
  });

  it("bad request with invalid data", async function () {
    const resp = await request(app).post("/auth/token").send({
      email: 42,
      password: "above-is-a-number",
    });
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** POST /auth/register */

describe("POST /auth/register", function () {
  it("works for anon", async function () {
    const resp = await request(app).post("/auth/register").send({
      email: "user4@user.com",
      first_name: "U4F",
      last_name: "U4L",
      password: "password",
      num_surveys: 0,
    });
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      token: expect.any(String),
    });
  });

  it("bad request with missing fields", async function () {
    const resp = await request(app).post("/auth/register").send({
      email: "new",
    });
    expect(resp.statusCode).toEqual(400);
  });

  it("bad request with invalid data", async function () {
    const resp = await request(app).post("/auth/register").send({
      email: "user.com",
      first_name: "First",
      last_name: "U4L",
      password: "password",
      num_surveys: 0,
    });
    expect(resp.statusCode).toEqual(400);
  });
});
