const joi = require("joi");
const {
  Response
} = require("../utils");
const registerSchema = async (req, res, next) => {
  try {
    const schema = joi.object({
      emailId: joi.string().email().required(),
      fullName: joi.string().required(),
      password: joi.string().required(),
      regNo: joi.string().required(),
      collegeName: joi.string().required(),
      contactNum: joi.string().required(),
      accomodation: joi.string().required(),
      role: joi.string().required(),
      gender: joi.string().required()
    });
    req.body = await schema.validateAsync(req.body);
    next();
  } catch (err) {
    return res.status(400).json(Response(400, "Validation Error", err));
  }
};
module.exports = {
  registerSchema
};