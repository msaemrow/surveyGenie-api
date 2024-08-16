"use strict";

/** Routes for responses */

const express = require("express");
const Response = require("../models/response");
const db = require("../db");

const router = new express.Router();

router.get("/summary/:survey_id", async (req, res, next) => {
  try {
    const responses = await Response.getSurveySummary(req.params.survey_id);
    return res.json({ responses });
  } catch (err) {
    return next(err);
  }
});

router.get("/data/:survey_id", async (req, res, next) => {
  try {
    const surveyChartData = await Response.getSurveyChartData(
      req.params.survey_id
    );
    return res.json({ surveyChartData });
  } catch (err) {
    return next(err);
  }
});

router.get("/:response_id", async (req, res, next) => {
  try {
    const response = await Response.getResponse(req.params.response_id);
    return res.json({ response });
  } catch (err) {
    return next(err);
  }
});

router.delete("/:response_id", async (req, res, next) => {
  try {
    await Response.deleteResponse(req.params.response_id);
    return res.json({ deleted_response: req.params.response_id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
