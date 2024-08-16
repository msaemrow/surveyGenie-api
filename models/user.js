"use strict";

/** Model for user */

const db = require("../db");
const bcrypt = require("bcrypt");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");
const { BCRYPT_WORK_FACTOR } = require("../config.js");

class User {
  /** authenticate user with email and password.
   *
   * Returns { id, email, first_name, last_name }
   *
   * Throws UnauthorizedError is user not found or wrong password.
   **/
  static async authenticateUser(email, password) {
    const res = await db.query(
      `SELECT id, email, first_name, last_name, password
      FROM users
      WHERE email = $1`,
      [email]
    );

    const user = res.rows[0];
    if (user) {
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }
    throw new UnauthorizedError("Email and password do not match");
  }

  /** Given a username, return data about user.
   *
   * @returns username, first_name, last_name, is_admin, jobs
   *
   *    --where jobs is id, title, company_handle, company_name, state
   *
   * Throws NotFoundError if user not found.
   **/
  static async get(user_id) {
    const userRes = await db.query(
      `SELECT id,
                  email,
                  first_name,
                  last_name,
                  num_surveys
           FROM users
           WHERE id = $1`,
      [user_id]
    );
    const user = userRes.rows[0];

    if (!user) throw new NotFoundError(`No user found with id: ${user_id}`);

    return user;
  }

  /** Find all users in database.
   *
   * Returns Returns [{ username, first_name, last_name, email, is_admin }, ...]
   *
   * Throws NotFoundError if no users are found.
   **/

  static async findAll() {
    const result = await db.query(
      `
        SELECT id,
        email,
        first_name,
        last_name,
        num_surveys
        FROM users
        ORDER BY last_name`
    );
    return result.rows;
  }

  /** Register user with data.
   *
   * Returns { email, firstName, lastName, numSurveys }
   *
   * Throws BadRequestError on duplicates.
   **/

  static async register({
    email,
    first_name,
    last_name,
    password,
    num_surveys = 0,
  }) {
    const duplicateCheck = await db.query(
      `SELECT email
            FROM users
            WHERE email = $1`,
      [email]
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(
        `Account already registered to email: ${email}`
      );
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    console.log("Hashed password generated:", hashedPassword);
    try {
      const result = await db.query(
        `INSERT INTO users
          (email,
          first_name,
          last_name,
          password,
          num_surveys)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, email, first_name, last_name, num_surveys`,
        [email, first_name, last_name, hashedPassword, num_surveys]
      );
      const user = result.rows[0];
      console.log("User registered successfully:", user);
      return user;
    } catch (err) {
      console.error("Error during user registration:", err);
      throw new Error("User registration failed");
    }
  }

  /** Update all or partial user data.
   *
   * Data can include:
   *   { email, firstName, lastName }
   *
   *  Returns { id, email, firstName, lastName, numSurveys}
   *
   *  Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      first_name: "first_name",
      last_name: "last_name",
      email: "email",
    });

    const sqlQuery = `Update users
                        SET ${setCols}
                        WHERE id = $${values.length + 1}
                        RETURNING 
                            id, 
                            email,
                            first_name,
                            last_name,
                            num_surveys`;

    const result = await db.query(sqlQuery, [...values, id]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user found with id: ${id}`);

    delete user.password;
    return user;
  }

  /** Delete user
   *
   *  Returns undefined
   *
   *  Throws NotFoundError if not found.
   */

  static async remove(id) {
    let result = await db.query(
      `DELETE
        FROM users
        WHERE id = $1
        RETURNING id`,
      [id]
    );
    const user = result.rows[0];
    if (!user) throw new NotFoundError(`No user found with id ${id}`);
  }
}

module.exports = User;
