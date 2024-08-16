-- \echo 'Delete and recreate surveyGenie db?'
-- \prompt 'Return for yes or control-C to cancel > ' foo

-- DROP DATABASE IF EXISTS survey-genie;
-- CREATE DATABASE survey-genie;
\connect survey-genie

\i surveyGenie-schema.sql
\i surveyGenie-seed.sql

-- \echo 'Delete and recreate survey_genie_test db?'
-- \prompt 'Return for yes or control-C to cancel > ' foo

-- DROP DATABASE IF EXISTS survey_genie_test;
-- CREATE DATABASE survey_genie_test;
-- \connect survey_genie_test

-- \i surveyGenie-schema.sql
