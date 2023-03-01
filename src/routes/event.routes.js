const router = require("express").Router();
const DB = require("../db");
const {
  Response,
  verifyHash,
  verifyToken,
  generateToken,
  hash,
  verifyEmail,
} = require("../utils");

const {
  isAuthenticated,
  isAuthorized,
  isPaymentAuthenticated,
} = require("../middlewares/auth.middleware");

const { eventMailer, teamEventMailer } = require("../utils/mailer");

const TABLE_NAME = process.env.TABLE_NAME;

// const { send_email, mass_mailer } = require("../utils/ses");

router.get("/events", async (req, res) => {
  try {
    const events = await DB.queryBeginsWith("milan", `events`, TABLE_NAME);
    return res.status(200).json(Response(200, "All Events", events));
  } catch (error) {
    return res.status(500).json(Response(500, "Internal Server Error", error));
  }
});

router.get("/events/:id", async (req, res) => {
  try {
    // const event = await DB.get("milan", `event#${req.params.id}`, TABLE_NAME);
    // const events = await DB.queryBeginsWith("milan", `event`, TABLE_NAME);
    // const event = await event.filter(
    //   (event) => event.id.split("#")[2] === req.params.id
    // );
    const { id } = req.params;
    const event = await DB.queryWithFilter(
      "milan",
      `event`,
      "id",
      id,
      TABLE_NAME
    );
    return res.status(200).json(Response(200, "Event Details", event));
  } catch (error) {
    return res.status(500).json(Response(500, "Internal Server Error", error));
  }
});

router.post("/event/register", isAuthenticated, async (req, res) => {
  try {
    const { emailId, eventId } = req.body;
    if (!emailId || !eventId) {
      return res.status(400).json(Response(400, "Missing parameters"));
    }
    const event = await DB.queryWithFilter(
      "milan",
      `event`,
      "id",
      eventId,
      TABLE_NAME
    );
    if (!event) {
      return res.status(400).json(Response(400, "Event doesn't exist"));
    }
    const user = await DB.get("milan", `user#${emailId}`, TABLE_NAME);
    if (!user) {
      return res.status(400).json(Response(400, "User doesn't exist"));
    }
    const userEvent = await DB.get(
      "milan",
      `userEvent#${emailId}#${eventId}`,
      TABLE_NAME
    );
    if (userEvent) {
      return res
        .status(400)
        .json(Response(400, "User already registered for this event"));
    }

    if (event.isSrmEvent && !verifyEmail(emailId)) {
      return res
        .status(400)
        .json(Response(400, "Event is exclusive to SRM Students"));
    }
    // console.log(event);
    const newUserEvent = {
      pk: "milan",
      sk: `userEvent#${emailId}#${eventId}`,
      emailId,
      eventId,
      createdAt: new Date().toISOString(),
    };
    const newEventUser = {
      pk: "milan",
      sk: `eventParticipants#${eventId}#${emailId}`,
      emailId,
      eventId,
      createdAt: new Date().toISOString(),
    };
    await DB.put(newEventUser, TABLE_NAME);
    await DB.put(newUserEvent, TABLE_NAME);

    // await eventMailer(user, event);

    return res
      .status(200)
      .json(Response(200, "User registered for event successfully", event));
  } catch (error) {
    return res.status(500).json(Response(500, "Internal Server Error", error));
  }
});

