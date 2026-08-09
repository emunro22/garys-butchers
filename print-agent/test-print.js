// Standalone hardware check — connects straight to the printer and prints
// one fixed sample receipt, with no involvement from the website/API. Run
// this first when setting up, to confirm PRINTER_IP/PRINTER_PORT actually
// reach the TM-m30III before wiring up the full polling loop.
//   npm run test-print          (prints for real)
//   DRY_RUN=true npm run test-print   (previews to the console instead)
require('dotenv').config();

const { printer: ThermalPrinter, types: PrinterTypes, characterSet: CharacterSet } = require('node-thermal-printer');
const { renderReceipt } = require('./receipt');

if (!process.env.PRINTER_IP) {
  console.error('Missing PRINTER_IP in .env — see README.md.');
  process.exit(1);
}

const PRINTER_IP = process.env.PRINTER_IP;
const PRINTER_PORT = process.env.PRINTER_PORT || '9100';
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

const sampleOrder = {
  orderNumber: 1,
  createdAt: new Date().toISOString(),
  fulfilment: 'delivery',
  pickupSlot: null,
  deliverySlot: new Date().toISOString(),
  deliveryAddress: { line1: '1 Test Street', line2: '', city: 'Erskine', postcode: 'PA8 7HH' },
  customerName: 'Test Customer',
  customerPhone: '07000 000000',
  items: [
    { name: 'Steak Mince (500g)', priceInPence: 475, quantity: 2 },
    { name: 'Pork Sausages', priceInPence: 350, quantity: 1 },
  ],
  subtotalInPence: 1300,
  deliveryInPence: 395,
  discountInPence: 0,
  promotionCode: null,
  totalInPence: 1695,
  notes: 'This is a test print - not a real order.',
};

async function main() {
  console.log(`Test print — target tcp://${PRINTER_IP}:${PRINTER_PORT}${DRY_RUN ? ' (DRY_RUN)' : ''}`);

  if (!DRY_RUN) {
    const connected = await printer.isPrinterConnected().catch(() => false);
    if (!connected) {
      console.error('Could not connect to the printer. Check PRINTER_IP/PRINTER_PORT and that it is powered on and on the same network.');
      process.exit(1);
    }
    console.log('Printer connected — printing test receipt...');
  }

  renderReceipt(printer, sampleOrder);

  if (DRY_RUN) {
    // getText() decodes the buffer as UTF-8, which mangles £ and other
    // WPC1252 bytes into "�" — latin1 matches WPC1252 for the characters
    // this receipt actually uses, so it previews correctly. The real
    // printer.execute() path is unaffected either way (raw bytes, no
    // decoding involved).
    console.log(printer.getBuffer().toString('latin1'));
  } else {
    await printer.execute();
    console.log('Done — check the printer.');
  }
}

main().catch((err) => {
  console.error('Test print failed:', err.message);
  process.exit(1);
});
