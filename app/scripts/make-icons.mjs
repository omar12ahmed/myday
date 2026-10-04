// Makes the app icons (public/icons/*.png) from public/icon.svg and public/icon-maskable.svg, with headless Google
// Chrome and macOS's sips (no packages needed). Run from app/:  node scripts/make-icons.mjs   — only if the icon changes.
//   icon-192.png, icon-512.png   the usual icon (rounded square), for "Install app" and the app list
//   icon-maskable-512.png        the same design filling the whole square: Android crops it to its own icon shape
//   apple-touch-icon.png         180 px, full square (Apple rounds it), for "Add to Home Screen" / "Add to Dock"
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CHROME = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
if (!CHROME) { console.log('Google Chrome is needed to make the icons.'); process.exit(2); }
const pub = f => fileURLToPath(new URL(`../public/${f}`, import.meta.url));
// Chrome draws each SVG at 512 px (its window can't be much smaller); the smaller icons are scaled down from those
// with macOS's built-in `sips`.
const draw = (svg, out) => {
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--default-background-color=00000000', '--window-size=512,512',
    `--screenshot=${pub(out)}`, 'file://' + pub(svg)], { stdio: 'ignore' });
  console.log('made', out);
};
const shrink = (from, out, size) => {
  execFileSync('sips', ['-z', String(size), String(size), pub(from), '--out', pub(out)], { stdio: 'ignore' });
  console.log('made', out);
};
draw('icon.svg', 'icons/icon-512.png');
draw('icon-maskable.svg', 'icons/icon-maskable-512.png');
shrink('icons/icon-512.png', 'icons/icon-192.png', 192);
shrink('icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 180);
