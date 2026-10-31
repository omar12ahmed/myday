// What files MyDay keeps, shared by the app (before an upload) and the files Edge Function (before a file counts as
// kept), so the device and the server always agree (specs/files.md). Every area has its own rules; the portfolio's are
// stricter. A file's type is judged by its name and then by its first bytes ("magic"), never by what a browser says.
// Never SVG, HTML or anything that runs.

export const MB = 1024 * 1024;
export const GB = 1024 * MB;
export const ACCOUNT_TOTAL_BYTES = 10 * GB;         // every file of an account together (the owner's choice, 24 Oct 2026)
export const THUMB_MAX_BYTES = 200 * 1024;          // a photo's small preview
export const KEEP_DELETED_DAYS = 30;                // Recently deleted, then gone for good

export interface FileType { ext: string[]; label: string; inline: boolean; magic: (b: Uint8Array) => boolean }
const ascii = (b: Uint8Array, at: number, s: string) => [...s].every((c, i) => b[at + i] === c.charCodeAt(0));
const zip = (b: Uint8Array) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;
// Plain text: no NUL bytes in what was read (binary files nearly always have one early on).
const text = (b: Uint8Array) => b.length > 0 && !b.includes(0);
export const FILE_TYPES: Record<string, FileType> = {
  'image/jpeg': { ext: ['jpg', 'jpeg'], label: 'Photo', inline: true, magic: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { ext: ['png'], label: 'Photo', inline: true, magic: b => ascii(b, 0, '\x89PNG\r\n\x1a\n') },
  'image/webp': { ext: ['webp'], label: 'Photo', inline: true, magic: b => ascii(b, 0, 'RIFF') && ascii(b, 8, 'WEBP') },
  'image/heic': { ext: ['heic', 'heif'], label: 'Photo', inline: false, magic: b => ascii(b, 4, 'ftyp') && ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'heim', 'heis'].some(x => ascii(b, 8, x)) },
  'application/pdf': { ext: ['pdf'], label: 'PDF', inline: true, magic: b => ascii(b, 0, '%PDF-') },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: ['docx'], label: 'Word', inline: false, magic: zip },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: ['xlsx'], label: 'Excel', inline: false, magic: zip },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { ext: ['pptx'], label: 'PowerPoint', inline: false, magic: zip },
  'text/plain': { ext: ['txt'], label: 'Text', inline: false, magic: text },
  'text/csv': { ext: ['csv'], label: 'CSV', inline: false, magic: text },
};
const DOCS = Object.keys(FILE_TYPES);
// The photos a browser can draw, so the only files that get a small preview.
export const PREVIEWABLE = ['image/jpeg', 'image/png', 'image/webp'];
export interface AreaRule { types: string[]; maxBytes: number; totalBytes?: number; summary: string }
export const AREA_RULES: Record<string, AreaRule> = {
  project: { types: DOCS, maxBytes: 25 * MB, summary: 'Only photos, PDFs and documents (Word, Excel, PowerPoint, text, CSV), up to 25 MB each.' },
  note: { types: DOCS, maxBytes: 25 * MB, summary: 'Only photos, PDFs and documents (Word, Excel, PowerPoint, text, CSV), up to 25 MB each.' },
  portfolio: { types: ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'], maxBytes: 2 * MB, totalBytes: 200 * MB, summary: 'Only PNG, JPEG, WebP and PDF, up to 2 MB each.' },
  // A Content project's videos (specs/projects-content.md): their clips and thumbnails.
  content: { types: DOCS, maxBytes: 25 * MB, summary: 'Only photos, PDFs and documents, up to 25 MB each.' },
};
export const isArea = (a: unknown): a is string => typeof a === 'string' && Object.prototype.hasOwnProperty.call(AREA_RULES, a);

// The type a file's name says it is, or null for anything MyDay doesn't keep (an SVG, a web page, a program…).
export function typeOfName(name: string): string | null {
  const ext = /\.([a-z0-9]{1,8})$/i.exec(name.trim())?.[1]?.toLowerCase();
  if (!ext) return null;
  for (const [type, t] of Object.entries(FILE_TYPES)) if (t.ext.includes(ext)) return type;
  return null;
}
// Whether the first bytes are what the type says. Read at least 16 bytes (text: up to the first 1024).
export const looksLike = (type: string, first: Uint8Array) => !!FILE_TYPES[type]?.magic(first);

// A safe name to keep and show: no folders, no control characters, at most 200 characters (a long name keeps its
// extension), never blank.
export function cleanName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? '';
  const chars = Array.from(base.normalize('NFC').replace(/[\u0000-\u001f\u007f]/g, '').trim());
  if (chars.length <= 200) return chars.join('') || 'file';
  const ext = /\.[a-z0-9]{1,8}$/i.exec(chars.join(''))?.[0] ?? '';
  return chars.slice(0, 200 - ext.length).join('').trim() + ext;
}
// How the file is served when opened: photos and PDFs in the browser, everything else downloaded under its name.
export function disposition(name: string, type: string): string {
  const plain = cleanName(name).replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  return `${FILE_TYPES[type]?.inline ? 'inline' : 'attachment'}; filename="${plain}"; filename*=UTF-8''${encodeURIComponent(cleanName(name)).replace(/['()*!]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase())}`;
}
// An amount of storage in words: "640 KB", "24.6 MB", "340 MB", "1.2 GB", "10 GB" (one decimal under 100 MB and in
// GB). `round` is how: Math.floor for what's used and what's left, so neither is ever overstated (a file refused for
// want of room never reads as if it fitted). The unit is chosen after rounding (999.6 MB is "1 GB", never "1000 MB").
// Anything above nothing is at least "1 KB".
export function amountLabel(n: number, round: (x: number) => number = Math.round): string {
  if (n <= 0) return '0 MB';
  const one = (v: number) => (v % 1 ? v.toFixed(1) : String(v)), at = (unit: number, tenths: boolean) => (tenths ? round((n / unit) * 10) / 10 : round(n / unit));
  if (n < MB) { const k = Math.max(1, at(1024, false)); if (k < 1024) return `${k} KB`; }
  if (n < 100 * MB) { const m = at(MB, true); if (m < 100) return `${one(m)} MB`; }
  if (n < 1000 * MB) { const m = at(MB, false); if (m < 1000) return `${m} MB`; }
  return `${one(at(GB, true))} GB`;
}
// Why a file can't be kept in this area, or '' when it can.
export function refusal(area: string, name: string, size: number): string {
  const rule = AREA_RULES[area];
  if (!rule) return 'That kind of file can’t be kept here.';
  const type = typeOfName(name);
  if (!type || !rule.types.includes(type) || !Number.isInteger(size) || size < 1 || size > rule.maxBytes) return rule.summary;
  return '';
}
