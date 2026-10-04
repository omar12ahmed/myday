// Makes twa-manifest.json — the settings Bubblewrap builds MyDay's Android app from — out of MyDay's own web app
// manifest on the website, plus the app's id and where its signing key is. Run when the app's settings should change;
// then `npm run update` regenerates the Android project and `npm run build` builds the APK (see README.md).
import { TwaManifest } from '@bubblewrap/core';

const SITE = 'https://omar12ahmed.github.io/myday/';
const KEY = '/Users/nrt/Documents/Myday/android-signing/myday.keystore'; // outside the repository; never in Git
const version = process.argv[2] || '1.10.0';

const twa = await TwaManifest.fromWebManifest(SITE + 'manifest.webmanifest');
twa.packageId = 'io.github.omar12ahmed.myday';
twa.launcherName = 'MyDay';
twa.name = 'MyDay';
twa.startUrl = '/myday/#today';
twa.signingKey = { path: KEY, alias: 'myday' };
twa.appVersionName = version;
twa.appVersionCode = Number(version.split('.').map(n => n.padStart(3, '0')).join('')); // 1.10.0 → 1010000
twa.enableNotifications = false;
twa.fallbackType = 'customtabs';
await twa.saveToFile(new URL('./twa-manifest.json', import.meta.url).pathname);
console.log(`twa-manifest.json: ${twa.packageId} ${twa.appVersionName} (${twa.appVersionCode}) → ${twa.host}${twa.startUrl}`);
