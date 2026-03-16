# visitor-tracker

Simple Express app that serves the frontend from `public/` and emails visitor location data through Resend.

## Email Setup

For production on Render, use an email API with a verified sender domain. This project is configured for Resend.

- `RESEND_API_KEY`: your Resend API key
- `EMAIL_FROM`: a verified sender address, for example `alerts@yourdomain.com`
- `ALERT_EMAIL_TO`: the inbox that should receive visitor alerts

If these values are missing, the app will still boot on Render, but `/send-location` will return `503` until email is configured correctly.

## Local run

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file:

```env
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=alerts@yourdomain.com
ALERT_EMAIL_TO=you@example.com
```

3. Start the server:

```bash
npm start
```

The app runs on `http://localhost:3000` by default.

## GitHub

After Git is installed on your machine, run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/visitor-tracker.git
git push -u origin main
```

## Render

1. Push this project to GitHub.
2. In Render, create a new `Web Service` from that GitHub repo.
3. Use these settings if Render does not auto-detect them:

- Runtime: `Node`
- Build command: `npm install`
- Start command: `npm start`

4. Add these environment variables in Render:

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `ALERT_EMAIL_TO`

5. After deploy, open `/healthz` on your Render URL.

- `status: "ok"` and `mailReady: true` means the app is configured to send email.
- `status: "degraded"` or `mailReady: false` means the web service is running, but email is not ready yet.

You can also deploy with the included `render.yaml` blueprint.
