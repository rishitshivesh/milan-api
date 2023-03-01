const express = require("express");
const app = express();
const cors = require("cors");

const user = require("./routes/user.routes");
const tickets = require("./routes/ticket.routes");
const event = require("./routes/event.routes");
const port = process.env.PORT || 4000;

const { addEvents } = require("./utils");

require("dotenv").config();

// addEvents()

app.use(express.json());
app.use(cors());

app.use("/api/v1", user);
app.use("/api/v1", tickets);
app.use("/api/v1", event);

app.get("/", (req, res) => {
  // send a status of 200
  res.status(200).json({
    message: "Welcome to the Milan API",
  });
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

// module.exports.app = app  ;
