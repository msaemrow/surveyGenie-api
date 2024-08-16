"use strict";

/** Routes for survey */
const jsonschema = require("jsonschema");
const newSurveySchema = require("../schemas/surveyNew.json");
const questionSchema = require("../schemas/questionNew.json");
const choiceSchema = require("../schemas/choiceNew.json");
const responseSchema = require("../schemas/responsesNew.json");
const express = require("express");
const Survey = require("../models/survey");
const { BadRequestError } = require("../expressError");
const {
  ensureLoggedIn,
  ensureCorrectUser,
} = require("../middleware/authorization");
const db = require("../db");

const router = new express.Router();

/** POST / { survey }  => { survey }
 *
 * Creates a new survey.
 *
 * This returns the newly created survey:
 *  {
 *      survey: {
 *          title,
 *          description,
 *          questions: [
 *              { id, question_text, question_type, options: [option, ...] },
 *              ...
 *           ]
 *      }
 *   }
 *
 **/
router.post("/complete", async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, responseSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }
    const completedSurvey = await Survey.completeSurvey(req.body);
    return res.status(201).json({ completedSurvey });
  } catch (err) {
    console.error("Error completing survey:", err);
    return next(err);
  }
});

router.post("/:user_id", ensureCorrectUser, async (req, res, next) => {
  try {
    //validate the basic survey data being sent
    const surveyValidator = jsonschema.validate(req.body, newSurveySchema);
    if (!surveyValidator.valid) {
      const errs = surveyValidator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    //validate the question data being sent
    for (let question of req.body.questions) {
      const questionValidator = jsonschema.validate(question, questionSchema);
      if (!questionValidator.valid) {
        const errs = questionValidator.errors.map((e) => e.stack);
        throw new BadRequestError(`Question Validation Failed: ${errs}`);
      }

      // If question type is "Multiple Choice", validate the option data being sent
      if (question.question_type === "Multiple Choice") {
        for (let option of question.options) {
          const choiceValidator = jsonschema.validate(option, choiceSchema);
          if (!choiceValidator.valid) {
            const errs = choiceValidator.errors.map((e) => e.stack);
            throw new BadRequestError(`Choice Validation Failed: ${errs}`);
          }
        }
      }
    }

    const survey = await Survey.create(req.params.user_id, req.body);
    return res.status(201).json({ survey });
  } catch (err) {
    return next(err);
  }
});

router.get("/:user_id/all", ensureCorrectUser, async (req, res, next) => {
  try {
    const surveys = await Survey.getAllSurveys(req.params.user_id);
    return res.json({ surveys });
  } catch (err) {
    return next(err);
  }
});

router.get(
  "/:user_id/:survey_id",
  ensureCorrectUser,
  async (req, res, next) => {
    try {
      const survey = await Survey.getSurvey(req.params.survey_id);
      return res.json({ survey });
    } catch (err) {
      return next(err);
    }
  }
);

router.delete(
  "/:user_id/:survey_id",
  ensureCorrectUser,
  async (req, res, next) => {
    try {
      await Survey.deleteSurvey(req.params.user_id, req.params.survey_id);
      return res.json({ deleted_survey: req.params.survey_id });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
