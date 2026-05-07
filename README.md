# X-Logica API Server

Express.js backend for the [X-Logica](https://x-logica.vercel.app) website.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/api/contact` | Contact form → email |
| `POST` | `/api/apply` | Job application + CV PDF → email |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GMAIL_USER` | ✅ | Gmail address that sends emails (`info.xlogica@gmail.com`) |
| `GMAIL_APP_PASSWORD` | ✅ | [Gmail App Password](https://myaccount.google.com/apppasswords) (NOT regular password) |
| `FRONTEND_URL` | ✅ | Your Vercel URL e.g. `https://x-logica.vercel.app` |
| `PORT` | Auto | Set automatically by Railway |

## Local Development

```bash
npm install
cp .env.example .env   # fill in your values
npm run dev
```

## Deploy on Railway

1. Push this folder to its own GitHub repo: `x-logica-server`
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select the `x-logica-server` repo
4. Add environment variables in Railway → Variables tab
5. Railway will run `npm start` automatically
