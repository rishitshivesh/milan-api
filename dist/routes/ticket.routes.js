const router = require("express").Router();
const DB = require("../db");
const {
  Response,
  verifyHash,
  verifyToken,
  generateToken,
  hash
} = require("../utils");
const {
  isAuthenticated,
  isAuthorized,
  isPaymentAuthenticated
} = require("../middlewares/auth.middleware");

// const { ticketMailer } = require("../utils/mailer");

const TABLE_NAME = process.env.TABLE_NAME;
const ticketTypes = {
  1: {
    amnt: "25000",
    name: "Common Registration",
    desc: "All the events minus pro shows"
  },
  2: {
    amnt: "75000",
    name: "Pro Registration",
    desc: "All the events including pro shows"
  },
  3: {
    amnt: "100000",
    name: "Early Bird",
    desc: "All the events including pro shows"
  }
};
router.post("/ticket/add", isPaymentAuthenticated, async (req, res) => {
  try {
    const {
      emailId,
      pID,
      ticketPrice
    } = req.body;
    // var { ticketType } = req.body;

    if (!emailId || !pID || !ticketPrice) {
      return res.status(400).json(Response(400, "Missing parameters"));
    }
    const user = await DB.get("milan", `user#${emailId}`, TABLE_NAME);
    if (!user) {
      return res.status(400).json(Response(400, "User does not exist"));
    }
    const ticket = await DB.get("milan", `ticket#${emailId}`, TABLE_NAME);
    if (ticket) {
      return res.status(400).json(Response(400, "Ticket already exists"));
    }
    var ticketType = null;
    if (parseInt(ticketPrice) >= 240 && parseInt(ticketPrice) < 310) {
      ticketType = 1;
    } else if (parseInt(ticketPrice) >= 740 && parseInt(ticketPrice) <= 900) {
      ticketType = 2;
    } else if (parseInt(ticketPrice) >= 1000) {
      ticketType = 3;
    } else {
      return res.status(400).json(Response(400, "Ticket price is not valid"));
    }
    var newTicket = {};
    if (ticketType == 3) {
      newTicket = {
        pk: "milan",
        sk: `ticket#${emailId}`,
        uId: emailId,
        pID,
        ticketType,
        checkIn1: false,
        checkIn2: false,
        checkIn3: false,
        checkIn4: false,
        ticketIssued: false,
        purchasedAt: new Date().toISOString()
      };
    } else {
      newTicket = {
        pk: "milan",
        sk: `ticket#${emailId}`,
        uId: emailId,
        pID,
        ticketType,
        ticketIssued: false,
        purchasedAt: new Date().toISOString()
      };
    }
    const result = await DB.put(newTicket, TABLE_NAME);
    // await ticketMailer(newTicket, user);

    return res.status(200).json(Response(200, "Ticket created successfully", result));
  } catch (error) {
    return res.status(500).json(Response(500, "Internal Server Error", error));
  }
});

// router.post("/temp", isPaymentAuthenticated, async (req, res) => {
//   return res.json({ msg: "Hello" });
// });

