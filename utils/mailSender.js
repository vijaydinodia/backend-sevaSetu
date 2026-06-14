const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
  try {
    // console.log("EMAIL_USER:", process.env.EMAIL_USER);
    // console.log("EMAIL_PASS:", process.env.EMAIL_PASS);
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"Seva Setu" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: title,
      html: body,
    });

    return info;
  } catch (error) {
    console.error("Mail Sender Error:", error.message);
    // Do not throw so that API requests do not fail on email notification issues
    return null;
  }
};

module.exports = mailSender;
