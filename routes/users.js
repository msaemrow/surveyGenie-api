"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");
const newUserSchema = require("../schemas/userNew.json");
const updateUserSchema = require("../schemas/userUpdate.json");

const express = require("express");
const User = require("../models/user");
const { ensureCorrectUser } = require("../middleware/authorization");
const { BadRequestError } = require("../expressError");
const { createToken } = require("../helpers/createToken");
const e = require("express");

const router = new express.Router();

/** GET / => { users: [ { email, first_name, last_name, num_surveys}, ... ] } }
 *
 * Returns { email, first_name, last_name, and num_surveys}.
 *
 **/
router.get("/all", async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id] => { user }
 *
 * Returns { id, email, first_name, last_name, and num_surveys}.
 *
 **/
router.get("/:user_id", ensureCorrectUser, async function (req, res, next) {
  try {
    const user = await User.get(req.params.user_id);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

/** POST / { user }  => { user }
 *
 * Adds a new user. 
 * Don't need this route at this time. It's the same as authorization/register
 * Keeping if for now in case I chcnag the set up
 *
 * This returns the newly created user:
 *  {user: { id, email, firstName, lastName, numSurveys } }

 **/
router.post("/", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, newUserSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      console.log(errs);
      throw new BadRequestError(errs);
    }
    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] { user } => { user }
 *
 *  Data can include:
 *   { firstName, lastName, email }
 *
 *  Returns { id, email, firstName, lastName, numSurveys }
 */
router.patch("/:user_id", ensureCorrectUser, async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, updateUserSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }
    const user = await User.update(req.params.user_id, req.body);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[id] => { deleted: User ID deleted ${id} }
 *
 */
router.delete("/:user_id", ensureCorrectUser, async (req, res, next) => {
  try {
    await User.remove(req.params.user_id);
    return res.json({ deleted_user: req.params.user_id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
