const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: "AKIASTVP7WBB362QJW5I",
  secretAccessKey: "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",
  region: "ap-south-1",
});

const ses = new AWS.SES();

const send_email = (to, subject, text) => {
  return new Promise(async (resolve, reject) => {
    try {
      const params = {
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Body: {
            Text: { Data: text },
          },
          Subject: { Data: subject },
        },
        Source: "no-reply@srmmilan.org",
      };
      const res = await ses.sendEmail(params).promise();
      return resolve({ message: "Email sent Successfully!", res });
    } catch (error) {
      return reject(error);
    }
  });
};

const send_email_attach = (to, subject, text) => {
  return new Promise(async (resolve, reject) => {
    try {
      const params = {
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Body: {
            Text: { Data: text },
          },
          Subject: { Data: subject },
          Atta,
        },

        Source: "no-reply@srmmilan.org",
      };
      const res = await ses.sendEmail(params).promise();
      return resolve({ message: "Email sent Successfully!", res });
    } catch (error) {
      return reject(error);
    }
  });
};

const mass_mailer = (emails, subject, text, html) => {
  return new Promise(async (resolve, reject) => {
    try {
      const params = {
        Destination: {
          ToAddresses: emails,
        },
        Message: {
          Body: { Html: { Data: html } },
          Subject: { Data: subject },
        },
        Source: "no-reply@srmmilan.org",
      };
      const res = await ses.sendEmail(params).promise();
      return resolve({ message: "Emails sent Successfully!", res });
    } catch (error) {
      return reject(error);
    }
  });
};

const templated_mass_mailer = (emails, templateName, template_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const params = {
        Source: "techteam.sa@srmist.edu.in",
        Template: templateName,
        Destination: {
          ToAddresses: emails,
        },
        TemplateData: "",
        DefaultTemplateData: '{ "name":"Participant"}',
      };

      const res = await ses.sendTemplatedEmail(params).promise();
      return resolve({ message: "Email sent Successfully!", res });
    } catch (error) {
      return reject(error);
    }
  });
};

const create_template = (name, subject, text, html) => {
  return new Promise(async (resolve, reject) => {
    try {
      const params = {
        Template: {
          TemplateName: name,
          SubjectPart: subject,
          TextPart: text,
          HtmlPart: html,
        },
      };
      const res = await ses.createTemplate(params).promise();
      return resolve({ message: "Template Created", res });
    } catch (error) {
      return reject(error);
    }
  });
};
const get_template = (name) => {
  return new Promise(async (resolve, reject) => {
    try {
      const params = {
        TemplateName: name,
      };
      const res = await ses.getTemplate(params).promise();
      return resolve({ message: "Template Created", res: res });
    } catch (error) {
      return reject(error);
    }
  });
};

module.exports = {
  mass_mailer,
  create_template,
  get_template,
  templated_mass_mailer,
  send_email,
  send_email_attach,
};
