# Legacy Organizer

A secure, local-first web app to store life-critical information (accounts, contacts, assets, wishes) in encrypted form. Data is stored locally using IndexedDB, encrypted with AES-GCM. Features automatic email notifications via Resend API.

## Features

- 🔒 **Local-Only Storage**: All data encrypted and stored in your browser
- 👥 **Trustee Management**: Designate trusted contacts for information release
- 🔓 **Release Conditions**: Automatic release after inactivity periods
- 📧 **Automatic Emails**: Send information to trustees via Resend API
- 💾 **Automatic Backups**: Scheduled backup emails (7-365 days)
- 📥 **Manual Backup/Import**: Export and import encrypted backup files

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_RESEND_API_KEY=re_your_api_key_here
PORT=3001
VITE_API_URL=http://localhost:3001
```

Get your Resend API key from [https://resend.com/api-keys](https://resend.com/api-keys)

### 3. Run the Application

```bash
npm run dev
```

This will start both:
- Backend proxy server on `http://localhost:3001`
- Frontend Vite dev server (usually `http://localhost:5173`)

## Usage

1. **First Time Setup**: Create a master password when you first launch the app
2. **Add Information**: Fill out forms for each category (Digital Accounts, Financial Assets, Key Contacts, End-of-Life Wishes)
3. **Configure Trustees**: Add trusted contacts who can receive information
4. **Set Release Conditions**: Configure inactivity periods and trustee requirements
5. **Email Settings**: Configure Resend email settings and automatic backup email

## Security

- All data is encrypted with AES-GCM using your master password
- Master password is never stored
- Data is stored locally in IndexedDB
- Resend API key is stored server-side (in .env file)

## Development

- Frontend: React + Vite
- Backend: Express proxy server (for Resend API)
- Storage: IndexedDB via localForage
- Encryption: Web Crypto API (AES-GCM, PBKDF2)

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.
