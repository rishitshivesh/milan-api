const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  DB
} = require("../db");
const TABLE_NAME = process.env.TABLE_NAME;
function Response(statusCode, message, data = null) {
  return {
    statusCode,
    message,
    data
  };
}
async function hash(value) {
  return await bcrypt.hash(value, 12);
}
async function verifyHash(plain, hashed) {
  return await bcrypt.compare(plain, hashed);
}
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "5d"
  });
}
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
function verifyEmail(email) {
  const chk = email.split("@");
  return chk[1] == "srmist.edu.in";
}
function addEvents() {
  var lst = [0, 25, 50, 75];
  for (i in lst) {
    var data = require("../dummyData/data" + lst[i] + ".json");
    data.forEach(async item => {
      await DB.put(item, TABLE_NAME);
    });
  }
}
module.exports = {
  Response,
  hash,
  verifyHash,
  generateToken,
  verifyToken,
  verifyEmail,
  addEvents
};