const { Response, verifyToken, verifyHash } = require("../utils");
// const {verfifyHash} = require("../utils");

async function isAuthenticated(req, res, next) {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json(Response(401, "Unauthorized"));
    }
    const user = verifyToken(token);
    if (!user) {
      return res.status(401).json(Response(401, "Unauthorized"));
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json(Response(500, "Internal Server Error", error));
  }
}

async function isAdmin(req, res, next) {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json(Response(401, "Unauthorized"));
    }
    const user = verifyToken(token);
    if (!user || user.role !== "admin") {
      return res.status(401).json(Response(401, "Unauthorized"));
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json(Response(500, "Internal Server Error", error));
  }
}

async function isAuthorized(req, res, next) {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json(Response(401, "Unauthorized"));
    }
    const user = verifyToken(token);
    if (
      !user ||
      user.role !== "admin" ||
      user.role !== "convenor" ||
      user.role !== "teammember"
    ) {
      return res.status(401).json(Response(401, "Unauthorized"));
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json(Response(500, "Internal Server Error", error));
  }
}

async function isPaymentAuthenticated(req, res, next) {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json(Response(401, "Unauthorized"));
    }
    const match = await verifyHash(process.env.TICKET_PAYLOAD_TOKEN, token);
    if (!match) {
      return res.status(401).json(Response(401, "Unauthorized"));
    }
    next();
  } catch (error) {
    return res.status(500).json(Response(500, "Internal Server Error", error));
  }
}

module.exports = {
  isAuthenticated,
  isAdmin,
  isAuthorized,
  isPaymentAuthenticated,
};
