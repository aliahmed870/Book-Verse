const nodemailer = require('nodemailer');

const sendEmial = async (options) => {
  // - create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAILPORT,
    auth: {
      user: process.env.EMIAL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  // - defife email option
  const mailOptions = {
    from: 'Ali Ahmed <hello@ali.io>',
    to: options.email,
    subject: options.subject,
    text: options.message || options.text,
  };
  // - Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmial;
