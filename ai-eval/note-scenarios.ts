// Revision cards from your own notes (AI roles step 3, part C): made-up learner notes, every line labelled by the
// evaluation's author. Nothing here is anyone's real note.
//   sound     correct (a good check leaves it alone)
//   wrong     a realistic learner's mistake (a good check flags it; no card may teach it)
//   slip      overstated or imprecise (flagging it is good, not flagging it isn't a failure)
//   dated     true when written but may change (e.g. an allowance): flagging it is fine either way
//   personal  not a claim — a reminder, a feeling, a plan (never flagged, never a card)
// Three notes are entirely correct, to count false alarms.

import drafts from './note-drafts.json';
import type { NoteCard } from '../supabase/functions/_shared/ai/note-cards.ts';

export type LineLabel = 'sound' | 'wrong' | 'slip' | 'dated' | 'personal';
export interface NoteLine { label: LineLabel; text: string; why?: string }
export interface NoteScenario { kind: 'note-check' | 'note-cards'; id: string; title: string; tags: string[]; now: string; note: { title: string; lines: NoteLine[] } }

const S = (text: string): NoteLine => ({ label: 'sound', text });
const W = (text: string, why: string): NoteLine => ({ label: 'wrong', text, why });
const L = (text: string, why: string): NoteLine => ({ label: 'slip', text, why });
const D = (text: string, why: string): NoteLine => ({ label: 'dated', text, why });
const P = (text: string): NoteLine => ({ label: 'personal', text });

const NOTES: { id: string; title: string; lines: NoteLine[] }[] = [
  { id: 'n01-dns-dhcp', title: 'Networking: DNS, DHCP and NAT', lines: [
    S('DNS turns names like example.com into IP addresses.'),
    S('My laptop gets its IP address, gateway and DNS server from DHCP when it joins the network.'),
    W('DHCP leases are permanent unless you restart the router.', 'leases expire and are renewed'),
    S('If I can ping 1.1.1.1 but a website fails by name, DNS is the likely problem.'),
    L('DNS always uses UDP port 53.', 'it also uses TCP 53 (large answers, zone transfers)'),
    P('Ask Sam how the office router is set up.'),
    S('The default gateway is where packets go when the destination is outside my subnet.'),
    W('ARP finds the IP address that belongs to a known MAC address.', 'the other way round: ARP finds the MAC address for an IP address'),
    S('NAT lets many devices share one public IP address.'),
    P('This part took me ages — revisit on Thursday.'),
    W('NAT is a firewall, so it keeps my home network safe.', 'NAT translates addresses; it is not a firewall'),
  ] },
  { id: 'n02-permissions', title: 'Linux permissions', lines: [
    S('Every file has an owner, a group, and permissions for the owner, the group and everyone else.'),
    S('r = 4, w = 2, x = 1, so 7 means rwx.'),
    W('chmod 644 lets the group write to the file.', '644 gives the group read only'),
    S('On a directory, x means you can enter it.'),
    W('Root can\'t read a file whose permissions are 000.', 'root bypasses ordinary permission checks'),
    W('A umask of 022 gives new files 644 and new directories 744.', 'directories get 755'),
    P('Practise on the lab VM, not my Mac.'),
    W('To delete a file you need write permission on the file itself.', 'deleting depends on write permission on the directory'),
    S('sudo runs one command as root, and it is logged.'),
  ] },
  { id: 'n03-study', title: 'How I study best', lines: [
    S('Retrieval practice means recalling from memory instead of rereading.'),
    S('Spacing reviews out over days helps long-term memory more than cramming.'),
    L('You should always review exactly 24 hours later.', 'no single ideal gap; schedules vary and gaps grow'),
    P('I do better with 20-minute sessions.'),
    W('Rereading my notes is the most effective way to remember them.', 'rereading is among the least effective techniques'),
    S('Mixing different kinds of problems in one session (interleaving) can help me tell them apart.'),
    P('Try Anki again?'),
    W('People learn best when teaching matches their learning style (visual, auditory or kinaesthetic).', 'the matching ("meshing") idea isn\'t supported by evidence'),
  ] },
  { id: 'n04-cells', title: 'Biology: cells', lines: [
    S('Mitochondria release energy from food through respiration.'),
    W('Plant cells don\'t have mitochondria because they have chloroplasts.', 'plant cells have both'),
    S('The nucleus contains most of the cell\'s DNA.'),
    S('Ribosomes make proteins.'),
    W('Bacteria have no DNA because they have no nucleus.', 'bacterial DNA lies in the cytoplasm (nucleoid, plasmids)'),
    S('Diffusion moves particles from a higher concentration to a lower one.'),
    P('Exam on 3 June.'),
    W('Osmosis is the diffusion of any substance across a membrane.', 'osmosis is the movement of water across a partially permeable membrane'),
    W('Enzymes are used up in the reactions they speed up.', 'enzymes are catalysts and aren\'t used up'),
  ] },
  { id: 'n05-arabic-article', title: 'Arabic: the definite article', lines: [
    S('The definite article is ال (al-), joined to the front of the word.'),
    S('With a sun letter the lām isn\'t pronounced and the next letter is doubled: الشمس is ash-shams.'),
    W('ق is a sun letter, so القمر is said aq-qamar.', 'ق is a moon letter: al-qamar'),
    S('With a moon letter the lām is pronounced: القمر is al-qamar.'),
    P('Ustadha said to practise reading aloud.'),
    S('The sun letters are ت ث د ذ ر ز س ش ص ض ط ظ ل ن.'),
    W('A noun with ال can also take tanwīn.', 'a definite noun doesn\'t take tanwīn'),
  ] },
  { id: 'n06-isa', title: 'Money: ISAs', lines: [
    D('The ISA allowance is £20,000 a tax year.', 'true for recent tax years; the government can change it'),
    S('Interest earned inside an ISA isn\'t taxed.'),
    L('If I take money out of a cash ISA, I can never put it back.', 'a flexible ISA lets you replace it in the same tax year'),
    P('Check what my bank offers.'),
    S('The UK tax year runs from 6 April to 5 April.'),
  ] },
  { id: 'n07-ww1', title: 'History: the First World War (all correct)', lines: [
    S('The First World War began in 1914 and fighting ended with the armistice of 11 November 1918.'),
    S('The assassination of Archduke Franz Ferdinand in Sarajevo in June 1914 led to the July Crisis.'),
    S('Britain declared war on Germany on 4 August 1914, after Germany invaded Belgium.'),
    S('The Battle of the Somme began on 1 July 1916.'),
    P('Read the Somme chapter again.'),
    S('The Treaty of Versailles was signed in June 1919.'),
  ] },
  { id: 'n08-python', title: 'Python basics (all correct)', lines: [
    S('A list can be changed after it is made; a tuple can\'t.'),
    S('len() gives the number of items.'),
    S('Indexes start at 0, so the last item of a five-item list is at index 4.'),
    S('A dictionary maps keys to values.'),
    S('== compares values; is checks whether two names refer to the same object.'),
    P('Do the chapter 3 exercises.'),
  ] },
  { id: 'n09-https', title: 'HTTPS and TLS', lines: [
    S('HTTPS is HTTP sent over TLS.'),
    S('The padlock means the connection is encrypted, not that the site can be trusted.'),
    L('A TLS certificate proves who owns the website.', 'a basic certificate proves control of the domain, not who the owner is'),
    S('Port 443 is the default for HTTPS.'),
    W('With HTTPS, nobody on the network can see which website I visit.', 'the site\'s name is visible (DNS, the SNI field), and so is its IP address'),
    P('Look at a certificate in Safari.'),
  ] },
  { id: 'n10-photosynthesis', title: 'Biology: photosynthesis (all correct)', lines: [
    S('Photosynthesis takes place in chloroplasts.'),
    S('It uses carbon dioxide and water, with energy from light, to make glucose and oxygen.'),
    S('Chlorophyll absorbs mostly red and blue light and reflects green.'),
    P('Draw the leaf diagram from memory.'),
    S('Light intensity, carbon dioxide concentration and temperature can each limit the rate.'),
  ] },
];

