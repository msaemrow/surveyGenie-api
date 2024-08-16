"use strict";

const db = require("../db.js");
const User = require("./user.js");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config.js");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
let demoId;
//******************************************************* */
beforeAll(async () => {
  await db.query("DELETE FROM users");
  const hashedPassword = await bcrypt.hash("password", BCRYPT_WORK_FACTOR);
  const demoUsers = await db.query(
    `
    INSERT INTO users(email,
                      password,
                      first_name,
                      last_name,
                      num_surveys)
    VALUES ('u1@email.com', $1, 'U1F', 'U1L', 0),
           ('u2@email.com', $1, 'U2F', 'U2L', 0)
    RETURNING id`,
    [hashedPassword]
  );
  demoId = demoUsers.rows[0].id;
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
describe("authenticateUser", () => {
  it("authenticates a user with valid credentials", async () => {
    const user = await User.authenticateUser("u1@email.com", "password");
    expect(user).toEqual({
      id: demoId,
      email: "u1@email.com",
      first_name: "U1F",
      last_name: "U1L",
    });
  });

  it("throws UnauthorizedError if email is not found", async () => {
    try {
      await User.authenticateUser("nonexistent@email.com", "password");
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
      expect(err.message).toBe("Email and password do not match");
    }
  });

  it("throws UnauthorizedError if password is incorrect", async () => {
    try {
      await User.authenticateUser("u1@email.com", "wrongpassword");
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
      expect(err.message).toBe("Email and password do not match");
    }
  });
});

describe("register function", () => {
  const newUser = {
    email: "test@email.com",
    first_name: "Test",
    last_name: "Tester",
    num_surveys: 0,
  };

  it("registers user and returns user", async () => {
    let user = await User.register({
      ...newUser,
      password: "password",
    });
    const found = await db.query(`SELECT * FROM users WHERE id = ${user.id}`);
    delete user.id;
    expect(user).toEqual(newUser);
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].num_surveys).toEqual(0);
  });

  it("throws bad request error if duplicate email is used", async () => {
    try {
      await User.register({
        ...newUser,
        password: "password",
      });
      await User.register({
        ...newUser,
        password: "password",
      });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

describe("get function", () => {
  it("returns a single user", async () => {
    let results = await User.get(demoId);
    delete results.id;
    expect(results).toEqual({
      email: "u1@email.com",
      first_name: "U1F",
      last_name: "U1L",
      num_surveys: 0,
    });
  });

  it("throws Not Found Error if user with ID is not found", async () => {
    try {
      await User.get(99999999);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

describe("findAll function", () => {
  it("returns all users", async () => {
    let results = await User.findAll();
    expect(results.length).toBe(2);
    expect(results[0]).toEqual({
      id: demoId,
      email: "u1@email.com",
      first_name: "U1F",
      last_name: "U1L",
      num_surveys: 0,
    });
  });
});

describe("update function", () => {
  it("updates a single user with partial data", async () => {
    let updatedUser = await User.update(demoId, { first_name: "U1First" });
    expect(updatedUser).toEqual({
      id: demoId,
      email: "u1@email.com",
      first_name: "U1First",
      last_name: "U1L",
      num_surveys: 0,
    });
  });
  it("updates a single user with partial data", async () => {
    let updatedUser = await User.update(demoId, {
      email: "u11@email.com",
      first_name: "U1First",
      last_name: "U1Last",
      num_surveys: 0,
    });
    expect(updatedUser).toEqual({
      id: demoId,
      email: "u11@email.com",
      first_name: "U1First",
      last_name: "U1Last",
      num_surveys: 0,
    });
  });

  it("throws Not Found Error if user with ID is not found", async () => {
    try {
      const data = { first_name: "U1First" };
      await User.update(999999, data);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

describe("remove function", () => {
  it("removes a single user", async () => {
    await User.remove(demoId);
    const checkDeletion = await db.query(
      `SELECT * FROM users WHERE id=${demoId}`
    );
    expect(checkDeletion.rows.length).toEqual(0);
  });

  it("throws Not Found Error if user with ID is not found", async () => {
    try {
      await User.remove(9999999);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
