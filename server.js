import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Proxy endpoint for sending emails via Resend
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, text, html, from } = req.body;
    const apiKey = process.env.VITE_RESEND_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Resend API key not configured' });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: from || 'Legacy Organizer <onboarding@resend.dev>',
        to,
        subject,
        text,
        ...(html && { html }),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: result.message || `HTTP ${response.status}` 
      });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: error.message || 'Failed to send email' });
  }
});

// Proxy endpoint for sending backup emails with attachments
app.post('/api/send-backup-email', async (req, res) => {
  try {
    const { to, backupContent, filename, from } = req.body;
    const apiKey = process.env.VITE_RESEND_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Resend API key not configured' });
    }

    // Convert backup content to base64
    const base64Content = Buffer.from(backupContent, 'utf8').toString('base64');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: from || 'Legacy Organizer <onboarding@resend.dev>',
        to,
        subject: 'Legacy Organizer - Automatic Backup',
        text: `This is an automatic backup of your Legacy Organizer data.\n\nPlease find the backup file attached.\n\nBackup generated on: ${new Date().toLocaleString()}\n\nYou can import this backup file using the Import Backup feature in Legacy Organizer.`,
        attachments: [
          {
            filename,
            content: base64Content,
          },
        ],
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: result.message || `HTTP ${response.status}` 
      });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error sending backup email:', error);
    res.status(500).json({ error: error.message || 'Failed to send backup email' });
  }
});

app.listen(PORT, () => {
  console.log(`Email proxy server running on http://localhost:${PORT}`);
});

