# ICT Gold Bot — Server-Side Setup Guide
## Zero Cost, 24/7, Independent of Your Phone

---

## What This Does

Your bot now has a **server-side engine** that runs every 10 minutes, 24/7, using:
- **GitHub Actions** (free) — triggers the bot on a schedule
- **Netlify Functions** (free) — runs the ICT analysis and places trades
- **Netlify Blobs** (free) — stores bot state between runs
- **ntfy.sh** (free) — sends push notifications to your phone

Your phone just becomes a dashboard. Trades happen on the server whether your phone is on or not.

---

## Step 1 — Create a Free GitHub Account

1. Go to [github.com](https://github.com) and sign up (free)
2. Verify your email

---

## Step 2 — Push Your Bot to GitHub

1. Go to [github.com/new](https://github.com/new)
2. Create a new repository — name it `ictgoldbot` (private is fine)
3. On your PC, extract the bot zip file
4. Upload all the files to the repo (drag and drop on GitHub)
5. Make sure the folder structure looks like this:
   ```
   ictgoldbot/
   ├── index.html
   ├── sw.js
   ├── manifest.json
   ├── netlify.toml
   ├── netlify/
   │   └── functions/
   │       ├── metaapi.js
   │       ├── market.js
   │       └── bot-engine.js       ← new server engine
   ├── .github/
   │   └── workflows/
   │       └── bot-cron.yml        ← new cron trigger
   └── (all the gold_*.js files)
   ```

---

## Step 3 — Connect GitHub to Netlify

1. Go to [netlify.com](https://netlify.com) → Add new site → Import from Git
2. Connect to GitHub and choose your `ictgoldbot` repo
3. Build settings: leave blank (no build command needed)
4. Click **Deploy**

> From now on, every time you push changes to GitHub, Netlify auto-deploys.

---

## Step 4 — Set Environment Variables in Netlify

Go to **Netlify → Your site → Site configuration → Environment variables** and add:

| Variable | Value | Description |
|---|---|---|
| `META_TOKEN` | your MetaAPI token | From metaapi.cloud |
| `META_ACC_ID` | your account ID | From metaapi.cloud |
| `META_REGION` | `new-york` | Or whichever region works |
| `BOT_SYMBOL` | `GOLD#` | Your XM symbol |
| `BOT_MODE` | `normal` | `aggressive`, `normal`, or `sniper` |
| `BOT_RISK` | `1` | Risk % per trade |
| `BOT_DD` | `5` | Max daily drawdown % |
| `BOT_MAX_T` | `1` | Max concurrent open trades |
| `BOT_RR` | `3` | Risk:Reward ratio |
| `BOT_SL_BUF` | `15` | SL buffer in points |
| `BOT_MIN_SCORE` | `5` | Min confluence score to trade |
| `BOT_SESSION` | `both` | `both`, `london`, or `ny` |
| `BOT_BROKER` | `xm` | Your broker |
| `BOT_CURRENCY` | `R` | Currency prefix for display |
| `BOT_LOT` | `0` | Fixed lot size (0 = auto-calculate) |
| `NTFY_TOPIC` | `ictbot-yourname` | Any unique name (used for notifications) |
| `BOT_SECRET_KEY` | `any-random-string-123` | Security key (keep private) |
| `BOT_ENABLED` | `true` | **Safety switch — set this last when ready** |

After adding all variables, click **Save** and **Redeploy**.

---

## Step 5 — Set GitHub Secrets

Go to your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**

Add these two secrets:

| Secret Name | Value |
|---|---|
| `NETLIFY_BOT_URL` | `https://your-site-name.netlify.app/.netlify/functions/bot-engine` |
| `BOT_SECRET_KEY` | Same value as in Netlify (the random string you chose) |

---

## Step 6 — Set Up Free Push Notifications (ntfy.sh)

1. On your phone, install the **ntfy** app:
   - Android: [Play Store — ntfy](https://play.google.com/store/apps/details?id=io.heckel.ntfy)
2. Open ntfy app → tap **+** → Subscribe to topic
3. Enter the same topic name you put in `NTFY_TOPIC` (e.g. `ictbot-yourname`)
4. Done — you'll now receive trade alerts on your phone

> **Important:** Use a unique topic name. Anyone who knows your topic can subscribe to it. If you want it private, you can set `NTFY_TOKEN` with a paid ntfy account, but the free version works fine with an obscure topic name.

---

## Step 7 — Test It

1. Go to GitHub → Your repo → **Actions** tab
2. Click **ICT Bot Engine — 10min Cron**
3. Click **Run workflow** → **Run workflow**
4. Watch the run — it should show `Bot status: ok`

If it shows an error, check the logs. Common issues:
- `BOT_ENABLED is not set to true` — add that env var in Netlify
- `Could not reach MetaAPI` — check your token and account ID
- `HTTP 401` — your `BOT_SECRET_KEY` in GitHub doesn't match Netlify

---

## How It Works Day to Day

```
Every 10 minutes:
  GitHub Actions → triggers Netlify function
  Netlify function:
    1. Fetch account balance & open positions
    2. Check for TP/SL hits on previously open trades
    3. Fetch live price (gold-api.com)
    4. Fetch candles if cache expired (Yahoo Finance)
    5. Run ICT analysis (FVG, OB, MSS, KZ, etc.)
    6. If valid signal → place trade via MetaAPI
    7. Send notification to your phone via ntfy
    8. Save state to Netlify Blobs
  Your phone dashboard:
    Polls state every 60s → shows live analysis, last signal, balance
```

---

## Safety Features

- **`BOT_ENABLED=true`** — master switch. Set to `false` to pause all trading instantly (just update the Netlify env var)
- **Daily drawdown limit** — bot automatically pauses if daily DD% is reached
- **Max open trades** — never opens more than `BOT_MAX_T` positions at once
- **Cooldown** — waits between trades (30s aggressive / 2min normal / 5min sniper)
- **Symbol auto-retry** — tries GOLD#, GOLD, XAUUSD automatically if broker rejects

---

## Keeping It Free

| Service | Free Limit | Bot Usage |
|---|---|---|
| GitHub Actions | 2,000 min/month | ~450 min/month at 10min intervals ✅ |
| Netlify Functions | 125,000 invocations/month | ~4,320/month ✅ |
| Netlify Blobs | 1 GB storage | < 1 MB ✅ |
| ntfy.sh | Unlimited (public topics) | Free ✅ |

---

## Troubleshooting

**Bot runs but no trades placed:**
- Check `BOT_ENABLED=true` in Netlify env vars
- Check `BOT_MIN_SCORE` — try lowering to 4 temporarily to see if signals generate
- Check that you're testing during a kill zone (London or NY open)

**GitHub Actions not running:**
- GitHub pauses scheduled workflows if a repo has no commits for 60 days
- Fix: make any small commit (edit a space in README) to reactivate

**Notifications not arriving:**
- Make sure ntfy topic matches exactly between Netlify env var and phone subscription
- Check ntfy app notification permissions on your phone

---

*ICT Gold Bot Pro v5 — Server-Side Engine v1.0*
