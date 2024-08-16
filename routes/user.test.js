const request = require("supertest");
const app = require("../app");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  getUser1Id,
  getUser2Id,
  getUser1Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

//***************************************************************/

describe("GET /user/all", function () {
  it("works", async function () {
    const resp = await request(app).get("/user/all");
    expect(resp.body).toEqual({
      users: [
        {
          email: "user1@user.com",
          first_name: "U1F",
          last_name: "U1L",
          num_surveys: 3,
          id: expect.any(Number),
        },
        {
          email: "user2@user.com",
          first_name: "U2F",
          last_name: "U2L",
          num_surveys: 0,
          id: expect.any(Number),
        },
        {
          email: "user3@user.com",
          first_name: "U3F",
          last_name: "U3L",
          num_surveys: 0,
          id: expect.any(Number),
        },
      ],
    });
  });
});

describe("GET /user/:user_id", function () {
  it("works when user_id in token matches user_id in parameter", async function () {
    const user1Id = getUser1Id();
    const u1Token = getUser1Token();
    const resp = await request(app)
      .get(`/user/${user1Id}`)
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.body).toEqual({
      user: {
        email: "user1@user.com",
        first_name: "U1F",
        last_name: "U1L",
        num_surveys: 3,
        id: expect.any(Number),
      },
    });
  });

  it("unauthorized when user_id in token does not match user_id in parameter", async function () {
    const user1Id = getUser2Id();
    const u1Token = getUser1Token();
    const resp = await request(app)
      .get(`/user/${user1Id}`)
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.body).toEqual({
      error: {
        status: 401,
        message: "Unauthorized",
      },
    });
    expect(resp.status).toBe(401);
  });

  it("unauthorized when token is not attached to header", async function () {
    const user1Id = getUser1Id();
    const resp = await request(app).get(`/user/${user1Id}`);

    expect(resp.body).toEqual({
      error: {
        status: 401,
        message: "Unauthorized",
      },
    });
    expect(resp.status).toBe(401);
  });
});

describe("POST /user", function () {
  it("works", async function () {
    const resp = await request(app).post("/user").send({
      email: "user4@user.com",
      first_name: "U4F",
      last_name: "U4L",
      password: "password",
      num_surveys: 0,
    });
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      token: expect.any(String),
      user: {
        id: expect.any(Number),
        email: "user4@user.com",
        first_name: "U4F",
        last_name: "U4L",
        num_surveys: 0,
      },
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

describe("PATCH /user/:user_id", function () {
  it("updates the user details when user_id in token matches user_id in parameter", async function () {
    const user1Id = getUser1Id();
    const u1Token = getUser1Token();
    const resp = await request(app)
      .patch(`/user/${user1Id}`)
      .send({
        email: "updated@user.com",
        first_name: "NewFirst",
        last_name: "NewLast",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      user: {
        id: user1Id,
        email: "updated@user.com",
        first_name: "NewFirst",
        last_name: "NewLast",
        num_surveys: 3,
      },
    });
  });
  it("unauthorized when user_id in token does not match user_id in parameter", async function () {
    const user1Id = getUser2Id(); // Trying to update user2's details with user1's token
    const u1Token = getUser1Token();
    const resp = await request(app)
      .patch(`/user/${user1Id}`)
      .send({
        first_name: "UpdatedFirstName",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      error: {
        status: 401,
        message: "Unauthorized",
      },
    });
  });
  it("bad request when trying to update with invalid data", async function () {
    const user1Id = getUser1Id();
    const u1Token = getUser1Token();
    const resp = await request(app)
      .patch(`/user/${user1Id}`)
      .send({
        email: "not-an-email", // Invalid email format
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
    expect(resp.body).toEqual({
      error: {
        status: 400,
        message: expect.any(Array),
      },
    });
  });
});

describe("DELETE user/:id", function () {
  it("deletes the user", async () => {
    const user1Id = getUser1Id();
    const u1Token = getUser1Token();
    const resp = await request(app)
      .delete(`/user/${user1Id}`)
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.body).toEqual({ deleted_user: `${user1Id}` });
  });
});
