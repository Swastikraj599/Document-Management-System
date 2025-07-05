// controllers/emailController.js
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

exports.sendEmail = async (req, res) => {
  const { recipient, subject, message, base64File, fileName } = req.body;

  if (!recipient || !base64File || !fileName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(base64File.split(",")[1], "base64");

    // Create reusable transporter
    const transporter = nodemailer.createTransport({
      service: "gmail", // or "hotmail", "yahoo" etc
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send mail
    await transporter.sendMail({
      from: `"DocShare App" <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject: subject || "Shared Document",
      text: message || "Please find the attached document.",
      attachments: [
        {
          filename: fileName || "document.pdf",
          content: buffer,
        },
      ],
    });

    res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (err) {
    console.error("Email sending error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
};
