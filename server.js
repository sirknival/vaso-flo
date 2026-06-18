require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(express.static('.'));
app.use(cors());

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.post('/api/contact', async (req, res) => {
  const { name, email, project, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, E-Mail und Nachricht sind erforderlich.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Ungültige E-Mail-Adresse.' });
  }

  try {
    await transporter.sendMail({
      from: `"Flo Website" <${process.env.SMTP_USER}>`,
      to: process.env.RECIPIENT_EMAIL,
      replyTo: email,
      subject: `Neue Anfrage von ${name}${project ? ` – ${project}` : ''}`,
      text: `Name: ${name}\nE-Mail: ${email}\nKläranlage / Projekt: ${project || '–'}\n\nNachricht:\n${message}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
          <h2 style="color:#00D4B8;border-bottom:2px solid #00D4B8;padding-bottom:8px">Neue Kontaktanfrage</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;font-weight:bold;width:160px">Name</td><td>${name}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold">E-Mail</td><td><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding:8px 0;font-weight:bold">Projekt</td><td>${project || '–'}</td></tr>
          </table>
          <h3 style="margin-top:24px">Nachricht</h3>
          <p style="background:#f5f5f5;padding:16px;border-radius:8px;white-space:pre-wrap">${message}</p>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Mail error:', err);
    res.status(500).json({ error: 'E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf http://localhost:${PORT}`));
