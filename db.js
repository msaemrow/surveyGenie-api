const { Client } = require("pg");
const { DATABASE_URL } = require("./config");
require("dotenv").config();

const dbConfig = DATABASE_URL
  ? { connectionString: DATABASE_URL }
  : {
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: DATABASE_URL,
    };

const db = new Client(dbConfig);

db.connect();

module.exports = db;
