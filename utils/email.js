const nodemailer = require('nodemailer');

const sendEmail = async options => {
  let transporter;
  // In production we want to send real emails so we will use Sendgrid
  if (process.env.NODE_ENV === 'production') {
    // Sendgrid
    transporter = nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: process.env.SENDGRID_USERNAME,
        pass: process.env.SENDGRID_PASSWORD
      }
    });
    // return 1;
  } else {
    // In development instead of the email going to a real email address it will get caught into our email inbox
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // 2) Define the email options
  const mailOptions = {
    from: `Maryam Adel <${process.env.EMAIL_FROM}`,
    to: options.email,
    subject: options.subject,
    text: options.message
    // html:
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
