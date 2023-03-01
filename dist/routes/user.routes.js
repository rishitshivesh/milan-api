const router = require("express").Router();
const DB = require("../db");
const axios = require("axios");
const {
  decrypt
} = require("../utils/encrypt");
const {
  Response,
  verifyHash,
  verifyToken,
  generateToken,
  hash
} = require("../utils");
var randomString = require("randomstring");
const {
  registerMailer
} = require("../utils/mailer");
const {
  isAuthenticated,
  isAuthorized
} = require("../middlewares/auth.middleware");
const {
  registerSchema
} = require("../middlewares/user.middleware");
const TABLE_NAME = process.env.TABLE_NAME;
router.get("/users", async (req, res) => {
  try {
    const user = await DB.queryBeginsWith("milan", `user#`, TABLE_NAME);
    // return res.status(200).json(Response(200, "Users", users));
    return res.status(200).json(Response(200, "All Users", user));
  } catch (error) {
    // return res.status(500).json(Response(500, "Internal Server Error", error));
  }
});
router.post("/admin/user", async (req, res) => {
  try {
    const {
      emailId,
      contactNum,
      regNo,
      fullName,
      userType,
      uID
    } = req.body;
    const adminDetails = {
      pk: "milan",
      sk: `admin#${emailId}`,
      emailId,
      contactNum,
      regNo,
      fullName,
      userType,
      uID,
      createdOn: new Date().toISOString()
    };
    const result = await DB.update(adminDetails, TABLE_NAME);
    return res.status(200).json(Response(200, "User added successfully", result));
  } catch (error) {
    return res.status(500).json(Response(500, "Internal Server Error", error));
  }
});
router.get("/admin/user/:emailId", async (req, res) => {
  try {
    const users = await DB.get("milan", `admin#${req.params.emailId}`, TABLE_NAME);
    if (!users) {
      return res.status(400).json(Response(400, "Admin does not exist"));
    }
    // const user = await DB.get("milan", `user#${req.params.id}`, TABLE_NAME);

    return res.status(200).json(Response(200, "Admin details fetched successfully", users));
  } catch (error) {
    return res.status(500).json(Response(500, "Internal Server Error", error));
  }
});
router.post("/users/register", async (req, res) => {
  try {
    const {
      fullName,
      emailId,
      regNo,
      collegeName,
      contactNum,
      accomodation,
      password,
      gender,
      role
    } = req.body;
    // console.log(req.body);
    if (!fullName || !emailId || !regNo || !password || !collegeName || !contactNum || !accomodation, !gender) {
      return res.status(400).json(Response(400, "Missing parameters"));
    }
    // const user = await DB.get(email, "USER", TABLE_NAME);
    // console.log(TABLE_NAME);
    const user = await DB.get("milan", `user#${emailId}`, TABLE_NAME);
    // console.log(user);
    if (user) {
      return res.status(400).json(Response(400, "User already exists"));
    }
    const uID = "MILAN-" + Math.floor(20000 + Math.random() * 9999);
    const accessToken = generateToken({
      emailId
    });

    // const password = randomString.generate(10);
    // const pwd = await hash(password);
    const newUser = {
      pk: "milan",
      sk: `user#${emailId}`,
      uID,
      emailId,
      password,
      fullName,
      regNo,
      collegeName,
      contactNum,
      accomodation,
      gender,
      role: role ? role : "user",
      createdOn: new Date().toISOString()
    };
    // console.log(newUser);
    await DB.put(newUser, TABLE_NAME);
    if (accomodation != false) {
      const status = JSON.parse(accomodation);
      var accomodationData = [];
      for (var i = 0; i <= 3; i++) {
        if (status[i]) {
          var newAccomodation = {
            pk: "milan",
            sk: `accomodation#${emailId}#day${i}`,
            uID,
            emailId,
            day: i,
            gender: gender,
            createdOn: new Date().toISOString()
          };
          await DB.put(newAccomodation, TABLE_NAME);
          // accomodationData.push(newAccomodation);
        }
      }

      await Promise.all(accomodationData);
    }
    return res.status(201).json(Response(201, "User Registered", {
      ...newUser,
      accessToken
    }));
  } catch (error) {
    return res.status(500).json(Response(500, "Internal Server Error", error));
  }
});
router.post("/login", async (req, res) => {
  try {
    const {
      emailId,
      password
    } = req.body;
    if (!emailId || !password) {
      return res.status(400).json(Response(400, "Missing parameters"));
    }
    const user = await DB.get("milan", `user#${emailId}`, TABLE_NAME);
    if (!user) {
      return res.status(400).json(Response(400, "User not found"));
    }
    // const isMatch = await verifyHash(password, user.password);
    if (password != user.password) {
      return res.status(400).json(Response(400, "Invalid credentials"));
    }
    const accessToken = generateToken({
      emailId
    });
    return res.status(200).json(Response(200, "Success", {
      ...user,
      accessToken
    }));
  } catch (error) {
    return res.status(500).json(Response(500, "Internal Server Error", error));
  }
});
router.post("/user/update/:id", isAuthenticated, async (req, res) => {
  try {
    const emailId = req.params.id;
    console.log(emailId);
    const user = await DB.get("milan", `user#${emailId}`, TABLE_NAME);
    if (!user) {
      return res.status(400).json(Response(400, "User does not exist"));
    }
    var pass = null;
    if (req.body.password) {
      const pwd = await hash(req.body.password);
      pass = pwd;
    }
    const updatedUser = {
      ...user,
      ...req.body,
      uID: user.uID,
      pk: "milan",
      sk: `user#${emailId}`,
      role: user.role,
      accomodation: user.accomodation,
      emailId: req.params.id,
      password: pass ? pass : user.password,
      updatedOn: new Date().toISOString()
    };
    const result = await DB.put(updatedUser, TABLE_NAME);
    return res.status(200).json(Response(200, "User updated successfully", result));
  } catch (error) {
    return res.status(500).json(Response(500, "Internal Server Error", error));
  }
});

