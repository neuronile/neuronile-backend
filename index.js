// Load environment variables
require('dotenv').config();

const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Multer config for memory storage (multiple files)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      ciphers: "SSLv3",
    },
  });
};

app.post("/api/quote", upload.array("attachment"), async (req, res) => {
  const { company, email, project, quantity, deadline } = req.body;
  const files = req.files || [];

  try {
    const transporter = createTransporter();

    const attachments = files.map((file) => ({
      filename: file.originalname,
      content: file.buffer,
    }));

    const mailOptions = {
      from: process.env.COMPANY_EMAIL,
      replyTo: email,
      to: process.env.COMPANY_EMAIL,
      subject: `Quote Request from ${company || email || "Unknown"}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #003366; padding: 20px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0;">${process.env.COMPANY_NAME}</h2>
          </div>
          <div style="padding: 20px; background-color: #ffffff;">
            <h3 style="color: #003366; margin-top: 0;">📩 New Quote Request</h3>
            <table cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse;">
              <tr><td style="font-weight: bold;">Company:</td><td>${company || "N/A"}</td></tr>
              <tr><td style="font-weight: bold;">Email:</td><td>${email || "N/A"}</td></tr>
              <tr><td style="font-weight: bold;">Project:</td><td>${project || "N/A"}</td></tr>
              <tr><td style="font-weight: bold;">Quantity:</td><td>${quantity || "N/A"}</td></tr>
              <tr><td style="font-weight: bold;">Deadline:</td><td>${deadline || "N/A"}</td></tr>
            </table>
            <p style="margin-top: 20px; font-size: 14px; color: #333;">
              Please find attached any files related to this quote request.
            </p>
          </div>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center;">
            <p style="font-size: 12px; color: #888;">&copy; ${new Date().getFullYear()} ${process.env.COMPANY_NAME}. All rights reserved.</p>
            <p style="font-size: 11px; color: #aaa;">This message was generated from the quote form on your website.</p>
          </div>
        </div>
      `,
      attachments,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Email sent successfully!" });
  } catch (err) {
    console.error("Quote email send error:", err);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

app.post("/api/send-email", async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.COMPANY_EMAIL,
      replyTo: email,
      to: process.env.COMPANY_EMAIL,
      subject: "New Contact Message from Website",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <div style="background-color: #003366; padding: 20px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0;">${process.env.COMPANY_NAME} Contact Form</h2>
          </div>

          <!-- Message Content -->
          <div style="padding: 20px; background-color: #ffffff;">
            <h3 style="color: #003366; margin-top: 0;">📩 You've received a new message</h3>
            <table cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-weight: bold;">Name:</td>
                <td>${name}</td>
              </tr>
              <tr>
                <td style="font-weight: bold;">Email:</td>
                <td>${email}</td>
              </tr>
              <tr>
                <td style="font-weight: bold;">Message:</td>
                <td>${message}</td>
              </tr>
            </table>
            <p style="margin-top: 20px; font-size: 14px; color: #333;">
              Please respond as soon as possible.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center;">
            <p style="font-size: 12px; color: #888;">&copy; ${new Date().getFullYear()} ${process.env.COMPANY_NAME}. All rights reserved.</p>
            <p style="font-size: 11px; color: #aaa;">This message was generated from the contact form on your website.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Email sent successfully!" });
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));