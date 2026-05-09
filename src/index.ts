import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Resend } from 'resend';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins: (string | RegExp)[] = [
  'http://localhost:3000',
  'http://localhost:5173',
  /^https:\/\/.*\.vercel\.app$/,          // any Vercel preview / production URL
  ...(process.env.FRONTEND_URL?.trim()    // set in Render: https://x-logica-six.vercel.app
    ? [process.env.FRONTEND_URL.trim()]
    : []),
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['POST', 'OPTIONS', 'GET'],
    allowedHeaders: ['Content-Type'],
  })
);

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Multer: store uploaded files in memory ───────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed.'));
    }
  },
});

// ─── Resend Client ────────────────────────────────────────────────────────────
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL    = process.env.FROM_EMAIL || 'onboarding@resend.dev'; // replace with verified domain email
const TO_EMAIL      = process.env.TO_EMAIL   || 'info.xlogica@gmail.com';

if (!RESEND_API_KEY) {
  console.error('❌ Missing RESEND_API_KEY environment variable.');
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);
console.log('✅ Resend client initialised');

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'X-Logica API Server' });
});

// ─── POST /api/contact ───────────────────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /api/contact - Start`);
  try {
    const { name, email, message } = req.body;

    const { error } = await resend.emails.send({
      from: `X-Logica Website <${FROM_EMAIL}>`,
      to:   [TO_EMAIL],
      replyTo: email,
      subject: `💬 New Contact Message from ${name || 'Website Visitor'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 12px;">
          <div style="background: #0a0a0a; padding: 24px; border-radius: 10px; margin-bottom: 20px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px;">New Contact Message</h1>
            <p style="color: #888; margin: 8px 0 0;">X-Logica Website</p>
          </div>
          <div style="background: #ffffff; padding: 24px; border-radius: 10px; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;font-weight:bold;color:#374151;width:120px">Name</td><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;color:#111827">${name || '—'}</td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;font-weight:bold;color:#374151">Email</td><td style="padding:12px 0;border-bottom:1px solid #f0f0f0"><a href="mailto:${email}" style="color:#2563eb">${email || '—'}</a></td></tr>
              <tr><td style="padding:12px 0;font-weight:bold;color:#374151;vertical-align:top">Message</td><td style="padding:12px 0;color:#111827;line-height:1.6">${message || '—'}</td></tr>
            </table>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:20px">Sent via X-Logica Website Contact Form</p>
        </div>
      `,
    });

    if (error) throw new Error(error.message);

    console.log(`[${new Date().toISOString()}] POST /api/contact - Success`);
    res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (err: unknown) {
    console.error('[/api/contact] Error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, message: `Failed to send message: ${message}` });
  }
});

// ─── POST /api/apply ─────────────────────────────────────────────────────────
app.post('/api/apply', upload.single('cv'), async (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /api/apply - Start`);
  try {
    const { name, email, phone, portfolio, message, position } = req.body;

    const attachments = req.file
      ? [{ filename: req.file.originalname, content: req.file.buffer }]
      : [];

    const { error } = await resend.emails.send({
      from: `X-Logica Careers <${FROM_EMAIL}>`,
      to:   [TO_EMAIL],
      replyTo: email,
      subject: `🚀 New Job Application — ${position || 'General'}`,
      attachments,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 12px;">
          <div style="background: #0a0a0a; padding: 24px; border-radius: 10px; margin-bottom: 20px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px;">New Job Application</h1>
            <p style="color: #888; margin: 8px 0 0;">X-Logica Careers Portal</p>
          </div>
          <div style="background: #ffffff; padding: 24px; border-radius: 10px; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;font-weight:bold;color:#374151;width:140px">Position</td><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;color:#2563eb;font-weight:bold">${position || 'General Application'}</td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;font-weight:bold;color:#374151">Full Name</td><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;color:#111827">${name || '—'}</td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;font-weight:bold;color:#374151">Email</td><td style="padding:12px 0;border-bottom:1px solid #f0f0f0"><a href="mailto:${email}" style="color:#2563eb">${email || '—'}</a></td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;font-weight:bold;color:#374151">Phone</td><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;color:#111827">${phone || '—'}</td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;font-weight:bold;color:#374151">Portfolio</td><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;color:#111827">${portfolio ? `<a href="${portfolio}" style="color:#2563eb">${portfolio}</a>` : '—'}</td></tr>
              ${message ? `<tr><td style="padding:12px 0;font-weight:bold;color:#374151;vertical-align:top">Cover Letter</td><td style="padding:12px 0;color:#111827;line-height:1.6">${message}</td></tr>` : ''}
            </table>
          </div>
          ${req.file ? `<p style="color:#6b7280;font-size:13px;margin-top:16px;text-align:center">📎 CV attached: <strong>${req.file.originalname}</strong></p>` : '<p style="color:#6b7280;font-size:13px;margin-top:16px;text-align:center">No CV attached</p>'}
          <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:20px">Sent via X-Logica Careers Portal</p>
        </div>
      `,
    });

    if (error) throw new Error(error.message);

    console.log(`[${new Date().toISOString()}] POST /api/apply - Success`);
    res.status(200).json({ success: true, message: 'Application submitted successfully!' });
  } catch (err: unknown) {
    console.error('[/api/apply] Error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, message: `Failed to send application: ${message}` });
  }
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
