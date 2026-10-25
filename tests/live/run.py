"""Runs one live check (tests/live/<check>) against the published site, or a local production build, with a
disposable test account, in a throwaway headless Chrome whose profile is removed afterwards. Only with the owner's
yes: a live check writes to the real database (made-up records, tidied by the check itself). See README.md here.

  python3 -I tests/live/run.py <check> --version 1.77.0 --src <published commit> [--account A] [--local]

  <check>     a file in tests/live (live-files.js, live-wipe.js, files-direct.mjs, …)
  --account   which disposable account (A, B, C, D: TEST_<X>_EMAIL / _PASSWORD); default MYDAY_LIVE_ACCOUNT or A
  --other     a second account for checks that need one (isolation), default B
  --local     build this worktree's app for production and serve it at http://127.0.0.1:5500/myday/ (an address
              the files function and the bucket allow), so a release can be tried against the real services first
  --base      another address to check (default: the published site)

The accounts come from the main checkout's ignored files supabase/live-check*.secret.env (or MYDAY_LIVE_SECRETS, a
folder). Only @example.com addresses are accepted. Nothing about the accounts is printed."""
import argparse, json, os, shutil, socket, subprocess, sys, tempfile, time, urllib.request
from pathlib import Path

here = Path(__file__).resolve().parent
root = here.parent.parent
ap = argparse.ArgumentParser()
ap.add_argument('check'); ap.add_argument('--version', required=True); ap.add_argument('--src', required=True)
ap.add_argument('--account', default=os.environ.get('MYDAY_LIVE_ACCOUNT', 'A')); ap.add_argument('--other', default='B')
ap.add_argument('--local', action='store_true'); ap.add_argument('--base', default='https://omar12ahmed.github.io/myday/')
ap.add_argument('--cdp-port', default=os.environ.get('MYDAY_LIVE_CDP_PORT', '9587'))
a = ap.parse_args()
script = here / a.check
if not script.is_file() or script.parent != here: raise SystemExit('No such live check here: ' + a.check)


def read_env(file, into):
    for line in Path(file).read_text().splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line: continue
        name, value = line.removeprefix('export ').split('=', 1)
        value = value.strip()
        if len(value) > 1 and value[0] == value[-1] and value[0] in '"\'': value = value[1:-1]
        into[name.strip()] = value


# The secrets live in the main checkout (ignored by git), whichever worktree this runs from.
common = Path(subprocess.run(['git', 'rev-parse', '--path-format=absolute', '--git-common-dir'], cwd=root, capture_output=True, text=True, check=True).stdout.strip())
secrets = Path(os.environ.get('MYDAY_LIVE_SECRETS') or common.parent / 'supabase')
found = {}
read_env(root / 'app/.env.production', found)
for f in sorted(secrets.glob('live-check*.secret.env')): read_env(f, found)
env = os.environ.copy()
for slot, as_ in [(a.account.upper(), 'MYDAY_LIVE'), (a.other.upper(), 'MYDAY_LIVE_OTHER')]:
    email, password = found.get(f'TEST_{slot}_EMAIL', ''), found.get(f'TEST_{slot}_PASSWORD', '')
    if as_ == 'MYDAY_LIVE' and not (email.endswith('@example.com') and password): raise SystemExit(f'Disposable account {slot} required (TEST_{slot}_EMAIL @example.com, and its password)')
    if email.endswith('@example.com') and password: env[as_ + '_EMAIL'], env[as_ + '_PASSWORD'] = email, password
env['SUPABASE_URL'] = found.get('VITE_SUPABASE_URL', '')
env['SUPABASE_PUBLISHABLE_KEY'] = found.get('VITE_SUPABASE_PUBLISHABLE_KEY', '')
env.update(MYDAY_SRC=a.src, MYDAY_VERSION=a.version, MYDAY_ROOT=str(root), MYDAY_CDP_PORT=a.cdp_port)

work = Path(tempfile.mkdtemp(prefix='myday-live-'))
env['MYDAY_LIVE_TEMP'] = str(work)
chrome = server = None
code = 2
try:
    if a.local:
        with socket.socket() as s:
            if s.connect_ex(('127.0.0.1', 5500)) == 0: raise SystemExit('Port 5500 is in use (the local build must be served there).')
        out = work / 'site' / 'myday'
        r = subprocess.run(['npm', 'run', 'build', '--', '--outDir', str(out), '--emptyOutDir'], cwd=root / 'app', capture_output=True, text=True)
        if r.returncode: print(r.stdout[-2000:], r.stderr[-2000:]); raise SystemExit('The local build failed.')
        server = subprocess.Popen([sys.executable, '-I', '-m', 'http.server', '5500', '--bind', '127.0.0.1', '--directory', str(work / 'site')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(1)
        env['MYDAY_BASE'] = 'http://127.0.0.1:5500/myday/'
    else:
        env['MYDAY_BASE'] = a.base
    if script.suffix == '.js':  # a browser check: a throwaway Chrome
        chrome = subprocess.Popen(['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '--headless=new', f'--remote-debugging-port={a.cdp_port}',
                                   f'--user-data-dir={work}/profile', '--no-first-run', '--no-default-browser-check', 'about:blank'],
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(60):
            try:
                with urllib.request.urlopen(f'http://127.0.0.1:{a.cdp_port}/json/version', timeout=1) as response: json.load(response)
                break
            except Exception: time.sleep(.25)
        else: raise RuntimeError('The throwaway browser did not start')
    code = subprocess.run(['node', str(script), '--live'], env=env, cwd=root, timeout=1200).returncode
finally:
    for p in (chrome, server):
        if p:
            p.terminate()
            try: p.wait(timeout=10)
            except subprocess.TimeoutExpired: p.kill(); p.wait()
    shutil.rmtree(work / 'profile', ignore_errors=True)
    shutil.rmtree(work / 'site', ignore_errors=True)
    if code == 0: shutil.rmtree(work, ignore_errors=True)
    else: print('Kept for a look: ' + str(work))
raise SystemExit(code)
