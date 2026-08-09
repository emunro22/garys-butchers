// Polls the Gary's Butchers website for newly paid orders and prints a
// receipt for each to the Epson TM-m30III on this network, then acknowledges
// the job so it isn't printed again. Runs continuously — leave this terminal
// window open (or set it up to run at login, see README.md).
require('dotenv').config();

const { printer: ThermalPrinter, types: PrinterTypes, characterSet: CharacterSet } = require('node-thermal-printer');
const { renderReceipt } = require('./receipt');

const REQUIRED_VARS = ['API_BASE_URL', 'PRINT_AGENT_SECRET', 'PRINTER_IP'];
const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
if (missing.length) {
  console.error(`Missing required .env values: ${missing.join(', ')}`);
  console.error('Copy the example in README.md into a .env file in this folder first.');
  process.exit(1);
}

const API_BASE_URL = process.env.API_BASE_URL.replace(/\/$/, '');
const PRINT_AGENT_SECRET = process.env.PRINT_AGENT_SECRET;
const PRINTER_IP = process.env.PRINTER_IP;
const PRINTER_PORT = process.env.PRINTER_PORT || '9100';
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS) || 10000;
const DRY_RUN = process.env.DRY_RUN === 'true';

const printer = new ThermalPrinter({
  type: PrinterTypes.EPSON,
  interface: `tcp://${PRINTER_IP}:${PRINTER_PORT}`,
  width: 42,
  // Windows-1252 — includes £, which the default codec lookup can't encode
  // (throws "Encoding not recognized" without this set explicitly).
  characterSet: CharacterSet.WPC1252,
  options: { timeout: 5000 },
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchQueue() {
  const res = await fetch(`${API_BASE_URL}/api/print-queue`, {
    headers: { authorization: `Bearer ${PRINT_AGENT_SECRET}` },
  });
  if (!res.ok) throw new Error(`print-queue fetch failed: ${res.status}`);
  const data = await res.json();
  return data.orders || [];
}

async function ackOrder(orderId) {
  const res = await fetch(`${API_BASE_URL}/api/print-queue/ack`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${PRINT_AGENT_SECRET}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ orderId }),
  });
  if (!res.ok) throw new Error(`ack failed: ${res.status}`);
}

async function printOrder(order) {
  printer.clear();
  renderReceipt(printer, order);

  if (DRY_RUN) {
    // latin1, not getText()'s default utf8 — see the comment in test-print.js.
    console.log(`\n--- DRY RUN receipt for order #${order.orderNumber} ---`);
    console.log(printer.getBuffer().toString('latin1'));
    console.log('--- end receipt ---\n');
  } else {
    await printer.execute();
  }
}

async function pollOnce() {
  const queue = await fetchQueue();
  if (queue.length === 0) return;

  console.log(`${new Date().toISOString()} — ${queue.length} order(s) to print`);
  for (const order of queue) {
    try {
      await printOrder(order);
      await ackOrder(order.id);
      console.log(`  printed + acked order #${order.orderNumber}`);
    } catch (err) {
      // Leave it in the queue — next poll retries. One bad/unreachable
      // printer never blocks the rest of the queue or crashes the agent.
      console.error(`  failed to print order #${order.orderNumber}:`, err.message);
    }
  }
}

async function main() {
  console.log(`Print agent starting — polling ${API_BASE_URL} every ${POLL_INTERVAL_MS}ms`);
  console.log(`Printer target: tcp://${PRINTER_IP}:${PRINTER_PORT}${DRY_RUN ? ' (DRY_RUN — nothing will actually print)' : ''}`);

  if (!DRY_RUN) {
    const connected = await printer.isPrinterConnected().catch(() => false);
    console.log(connected ? 'Printer connected.' : 'Warning: could not confirm printer connection — will keep retrying on each poll.');
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await pollOnce();
    } catch (err) {
      console.error('poll failed:', err.message);
    }
    await sleep(POLL_INTERVAL_MS);
  }
}

main();
