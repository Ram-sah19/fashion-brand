# Velora Circle - Production Deployment Guide

This guide provides end-to-end instructions for deploying **Velora Circle**:
- **Frontend**: Hosted globally on **Cloudflare Pages** (powered by TanStack Start + Nitro SSR/Edge).
- **Backend**: Hosted on **Render** (all 6 microservices + API Gateway orchestrated as a single Web Service).

---

## Architecture Overview

```
                                      +---------------------------------------------+
                                      |            CLOUDFLARE PAGES                 |
                                      |  (TanStack Start + Nitro on Pages Edge)     |
                                      +---------------------------------------------+
                                            |                             |
                       REST API Rewrites    |                             | WebSockets (WSS)
                 (/api/* & /uploads/* via   |                             | (/socket.io/* direct
                      Cloudflare _redirects)|                             |  via VITE_API_URL)
                                            v                             v
                                      +---------------------------------------------+
                                      |             RENDER WEB SERVICE              |
                                      |          (Unified API Gateway :PORT)        |
                                      +---------------------------------------------+
                                            |
                  +-------------------------+-------------------------+
                  |                         |                         |
                  v                         v                         v
           [Auth Service]            [User Service]           [Message Service]
             (:5001)                   (:5002)                   (:5003)
                  |                         |                         |
                  v                         v                         v
          [Circle Service]         [Notification Svc]          [Call Service]
             (:5004)                   (:5005)                   (:5006)
                                            |
                                            v
                                 [MongoDB Atlas Cluster]
```

---

## Prerequisites

1. **GitHub Account**: Push this repository to your GitHub account.
2. **MongoDB Atlas Account**: A free MongoDB Atlas M0 cluster.
   - Whitelist all IPs (`0.0.0.0/0`) in Atlas Network Access so Render instances can connect.
   - Obtain your connection URI: `mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/Veloracircle?retryWrites=true&w=majority`