router.post("/event/register/team", isAuthenticated, async (req, res) => {
  try {
    const { emailId, eventId, teamName, teamId } = req.body;
    if (!emailId || !eventId) {
      return res.status(400).json(Response(400, "Missing parameters"));
    }
    if (!teamName && !teamId) {
      return res
        .status(400)
        .json(Response(400, "Either create or Join a Team"));
    }

    const event = await DB.queryWithFilter(
      "milan",
      `event`,
      "id",
      eventId,
      TABLE_NAME
    );
    const user = await DB.get("milan", `user#${emailId}`, TABLE_NAME);
    if (!user) {
      return res.status(400).json(Response(400, "User doesn't exist"));
    }
    var team = null;
    if (teamId) {
      team = await DB.get("milan", `team#${event.id}#${teamId}`, TABLE_NAME);
      if (!team) {
        return res.status(400).json(Response(400, "Team doesn't exist"));
      }
    }
    if (teamName) {
      const newTeamId =
        `MILAN-${event.Id}-TEAM-` + Math.floor(40000 + Math.random() * 9899);
      const newTeam = {
        pk: "milan",
        sk: `team#${event.id}#${newTeamId}`,
        teamId: newTeamId,
        name: teamName,
        eventId,
        createdAt: new Date().toISOString(),
      };

      await DB.put(newTeam, TABLE_NAME);
      team = newTeam;
    }
    const userEvent = await DB.get(
      "milan",
      `userEvent#${emailId}#${eventId}`,
      TABLE_NAME
    );
    if (userEvent) {
      return res
        .status(400)
        .json(Response(400, "User already registered for this event"));
    }

    if (event.isSrmEvent && !verifyEmail(emailId)) {
      return res
        .status(400)
        .json(Response(400, "Event is exclusive to SRM Students"));
    }

    const newUserEvent = {
      pk: "milan",
      sk: `userEvent#${emailId}#${eventId}`,
      emailId,
      eventId,
      teamId: team.teamId,
      teamName,
      createdAt: new Date().toISOString(),
    };
    const newEventUser = {
      pk: "milan",
      sk: `eventParticipants#${event.sk}#${emailId}`,
      emailId,
      eventId,
      teamName,
      teamId: team.teamId,
      createdAt: new Date().toISOString(),
    };
    await DB.put(newEventUser, TABLE_NAME);
    await DB.put(newUserEvent, TABLE_NAME);

    // await teamEventMailer(user, event, team);

    return res
      .status(200)
      .json(Response(200, "User registered for event successfully"));
  } catch (error) {
    return res.status(500).json(Response(500, "Internal Server Error", error));
  }
});

// get all users of an event
router.get("/event/users/:eventId", isAuthenticated, async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!eventId) {
      return res.status(400).json(Response(400, "Missing parameters"));
    }
    const event = await DB.queryWithFilter(
      "milan",
      `event`,
      "id",
      eventId,
      TABLE_NAME
    );
    if (!event) {
      return res.status(400).json(Response(400, "Event doesn't exist"));
    }
    const users = await DB.queryBeginsWith(
      "milan",
      `eventParticipants#${eventId}`,
      TABLE_NAME
    );
    var lst = [];

    for (var i = 0; i < users.length; i++) {
      var user = await DB.get("milan", `user#${users[i].emailId}`, TABLE_NAME);
      lst.push(user);
    }

    // const users = await DB.queryWithFilter(
    //   "milan",
    //   `eventParticipants#${event.id}`,
    //   "eventId",
    //   eventId,
    //   TABLE_NAME
    // );

    return res
      .status(200)
      .json(Response(200, "Users fetched successfully", lst));
  } catch (error) {
    return res.status(500).json(Response(500, "Internal Server Error", error));
  }
});

// router.post("/tryMail", async (req, res) => {
//   try {
//     // const { emailId, eventId } = req.body;
//     // const result = await send_email("rishitshivesh@gmail.com", "Test", "Test");
//     const emails = ["rishitshivesh@gmail.com", "sherwinbenjamin2828@gmail.com"];
//     const result = mass_mailer(
//       emails,
//       "Milan Test Subject",
//       "Test",
//       "<b>Try Me</b>"
//     );
//     return res
//       .status(200)
//       .json(Response(200, "Mail sent successfully", result));
//   } catch (error) {
//     return res.status(500).json(Response(500, "Internal Server Error", error));
//   }
// });

module.exports = router;
