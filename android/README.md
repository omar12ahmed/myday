# MyDay for Android (APK)

A small Android app that opens MyDay's website (https://omar12ahmed.github.io/myday/) full screen, made with
Google's [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) as a *Trusted Web Activity*: Chrome shows the
site inside the app, without a browser bar. It **always runs the latest release of the website** — publishing MyDay
updates the app too; the APK only needs rebuilding if the app's own settings change (name, icon, colours, start page).

The other way to get MyDay on Android needs no APK at all: open the website in Chrome → ⋮ → **Install app**.

## What's here

| File | What it is |
|---|---|
| `twa-manifest.json` | The app's settings: id `io.github.omar12ahmed.myday`, the site and start page (Today), icons and colours (taken from the website's own manifest), version, and where the signing key is. |
| `make-twa-manifest.mjs` | Makes `twa-manifest.json` from the live website's manifest (`node make-twa-manifest.mjs 1.10.0`). |
| `app/`, `build.gradle`, `gradle/`, `gradlew` … | The Android project Bubblewrap generates from `twa-manifest.json` (`npm run update`). |
| `package.json` | Bubblewrap, pinned (installed into `node_modules/`, not system-wide). |

Not in Git (see `.gitignore`): the built `.apk`, Gradle's files, and above all the **signing key**.

## The signing key

`../../android-signing/myday.keystore` (i.e. `Documents/Myday/android-signing/`), outside this repository, with its
password in `signing.secret.env` next to it (readable only by your user account). **Keep both safe — copy them to your
password manager.** Android only installs an update to the app if it's signed with the same key; if the key is lost,
uninstall the app and install a newly signed one (your MyDay data is in your account, so nothing is lost).

The key's SHA-256 fingerprint (public, not secret) is in `https://omar12ahmed.github.io/.well-known/assetlinks.json`
(the `omar12ahmed.github.io` repository): that's how Android checks that the app and the website belong together, so
it can open the site without a browser bar. A new key means adding its fingerprint there.

## Tools

Bubblewrap uses Java 17 and Google's Android command-line tools, kept in `~/.bubblewrap/` (`config.json` says where):
Temurin JDK 17.0.11, Android SDK build-tools 36.1.0 and platform 36 (their licences accepted for this build).

## Building the APK

From this folder:

```bash
npm ci                                   # Bubblewrap (first time only)
node make-twa-manifest.mjs 1.10.0        # only if the app's settings changed; the version must go up for an update
npm run update                           # regenerates the Android project from twa-manifest.json
set -a; . ../../android-signing/signing.secret.env; set +a
BUBBLEWRAP_KEYSTORE_PASSWORD="$KEYSTORE_PASSWORD" BUBBLEWRAP_KEY_PASSWORD="$KEYSTORE_PASSWORD" npm run build
```

This makes `app-release-signed.apk`. To install it on your phone: copy it over (e.g. download it from the GitHub
release it's attached to, or via Google Drive or a USB cable), open it, and allow installing from that source when
Android asks.
