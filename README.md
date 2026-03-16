# visitor-tracker

Simple Express app that serves the frontend from `public/` and emails visitor location data through Gmail.

## Local run

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
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

- `EMAIL_USER`
- `EMAIL_PASS`

You can also deploy with the included `render.yaml` blueprint.
