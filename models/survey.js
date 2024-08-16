"use strict";

/** Model for survey */

const db = require("../db");
const { NotFoundError, ExpressError } = require("../expressError");

const { sqlForPartialUpdate } = require("../helpers/sql");

class Survey {
  /** Creates survey with data inputted by user.
   *
   * Data format:
   *        {
   *          title,
   *          survey_description,
   *          questions: [
   *              { id, question_text, question_type, options: [option, ...] },
   *              ...
   *           ]
   *        }
   *
   * Returns:
   *   {
   *      survey: {
   *          title,
   *          survey_description,
   *          questions: [
   *              { id, question_text, question_type, options: [option, ...] },
   *              ...
   *           ]
   *      }
   *   }
   *
   * Throws BadRequestError on duplicates.
   **/
  static async create(user_id, survey) {
    const id = parseInt(user_id, 10);
    if (!id || typeof id !== "number") {
      throw new ExpressError("Invalid or missing user id");
    }

    if (
      !survey ||
      typeof survey !== "object" ||
      Array.isArray(survey) ||
      !survey.title ||
      !survey.survey_description
    ) {
      throw new ExpressError("Invalid or missing survey data");
    }

    try {
      await db.query("BEGIN");
      const surveyResult = await db.query(
        `INSERT INTO surveys
          (user_id,
          title,
          survey_description)
          VALUES ($1, $2, $3)
          RETURNING id, user_id, title, survey_description`,
        [id, survey.title, survey.survey_description]
      );

      const createdSurvey = surveyResult.rows[0];
      const surveyId = createdSurvey.id;
      let questionsList = [];

      for (let question of survey.questions) {
        if (!question.question_text || !question.question_type) {
          throw new ExpressError("Missing question data");
        }

        const questionResult = await db.query(
          `INSERT INTO questions
                  (question_text,
                  survey_id,
                  question_type)
                  VALUES ($1, $2, $3)
                  RETURNING question_id, question_text, question_type`,
          [question.question_text, surveyId, question.question_type]
        );
        let createdQuestion = questionResult.rows[0];
        questionsList.push(createdQuestion);
        if (question.question_type === "Multiple Choice") {
          if (question.options.length === 0) {
            throw new ExpressError("Missing question option data");
          }
          for (let option of question.options) {
            if (!option.choice_text) {
              throw new ExpressError("Missing question option data");
            }

            await db.query(
              `INSERT INTO choices
                      (question_id,
                      choice_text)
                  VALUES($1, $2)
                  RETURNING choice_id, choice_text`,
              [createdQuestion.question_id, option.choice_text]
            );
          }
        }
      }
      await db.query(
        `UPDATE users
         SET num_surveys = num_surveys + 1
         WHERE id = $1`,
        [user_id]
      );

      await db.query("COMMIT");

      return { ...createdSurvey, questions: questionsList };
    } catch (err) {
      await db.query("ROLLBACK");
      throw new ExpressError(`Failed to create survey. ${err.message}`);
    }
  }

  /**
   * @param {*} user_id
   * @returns array of survey objects that contain the survey_id, title and description for all surveys created by a user
   */
  static async getAllSurveys(user_id) {
    const userCheck = await db.query(
      `SELECT id
      FROM users
      WHERE id = $1`,
      [user_id]
    );

    if (userCheck.rows.length === 0)
      throw new NotFoundError(`No user found with id: ${user_id}`);

    const res = await db.query(
      `SELECT id,
        title,
        survey_description
      FROM surveys
      WHERE user_id = $1`,
      [user_id]
    );

    return res.rows;
  }

  /**
   *
   * @param {*} survey_id
   * @returns object containing title, description, questions and choices for one survey
   */
  static async getSurvey(survey_id) {
    const res = await db.query(
      `SELECT 
        s.id as survey_id,
        s.title as survey_title,
        s.survey_description,
        q.question_id,
        q.question_text,
        q.question_type,
        c.choice_id,
        c.choice_text
      FROM surveys s
      LEFT JOIN questions q ON s.id = q.survey_id
      LEFT JOIN choices c ON q.question_id = c.question_id
      WHERE s.id=$1
      ORDER BY q.question_id, c.choice_id`,
      [survey_id]
    );

    const surveyRows = res.rows;

    if (surveyRows.length === 0)
      throw new NotFoundError(`No survey found with id: ${survey_id}`);

    const survey = {
      id: surveyRows[0].survey_id,
      title: surveyRows[0].survey_title,
      survey_description: surveyRows[0].survey_description,
      questions: [],
    };

    const questionMap = {};
    for (const row of surveyRows) {
      if (row.question_id && !questionMap[row.question_id]) {
        questionMap[row.question_id] = {
          id: row.question_id,
          text: row.question_text,
          type: row.question_type,
          options: [],
        };
        survey.questions.push(questionMap[row.question_id]);
      }
      if (row.choice_id) {
        questionMap[row.question_id].options.push({
          id: row.choice_id,
          text: row.choice_text,
        });
      }
    }
    return survey;
  }

  /**
   * @param {*} survey_id
   * @returns updated survey object
   */
  static async updateSurvey(survey_id) {}

  /**
   * @param {*} survey_id
   * @returns undefined
   */
  static async deleteSurvey(user_id, survey_id) {
    const res = await db.query(
      `DELETE
        FROM surveys
        WHERE id=$1
        RETURNING id`,
      [survey_id]
    );

    await db.query(
      `UPDATE users
       SET num_surveys = num_surveys - 1
       WHERE id = $1`,
      [user_id]
    );

    const deletedSurvey = res.rows[0];
    if (!deletedSurvey)
      throw new NotFoundError(`No survey found with id: ${survey_id}`);
  }

  /**
   * @param {*} response
   * @returns response_id timestamp of completion and survey_id
   */
  static async completeSurvey(response) {
    if (!response || typeof response !== "object" || Array.isArray(response)) {
      throw new ExpressError("Invalid response format");
    }

    const { survey_id, responses } = response;

    if (!survey_id) {
      throw new ExpressError("Missing or invalid survey id");
    }

    if (!responses || typeof responses !== "object") {
      throw new ExpressError("Invalid or missing responses");
    }

    const timestamp = new Date().toISOString();

    try {
      await db.query("BEGIN");
      const surveySubmission = await db.query(
        `INSERT INTO responses
          (survey_id,
          completed_at)
          VALUES($1, $2)
          RETURNING id, survey_id, completed_at`,
        [response.survey_id, timestamp]
      );
      const sumbittedSurvey = surveySubmission.rows[0];
      const responseId = sumbittedSurvey.id;
      let insertedAnswers = [];

      for (const [key, answerText] of Object.entries(responses)) {
        const questionId = parseInt(key, 10);
        if (isNaN(questionId) || typeof answerText !== "string") {
          throw new ExpressError("Invalid question_id or answer_text format");
        }

        const answer = await db.query(
          `INSERT INTO answers
            (response_id,
            question_id,
            answer_text)
            VALUES($1, $2, $3)
            RETURNING id, response_id, question_id, answer_text`,
          [responseId, questionId, answerText]
        );
        insertedAnswers.push(answer.rows[0]);
      }
      await db.query("COMMIT");
      return { ...sumbittedSurvey, answers: insertedAnswers };
    } catch (err) {
      await db.query("ROLLBACK");
      throw new ExpressError(`Failed to complete survey. ${err.message}`);
    }
  }
}

module.exports = Survey;
