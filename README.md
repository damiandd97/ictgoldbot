# ICT Gold Bot Pro

This is a deployable Netlify version of the ICT Gold Bot dashboard and server-side bot engine.

## What is included

- Static mobile dashboard in `index.html`
- Netlify Functions for market data, MetaAPI proxying, Telegram commands, and the scheduled bot engine
- GitHub Actions workflow that can trigger the bot every 5 minutes
- Environment template in `.env.example`
- Local syntax and safe-start check with `npm run check`

## Safe setup order

1. Deploy this folder to Netlify.
2. Add the variables from `.env.example` in Netlify.
3. Keep `BOT_ENABLED=false` while testing.
4. Add GitHub Actions secrets:
   - `NETLIFY_BOT_URL`
   - `BOT_SECRET_KEY`
5. Run the GitHub workflow manually once.
6. Turn on live trading only after demo testing by setting `BOT_ENABLED=true`.

## Important safety note

This bot can place live trades when `BOT_ENABLED=true` and valid MetaAPI credentials are configured. Test on a demo account first, use small risk, and keep the daily drawdown limit enabled.

## Verification

Run:

```bash
npm run check
```

The check confirms the JavaScript files parse and that the bot engine stays disabled unless explicitly enabled.
