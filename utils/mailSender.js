// const nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");

const mailSender = async (email, title, body) => {
  try {
    /* 
    // Nodemailer implementation commented out as requested
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
    */

    // SendGrid implementation
    // Make sure you have SENDGRID_API_KEY in your .env file
    // and that your EMAIL_USER is a verified sender in SendGrid
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: email,
      from: process.env.EMAIL_USER, 
      subject: title,
      html: body,
    };
    
    const info = await sgMail.send(msg);
    return info;
  } catch (error) {
    console.error("Mail Sender Error:", error.message);
    if (error.response) {
      console.error(error.response.body);
    }
    // Do not throw so that API requests do not fail on email notification issues
    return null;
  }
};

module.exports = mailSender;

