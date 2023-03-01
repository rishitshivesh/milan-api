const { send_email, mass_mailer } = require("./ses");
const { Response } = require("./index");
const QRCode = require("qrcode");
const { MailTemplate } = require("./template/ticketAdd");
const { TeamMailTemplate } = require("./template/team");
const { RegisterMailTemplate } = require("./template/register");
const { EventMailTemplate } = require("./template/event");
const { encrypt } = require("./encrypt");
const { uploadImage } = require("./s3");

async function ticketMailer(ticket, user) {
  try {
    const data = await JSON.stringify(user.emailId);
    const qR = await QRCode.toDataURL(data, {
      type: "png",
    }).then(async (url) => {
      const img = await uploadImage(url, user.emailId);
      return img;
    });
    const template = await MailTemplate(user, ticket, qR);
    // console.log("generation", template);
    const mail = await mass_mailer(
      [user.emailId],
      "Thank you for Registering for Milan '23!",
      "",
      template
    );

    return Response(200, "Ticket sent", mail);
  } catch (error) {
    return Response(500, "Internal Server Error", error);
  }
}

async function registerMailer(user, pwd) {
  try {
    // console.log("generation", template);

    const template = await RegisterMailTemplate(user, pwd);
    // console.log(qR);

    const mail = await mass_mailer(
      [user.emailId],
      "Thank you for Signing up for Milan '23!",
      "",
      template
    );

    return Response(200, "Email sent", mail);
  } catch (error) {
    return Response(500, "Internal Server Error", error);
  }
}

async function eventMailer(user, event) {
  try {
    const template = await EventMailTemplate(user, event[0]);
    const mail = await mass_mailer(
      [user.emailId],
      `Successfully Registered for ${event[0]["eventName"]}`,
      "",
      template
    );

    return Response(200, "Email sent", mail);
  } catch (error) {
    return Response(500, "Internal Server Error", error);
  }
}

async function teamEventMailer(user, event, team) {
  try {
    const template = await TeamMailTemplate(user, event[0], team);
    const mail = await mass_mailer(
      [user.emailId],
      `Successfully Registered for ${event[0]["eventName"]}`,
      "",
      template
    );

    return Response(200, "Email sent", mail);
  } catch (error) {
    return Response(500, "Internal Server Error", error);
  }
}

module.exports = { ticketMailer, registerMailer, eventMailer, teamEventMailer };
