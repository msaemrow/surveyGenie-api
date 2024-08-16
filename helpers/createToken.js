const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/** return signed JWT from user data. */

function createToken(user) {
  let payload = {
    user_id: user.id,
    first_name: user.first_name,
  };

  const token = jwt.sign(payload, SECRET_KEY);
  return token;
}

module.exports = { createToken };