const T = '2026-10-15T19:00';
const scenario = (kind: NoteScenario['kind']) => NOTES.map(n => ({
  kind, id: `${kind === 'note-check' ? 'k' : 'c'}${n.id.slice(1)}`, title: n.title, now: T, note: { title: n.title, lines: n.lines },
  tags: [`${n.lines.filter(l => l.label === 'wrong').length} wrong`, `${n.lines.filter(l => l.label === 'slip' || l.label === 'dated').length} slips`, `${n.lines.filter(l => l.label === 'personal').length} personal`],
}));
// The check, on every note.
export const NOTE_CHECK_SCENARIOS: NoteScenario[] = scenario('note-check');
// The writer, on every note with nothing left out — as if the check had missed everything, so the writer's own care
// and the card checker are what stand between a wrong line and a card.
export const NOTE_CARD_SCENARIOS: NoteScenario[] = scenario('note-cards');

// The card checker on the cards the writers really produced from these notes (note-drafts.json), each labelled by a
// blind review: a wrong card must be dropped; a sound one should be kept; a slip, a dated card or one from a personal
// line may go either way.
export type CardLabel = LineLabel;
export interface NoteDraftScenario { kind: 'note-cards-check'; id: string; title: string; tags: string[]; now: string; writtenBy: string; note: { title: string; lines: string[] }; cards: (NoteCard & { label: CardLabel; why?: string })[] }
export const NOTE_DRAFT_SCENARIOS: NoteDraftScenario[] = (drafts.sets as { id: string; writtenBy: string; note: { title: string; lines: string[] }; cards: (NoteCard & { label: CardLabel; why?: string })[] }[]).map(d => ({
  kind: 'note-cards-check', id: `d-${d.id}`, title: `Check real cards: ${d.id}`, now: T, writtenBy: d.writtenBy, note: d.note, cards: d.cards,
  tags: [`written by ${d.writtenBy}`, `${d.cards.filter(c => c.label === 'wrong').length} wrong, ${d.cards.filter(c => c.label !== 'sound' && c.label !== 'wrong').length} either way`],
}));
