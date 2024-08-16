const { BadRequestError } = require("../expressError");

// This function generates SQL for updating select columns of a table
// based on the provided data. It takes in two arguments:
// @param {object} dataToUpdate (required)
// @param {object} jsToSql (optional)

// @returns {object} An object containing the following properties:
//  *   - setCols: columns to be updated
//  *   - values: array of values to be updated

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  jsToSql = jsToSql || {};
  // {first_name: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
