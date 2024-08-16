"use strict";

/** Model for response */

const db = require("../db");
const { NotFoundError } = require("../expressError");

class Response {
  /**
   *
   * @param {*} surveyId
   */
  static async getSurveySummary(surveyId) {
    const res = await db.query(
      `SELECT id,
      survey_id,
      completed_at
      FROM responses
      WHERE survey_id = $1`,
      [surveyId]
    );

    if (res.rows.length === 0)
      throw new NotFoundError(`No survey found with id: ${surveyId}`);

    return res.rows;
  }

  /**
   *
   * @param {*} response_id
   */
  static async getResponse(responseId) {
    let res = await db.query(
      `SELECT
        r.id AS response_id,
        r.survey_id,
        r.completed_at,
        a.id AS answer_id,
        a.question_id,
        a.answer_text,
        q.question_text
      FROM 
        responses r
      LEFT JOIN
        answers a ON r.id = a.response_id
      LEFT JOIN
        questions q ON a.question_id = q.question_id
      WHERE r.id = $1`,
      [responseId]
    );

    if (res.rows.length === 0)
      throw new NotFoundError(
        `No responses found for survey with id: ${responseId}`
      );

    const response = {
      response_id: res.rows[0].response_id,
      survey_id: res.rows[0].survey_id,
      completed_at: res.rows[0].completed_at,
      answers: [],
    };

    for (const row of res.rows) {
      if (row.answer_id) {
        response.answers.push({
          id: row.answer_id,
          question_id: row.question_id,
          question_text: row.question_text,
          answer_text: row.answer_text,
        });
      }
    }
    return response;
  }

  /**
   *
   * @param {*} survey_id
   */
  static async getSurveyChartData(survey_id) {
    const res = await db.query(
      `SELECT r.id as response_id, r.completed_at AS timestamp, q.question_id, q.question_text, q.question_type, a.answer_text
      FROM responses r
      JOIN answers a ON r.id = a.response_id
      JOIN questions q ON a.question_id = q.question_id
      WHERE q.survey_id = $1
      ORDER BY r.id, q.question_id`,
      [survey_id]
    );

    // if (res.rows.length === 0)
    //   throw new NotFoundError(
    //     `No responses found for survey with id: ${survey_id}`
    //   );
    return res.rows;
  }

  /**
   *
   * @param {*} responseId
   */
  static async deleteResponse(responseId) {
    const res = await db.query(
      `DELETE 
        FROM responses
        WHERE id = $1
        RETURNING id`,
      [responseId]
    );
    const deletedResponse = res.rows[0];
    if (!deletedResponse)
      throw new NotFoundError(`No response found with id: ${responseId}`);
  }

  /**
   *
   * @param {*} user_id
   */
  static async getAllSurveySummaries(user_id) {}
}

module.exports = Response;