router.put("/ticket/update/:id", isAuthenticated, async (req, res) => {
  try {
    const {
      ticketType,
      checkedInBy,
      barcode
    } = req.body;
    const checkIn = true;
    if (!ticketType || !checkedInBy) {
      return res.status(400).json(Response(400, "Missing parameters"));
    }
    const ticket = await DB.get("milan", `ticket#${req.params.id}`, TABLE_NAME);
    if (!ticket) {
      return res.status(400).json(Response(400, "Ticket does not exist"));
    }
    const user = await DB.get("milan", `user#${req.params.id}`, TABLE_NAME);
    var updatedTicket = {};
    if (ticketType == 3) {
      if (ticket.checkIn1 == false && ticket.updatedAt == null) {
        ticket.checkIn1 = true;
        ticket.updatedAt = new Date().toISOString();
      } else if (ticket.checkIn2 == false && new Date(ticket.updatedAt) != new Date()) {
        ticket.checkIn2 = true;
        ticket.updatedAt = new Date().toISOString();
      } else if (ticket.checkIn3 == false && new Date(ticket.updatedAt) != new Date()) {
        ticket.checkIn3 = true;
        ticket.updatedAt = new Date().toISOString();
      }
      updatedTicket = {
        pk: "milan",
        sk: `ticket#${req.params.id}`,
        uId: req.params.id,
        pID: ticket.pID,
        ticketType,
        barcode,
        checkedInBy,
        updatedAt: new Date().toISOString()
      };
    } else {
      updatedTicket = {
        pk: "milan",
        sk: `ticket#${req.params.id}`,
        uId: req.params.id,
        pID: ticket.pID,
        ticketType,
        checkIn,
        checkedInBy,
        updatedAt: new Date().toISOString()
      };
    }
    const result = await DB.update(updatedTicket, TABLE_NAME);
    // ticketMailer(user, ticket);
    return res.status(200).json(Response(200, "Ticket updated successfully", result));
  } catch (error) {
    return res.status(500).json(Response(500, "Internal Server Error", error));
  }
});
router.put("/ticket/issue/:id", isAuthenticated, async (req, res) => {
  try {
    const ticket = await DB.get("milan", `ticket#${req.params.id}`, TABLE_NAME);
    if (!ticket) {
      return res.status(404).json(Response(404, "Ticket does not exist"));
    }
    if (ticket.ticketIssued) {
      return res.status(400).json(Response(400, "Ticket already issued", ticket));
    }
    const newTicketData = {
      ...ticket,
      ticketIssued: true
    };
    const result = await DB.put(newTicketData, TABLE_NAME);
    return res.status(200).json(Response(200, "Ticket Issued successfully", result));
  } catch (error) {
    return res.status(500).json(Response(500, "Internal Server Error", error));
  }
});
router.get("/payment/:id", isAuthenticated, async (req, res) => {
  try {
    const payment = await DB.get("milan", `payment#${req.params.id}`, TABLE_NAME);
    if (!payment) {
      return res.status(400).json(Response(400, "Ticket does not exist"));
    }
    // const user = await DB.get("milan", `user#${req.params.id}`, TABLE_NAME);

    return res.status(200).json(Response(200, "Ticket fetched successfully", payment));
  } catch (error) {
    return res.status(500).json(Response(500, "Internal Server Error", error));
  }
});
router.put("/payment/issue/:id", isAuthenticated, async (req, res) => {
  try {
    const ticket = await DB.get("milan", `payment#${req.params.id}`, TABLE_NAME);
    if (!ticket) {
      return res.status(404).json(Response(404, "Payment does not exist"));
    }
    if (ticket.ticketIssued) {
      return res.status(400).json(Response(400, "Payment already issued", ticket));
    }
    const newTicketData = {
      ...ticket,
      ticketIssued: true
    };
    const result = await DB.put(newTicketData, TABLE_NAME);
    return res.status(200).json(Response(200, "Ticket Issued successfully", result));
  } catch (error) {
    return res.status(500).json(Response(500, "Internal Server Error", error));
  }
});
router.get("/ticket/:id", isAuthenticated, async (req, res) => {
  try {
    const ticket = await DB.get("milan", `ticket#${req.params.id}`, TABLE_NAME);
    if (!ticket) {
      return res.status(400).json(Response(400, "Ticket does not exist"));
    }
    // const user = await DB.get("milan", `user#${req.params.id}`, TABLE_NAME);

    return res.status(200).json(Response(200, "Ticket fetched successfully", ticket));
  } catch (error) {
    return res.status(500).json(Response(500, "Internal Server Error", error));
  }
});
router.get("/early-bird", isAuthenticated, async (req, res) => {
  try {
    const data = await DB.queryBeginsWith("milan", "ticket#", TABLE_NAME);
    return res.status(200).json(Response(200, "Early bird Limit",
    // data?.length
    parseInt(process.env.EARLY_BIRD_LIMIT) - (data ? data.length : 0)));
  } catch (error) {
    return res.status(500).json(Response(500, "Internal Server Error", error));
  }
});
module.exports = router;