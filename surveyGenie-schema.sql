-- Schema design for survey_genie database

-- Create an enum type for question_type
CREATE TYPE question_type_enum AS ENUM ('Text', 'Yes or No', 'Multiple Choice');


-- users table
    -- data: { id, email, password, first_name, last_name, num_surveys }
    -- reference by: { surveys }
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL
        CHECK (position('@' IN email) > 1),
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    num_surveys INTEGER DEFAULT 0
);

-- surveys table
    -- data: { id, user_id, title, survey_description }
    -- reference by: { questions, responses }
CREATE TABLE surveys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    survey_description TEXT
);

-- questions table
    -- data: { question_id, question_text, survey_id, question_type }
    -- reference by: { choices, answers }    
CREATE TABLE questions (
    question_id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    survey_id INTEGER NOT NULL
        REFERENCES surveys(id) ON DELETE CASCADE,
    question_type question_type_enum NOT NULL
);

-- choices table
    -- data: { id, question_id, choice_text }
    -- reference by: { }
CREATE TABLE choices (
  choice_id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL
    REFERENCES questions(question_id) ON DELETE CASCADE,
  choice_text TEXT NOT NULL
);

-- responses table
    -- data: { id, survey_id, completed_at }
    -- reference by: { answers }
CREATE TABLE responses (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER NOT NULL
    REFERENCES surveys(id) ON DELETE CASCADE,
  completed_at TIMESTAMP NOT NULL
);

-- answers table
    -- data: { id, response_id, question_id, answer_text }
    -- reference by: { }
CREATE TABLE answers (
  id SERIAL PRIMARY KEY,
  response_id INTEGER NOT NULL
    REFERENCES responses(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL
    REFERENCES questions(question_id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL
);