// get all events of a user by emailId

router.get("/user/events/:emailId", isAuthenticated, async (req, res) => {
  try {
    const {
      emailId
    } = req.params;
    const user = await DB.get("milan", `user#${emailId}`, TABLE_NAME);
    if (!user) {
      return res.status(400).json(Response(400, "User does not exist"));
    }
    const events = await DB.queryBeginsWith("milan", `userEvent#${emailId}`, TABLE_NAME);
    var list = [];
    for (let i in events) {
      var event = await DB.queryWithFilter("milan", `event`, "id", events[i].eventId, TABLE_NAME);
      list.push(...event);
    }
    return res.status(200).json(Response(200, `All events of ${user.fullName} (${user.emailId})`, list));
  } catch (error) {
    return res.status(500).json(Response(500, "Internal Server Error", error));
  }
});
router.get("/tempPassVerify", async (req, res) => {
  const {
    token
  } = req.body;
  //   const hashedPass = await hash(process.env.TICKET_PAYLOAD_TOKEN);
  const isMatch = await verifyHash(process.env.TICKET_PAYLOAD_TOKEN, token);
  //   console.log(token);
  return res.status(200).json(Response(200, "Success", isMatch));
});
router.get("/accomodation", async (req, res) => {
  try {
    const data = await DB.queryBeginsWith("milan", "accomodation", TABLE_NAME);
    // console.log(data);
    var resData = {
      0: {
        male: 50,
        female: 50
      },
      1: {
        male: 50,
        female: 50
      },
      2: {
        male: 50,
        female: 50
      },
      3: {
        male: 50,
        female: 50
      }
    };
    // console.log(data);
    if (data.length && data.length > 0) {
      for (let i in data) {
        const gender = data[i]["gender"].toLowerCase();
        resData[data[i]["day"]][gender] -= 1;
      }
    }
    console.log(resData);
    return res.status(200).json(Response(200, "Success", resData));
  } catch (error) {
    return res.status(500).json(Response(500, "Internal Server Error", error));
  }
});

// router.post("/verifyCaptcha", async (req, res) => {
//   try {
//     // const secret = "6LfBQK0kAAAAAAHYD2Qp1Lhfc4EwgXomnj51dlav";
//     const response = req.body.token;
//     // const data = await axios
//     //   .post(
//     //     `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${response}`
//     //   )
//     //   .then((resp) => {
//     //     console.log(resp.data);
//     //     return resp.data;
//     //   });

//     const data = await fetch(
//       `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${response}`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     ).then((resp) => {
//       console.log(resp);
//       return resp.json();
//     });

//     console.log(dat);
//     return res.status(200).json(Response(200, "Success", data));
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json(Response(500, "Internal Server Error", err));
//   }
// });

router.get("/accomodation/:id", async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const data = await DB.queryBeginsWith("milan", `accomodation#${id}`, TABLE_NAME);
    // console.log(data);
    // const resData = JSON.parse(data.accomodation)

    return res.status(200).json(Response(200, "Success", data));
  } catch (error) {
    return res.status(500).json(Response(500, "Internal Server Error", error));
  }
});
module.exports = router;