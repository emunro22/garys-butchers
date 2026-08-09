# Gary's Butchers — receipt print agent

Runs on a PC at the shop, on the same network as the Epson TM-m30III. It polls
the website every few seconds for newly paid orders and prints a receipt for
each — items, delivery/pickup details, and a thank-you line — then tells the
website it's been printed so it isn't printed again.

The website itself can't print directly: it runs on Vercel's servers, and the
printer sits on the shop's own network with no public internet access to it.
This little program is the bridge — it only ever reaches *out* to the
website, so there's nothing to open up on your router/firewall.

## Setup

1. **Install Node.js 20 or newer** if this PC doesn't already have it:
   https://nodejs.org

2. **Find the printer's IP address.** On the TM-m30III, print a network
   status sheet (hold the paper-feed button while powering on, or check the
   printer's own setup menu/web page) — it'll show something like
   `192.168.1.50`. Recommended: set a static IP or a DHCP reservation for it
   in your router, so this doesn't change later and break printing.

3. **Install dependencies** — open a terminal in this folder and run:
   ```
   npm install
   ```

4. **Create a `.env` file** in this folder (same folder as this README):
   ```
   API_BASE_URL=https://garysbutchersandfishmongers.co.uk
   PRINT_AGENT_SECRET=<same value as PRINT_AGENT_SECRET in Vercel>
   PRINTER_IP=192.168.1.50
   PRINTER_PORT=9100
   POLL_INTERVAL_MS=10000
   ```
   `PRINT_AGENT_SECRET` must be set to the exact same value in both places —
   it's what proves this program is allowed to read/update orders. Generate
   one with `openssl rand -base64 32` (or ask me to generate one) and add it
   to Vercel's Environment Variables first, then paste the same value here.

5. **Test the printer connection on its own, before the full setup:**
   ```
   npm run test-print
   ```
   This prints one fixed sample receipt directly — no website involved. If it
   fails, double-check `PRINTER_IP`/`PRINTER_PORT` and that the printer is
   powered on and connected to the network. You can preview the receipt's
   content (items, prices, address) without wasting paper first with
   `DRY_RUN=true npm run test-print` — printed to this terminal instead of
   the printer. Note the preview shows a few stray characters where bold/
   alignment/cut commands are in the raw data; those aren't visible on the
   real paper, they're interpreted as formatting by the printer itself.

6. **Start the agent:**
   ```
   npm start
   ```
   Leave this terminal window open — it keeps running, checking for new
   orders every 10 seconds (or whatever `POLL_INTERVAL_MS` is set to). Closing
   the window stops printing.

## Running it automatically

For it to survive a PC restart or not depend on someone remembering to open a
terminal, set it to run at login:
- **Windows**: Task Scheduler → create a task that runs `npm start` in this
  folder "at log on," with "repeat if it fails" enabled.
- **Mac**: a `launchd` agent, or a tool like [pm2](https://pm2.keymetrics.io/)
  (`npm install -g pm2 && pm2 start index.js --name print-agent`).

This part depends on the specific PC it ends up running on, so it's worth
setting up together once the printer itself is confirmed working.

## Troubleshooting

- **"Missing required .env values"** — you haven't created `.env`, or it's
  missing one of the four required values. Check step 4 above.
- **Nothing prints, no errors** — the print queue is just empty (no new paid
  orders since it last checked). Place a test order on the site to confirm.
- **"Could not connect to the printer"** — check `PRINTER_IP` is still
  correct (see step 2), the printer is powered on, and this PC is on the same
  network as the printer.
- **An order won't print / keeps failing** — check this terminal's log for
  the error. The order stays in the queue and retries every poll, so it's
  safe to fix the printer/network and leave the agent running.
- **Need to print something again** (e.g. it printed with a fault, or paper
  ran out mid-job) — use the print icon next to that order in `/admin/orders`
  on the website. That puts it back in the queue and this agent picks it up
  on its next poll.
