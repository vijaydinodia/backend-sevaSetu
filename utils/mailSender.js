const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
  try {
    // Gmail SMTP Configuration using Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: (process.env.EMAIL_USER || "").trim(),
        pass: (process.env.EMAIL_PASS || "").trim(),
      },
    });

    const info = await transporter.sendMail({
      from: `"SevaSetu Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: title,
      html: body,
    });

    return info;
  } catch (error) {
    console.error("Mail Sender Error:", error.message);
    if (error.response) {
      console.error(error.response.body);
    }
    return null;
  }
};

module.exports = mailSender;