3. **Render Account**: Free tier account at [render.com](https://render.com).
4. **Cloudflare Account**: Free tier account at [cloudflare.com](https://cloudflare.com).

---

## Step 1: Deploy the Backend on Render

You can deploy the backend using **Render Blueprints (Option A)** or **Manual Setup (Option B)**.

### Option A: 1-Click Deploy via Render Blueprint (Recommended)

1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Blueprint**.
3. Connect your GitHub repository (`Veloracircle`).
4. Render will automatically detect [`render.yaml`](../render.yaml) at the repository root.
5. In the configuration screen, provide the requested environment variables:
   - `MONGO_URI`: Your MongoDB Atlas connection string.
   - `MESSAGE_ENCRYPTION_KEY`: A 32-byte hexadecimal string (64 characters, e.g. generate with `node -e "console.log(crypto.randomBytes(32).toString('hex'))"`).
   - `EMAIL_USER`: Your Gmail address.
   - `EMAIL_PASSWORD`: Your Gmail App Password (16 characters).
6. Click **Apply**.
7. Once deployed, note your service URL (e.g. `https://velora-circle-backend.onrender.com`).

---

### Option B: Manual Web Service on Render

If you prefer to configure the Web Service manually:

1. Click **New +** > **Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name**: `velora-circle-backend`
   - **Region**: Select the region closest to your users (e.g., Oregon, Frankfurt, Singapore).
   - **Branch**: `main`
   - **Root Directory**: Leave blank (repository root; do not set this to `backend`).
   - **Runtime**: **Node**
   - **Build Command**:
     ```bash
     npm run install:backend && npm run build:backend
     ```
   - **Start Command**:
     ```bash
     node server/start-all.js
     ```
   - **Health Check Path**: `/health`
   - **Plan**: **Free** (or Starter for 24/7 uptime without spin-downs).

4. Add the following **Environment Variables**:

| Variable Name | Required | Description | Example / Default |
|---|---|---|---|
| `NODE_VERSION` | Yes | Node version | `20.18.0` |
| `MONGO_URI` | Yes | MongoDB Atlas URI | `mongodb+srv://...` |
| `JWT_SECRET` | Yes | Secret for signing JWTs | *(Generate a 32+ char secret)* |
| `INTERNAL_SERVICE_SECRET`| Yes | Inter-service auth token | *(Generate a secret string)* |
| `MESSAGE_ENCRYPTION_KEY` | Yes | AES-256 64-hex char key | `83152c9ac9aa3d0924b159b985...` |
| `EMAIL_HOST` | Yes | SMTP Host | `smtp.gmail.com` |
| `EMAIL_PORT` | Yes | SMTP Port | `587` |
| `EMAIL_USER` | Yes | Gmail address for emails | `your-email@gmail.com` |
| `EMAIL_PASSWORD` | Yes | Gmail App Password | `xxxx xxxx xxxx xxxx` |
| `EMAIL_FROM` | Yes | Email display header | `Velora Circle <your-email@gmail.com>` |

5. Click **Create Web Service**.
6. When deployment finishes, copy your Render URL (e.g. `https://velora-circle-backend.onrender.com`).

> **Important:** Do not use `node backend/server.ts` as the start command. This project has
> separate services under `backend/*`; `server/start-all.js` starts them and exposes the
> Render `PORT` through the API gateway.

> If the Render log still shows `Running 'node server.ts'` or `Running 'node backend/server.ts'`,
> update the existing service's **Root Directory** to blank and its **Start Command** to
> `node server/start-all.js`, then save and redeploy. Existing manually-created services do
> not automatically adopt changes from `render.yaml`.

---

### Verify Backend Deployment

Open your browser or run:
```bash
curl https://velora-circle-backend.onrender.com/health
```
You should receive:
```json
{
  "status": "ok",
  "service": "gateway",
  "timestamp": "2026-09-28T..."
}
```

---

## Step 2: Deploy the Frontend on Cloudflare Pages

### Option A: Git Integration via Cloudflare Dashboard (Recommended)

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Go to **Compute (Workers) & Pages** > **Pages** > **Create a project**.
3. Choose **Connect to Git** and authorize your GitHub account.
4. Select the `Veloracircle` repository.
5. In the **Set up builds and deployments** page, specify:
   - **Project Name**: `velora-circle`
   - **Production Branch**: `main`
   - **Framework Preset**: `None` (or `Vite`)
   - **Root Directory**: `frontend`
   - **Build Command**:
     ```bash
     npm run build
     ```
   - **Build Output Directory**:
     ```bash
     dist
     ```
6. Expand **Environment variables** and add:

| Variable Name | Value |
|---|---|
| `NODE_VERSION` | `20` |
| `NITRO_PRESET` | `cloudflare-pages` |
| `VITE_API_URL` | `https://velora-circle-backend.onrender.com` *(Replace with your actual Render URL)* |

7. Click **Save and Deploy**.

Cloudflare Pages will clone the repository, install dependencies, run `npm run build`, and deploy the resulting `dist/` directory including SSR edge workers and static assets.

---

### Step 3: Link Cloudflare Pages `_redirects` to your Render URL

To enable seamless same-origin API proxying without CORS restrictions:

1. Open [`frontend/public/_redirects`](../frontend/public/_redirects).
2. Replace `https://velora-circle-backend.onrender.com` with your exact Render backend URL:
   ```
   /api/*  https://your-actual-app.onrender.com/api/:splat  200
   /uploads/*  https://your-actual-app.onrender.com/uploads/:splat  200
   ```
3. Commit and push the change to GitHub:
   ```bash
   git add frontend/public/_redirects
   git commit -m "chore: point Cloudflare proxy to production Render backend"
   git push origin main
   ```
4. Cloudflare Pages will automatically trigger a new deployment.

---

## Step 4: Verification Checklist

Once both deployments are active:

- [ ] **Frontend Load**: Visit `https://your-project.pages.dev`. Confirm the home/login page loads cleanly.
- [ ] **User Registration / Login**: Create a new account or log in. Check that `/api/auth/register` and `/api/auth/login` succeed.
- [ ] **Circles & Direct Messaging**: Create a Circle or start a chat with a user. Verify REST requests to `/api/circles` and `/api/conversations` succeed.
- [ ] **Real-Time Messaging**: Open two browser sessions with different accounts. Send a message and confirm instant delivery via Socket.IO (`/socket.io/messages`).
- [ ] **Video / Audio Calling**: Initiate a call between two accounts. Confirm WebRTC signaling via Socket.IO (`/socket.io/calls`).
- [ ] **File Attachments**: Upload an attachment in chat. Verify it uploads and renders correctly from `/uploads/*`.

---

## Troubleshooting & Tips

### 1. Render Free Tier Cold Starts
- On Render's Free tier, services spin down after 15 minutes of inactivity. The first request after sleeping can take ~50 seconds while the container spins up.
- **Solution**: For production or client demos, upgrade to Render's **Starter** tier ($7/month) for 24/7 uninterrupted uptime.
- Alternatively, use a free uptime monitor (e.g. UptimeRobot or Cron-job.org) to ping `https://your-backend.onrender.com/health` every 10 minutes.

### 2. Socket.IO Connection Errors
- Verify that `VITE_API_URL` is configured in the Cloudflare Pages environment variables.
- Ensure the backend Gateway URL uses `https://` (Cloudflare Pages serves over HTTPS, so WebSockets must connect via secure `wss://`).

### 3. MongoDB IP Access
- If backend logs show `MongooseServerSelectionError: connect ECONNREFUSED`, ensure you have whitelisted `0.0.0.0/0` in your MongoDB Atlas **Network Access** settings.
