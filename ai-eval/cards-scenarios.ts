// AI-written revision cards (AI roles step 3, B): scenarios for the writer and for the checker. Everything here is
// curriculum material or made up for the evaluation: no learner's data.
//
// Writers: four Cybersecurity lessons where precision matters, ten cards each, with the course's own two questions for
// the lesson sent as "existing" (as they would be for someone who has them in revision).
//
// Checkers: a fixed, labelled set of 40 cards written for this evaluation (10 per lesson), 14 of them with realistic
// mistakes — a wrong option marked right, a right answer with a wrong explanation, a half-truth stated as fact. A good
// checker drops all 14 and keeps most of the 26 sound ones. The labels are the evaluation author's judgement, noted
// with each mistake.
//
// Checkers on real drafts ("cards-drafts"): the 215 cards the writers produced in the live run of 13 Oct 2026, each
// labelled sound, slip (imprecise, overstated or debatable) or wrong by a blind review (cards-drafts.json). Subtler
// than the seeded mistakes. A slip may be kept or dropped: it counts towards neither tally.
import checks from '../app/src/study/cybersecurity/checks.json';
import drafts from './cards-drafts.json';
import type { DraftCard } from '../supabase/functions/_shared/ai/cards.ts';

export interface CardsScenario { kind: 'cards'; id: string; title: string; tags: string[]; now: string; lessonId: string; count: number; existing: string[] }
export interface CheckCard extends DraftCard { sound: boolean | null; why?: string } // null: a slip (either verdict is fine)
export interface CheckScenario { kind: 'cards-check'; id: string; title: string; tags: string[]; now: string; lessonId: string; cards: CheckCard[]; writtenBy?: string }

const T = '2026-10-14T19:00';
const existingFor = (lessonId: string) => Object.entries(checks as Record<string, { prompt: string; lesson: string }>)
  .filter(([id]) => id.startsWith(`assessment.${lessonId.replace(/^lesson\./, '')}-check.`)).map(([, c]) => c.prompt);
const writer = (id: string, title: string, lessonId: string): CardsScenario => ({ kind: 'cards', id, title, tags: ['write 10'], now: T, lessonId, count: 10, existing: existingFor(lessonId) });

export const CARD_SCENARIOS: CardsScenario[] = [
  writer('w01-routing', 'Routing, DNS, DHCP and NAT', 'lesson.routing-dns-dhcp'),
  writer('w02-tcp-udp', 'TCP, UDP, ports and connection state', 'lesson.tcp-ip-basics'),
  writer('w03-permissions', 'Linux users, groups and permissions', 'lesson.linux-permissions'),
  writer('w04-passwords', 'Password storage, MFA and recovery', 'lesson.passwords-mfa'),
];

const W = (prompt: string, answer: string, explanation: string, sound = true, why?: string): CheckCard => ({ kind: 'written', prompt, answer, explanation, sound, ...(why ? { why } : {}) });
const C = (prompt: string, choices: string[], correct: number, explanation: string, sound = true, why?: string): CheckCard =>
  ({ kind: 'choice', prompt, choices, correct, answer: choices[correct], explanation, sound, ...(why ? { why } : {}) });
const checker = (id: string, title: string, lessonId: string, cards: CheckCard[]): CheckScenario => ({ kind: 'cards-check', id, title, tags: [`${cards.filter(c => !c.sound).length} mistakes`], now: T, lessonId, cards });

export const CHECK_SCENARIOS: CheckScenario[] = [
  checker('c01-routing', 'Check: routing, DNS, DHCP and NAT', 'lesson.routing-dns-dhcp', [
    W('What does a host\'s default gateway do?', 'It is the router a host sends traffic to when the destination is not on its local network.', 'Local destinations are reached directly (after ARP or NDP finds the neighbour); everything else goes to the gateway, which forwards it.'),
    C('Which protocol maps an IPv4 address to a MAC address on the local network?', ['ARP', 'DNS', 'DHCP', 'NAT'], 0, 'ARP asks the local network which device has an IPv4 address and learns its MAC address.'),
    W('What does DHCP give a client when it joins a network?', 'An IP address lease and settings such as the subnet mask, default gateway and DNS servers.', 'DHCP automates address configuration so hosts don\'t need manual settings.'),
    C('Which of these turns a domain name into an IP address?', ['DHCP', 'DNS', 'ARP'], 0, 'This protocol resolves names to addresses.', false, 'wrong option marked right (DHCP instead of DNS)'),
    W('Does NAT on its own isolate a lab VM from the internet?', 'Yes — NAT hides the VM, so it can neither reach nor be reached from the internet.', 'Address translation keeps the VM private.', false, 'NAT lets the VM reach out to the internet; it is not isolation'),
    W('Why might a DNS lookup return a different address over time?', 'Records change, answers expire after their time-to-live, and services may return different addresses for load balancing or location.', 'DNS answers are cached for a limited time and can legitimately differ between lookups.'),
    C('In IPv6, what does the job ARP does in IPv4 — finding a neighbour\'s link-layer address?', ['Neighbour Discovery Protocol (NDP)', 'DHCPv6', 'ICMPv4'], 0, 'NDP, built on ICMPv6, resolves neighbours\' link-layer addresses in IPv6.'),
    W('What is a DHCP lease?', 'A time-limited assignment of an IP address to a client.', 'When the lease expires, the server changes the client\'s MAC address.', false, 'explanation wrong: DHCP never changes a MAC address'),
    C('A host can reach machines on its own subnet but nothing beyond it. What is the likeliest misconfiguration?', ['A missing or wrong default gateway', 'A wrong MAC address', 'An expired TLS certificate'], 0, 'Without a correct gateway, traffic for other networks has nowhere to go.'),
    W('Which port and protocol does DNS use?', 'Only UDP port 53.', 'DNS never uses TCP.', false, 'half-truth: DNS also uses TCP 53 (large responses, zone transfers)'),
  ]),
  checker('c02-tcp-udp', 'Check: TCP, UDP, ports and connection state', 'lesson.tcp-ip-basics', [
    C('What is the order of TCP\'s three-way handshake?', ['SYN, ACK, SYN-ACK', 'SYN, SYN-ACK, ACK', 'ACK, SYN, FIN'], 0, 'The client and server exchange these three segments to open a connection.', false, 'wrong option marked right (the order is SYN, SYN-ACK, ACK)'),
    W('What identifies a TCP connection on a host?', 'The five-tuple: protocol, source and destination IP addresses, and source and destination ports.', 'Two connections can share a destination port but differ in the client\'s address or port.'),
    W('Does UDP retransmit lost datagrams?', 'Yes, UDP retransmits after a timeout, like TCP.', 'UDP includes delivery guarantees.', false, 'wrong: UDP has no retransmission; the application must handle loss'),
    C('Why might an application choose UDP over TCP?', ['Lower latency when occasional loss is acceptable', 'Guaranteed delivery', 'Built-in encryption'], 0, 'UDP avoids connection setup and retransmission delays, which suits real-time audio, video or games.'),
    W('What does it mean for a port to be listening?', 'A process has bound a socket to that port and is waiting for incoming connections or datagrams.', 'Tools such as ss list listening sockets and the process that owns each one.'),
    W('What is TCP retransmission?', 'Resending segments that were not acknowledged in time, so data arrives reliably.', 'TCP tracks acknowledgements and resends what seems lost.'),
    C('Which port is assigned to HTTPS by default?', ['443', '80', '22', '25'], 0, 'HTTPS uses TCP port 443 by default; 80 is plain HTTP.'),
    W('Is a closed port the same as a filtered port?', 'Yes — both mean nothing answers.', 'Closed and filtered are two names for the same state.', false, 'wrong: a closed port replies (e.g. with RST); a filtered one is silently dropped'),
    W('What is an ephemeral port?', 'A temporary, usually high-numbered port the client\'s operating system picks for its side of a connection.', 'It lets one client open many connections to the same server port.'),
    C('What does a TCP RST segment tell the other side?', ['The connection is refused or aborted', 'The data arrived intact', 'The handshake succeeded'], 0, 'A reset ends or refuses a connection immediately.'),
  ]),
  checker('c03-permissions', 'Check: Linux users, groups and permissions', 'lesson.linux-permissions', [
    C('What does permission 640 give the file\'s group?', ['Read only', 'Read and write', 'Read, write and execute', 'Nothing'], 0, 'In 640 the middle digit, 4, is read only for the group.'),
    W('What does chmod 755 give the group?', 'Read, write and execute.', 'The middle digit 5 means full access for the group.', false, 'wrong: 5 is read and execute (r-x), not write'),
    W('With a umask of 022, what permissions does a new regular file usually get?', '644 (rw-r--r--).', 'New files start from 666; the umask removes write for group and others.'),
    W('What does the execute bit mean on a directory?', 'Permission to enter it and reach the files inside by name.', 'Without it you can\'t traverse the directory, even if you can read its listing.'),
    C('Which user ID does root have?', ['1000', '0', '1'], 0, 'The superuser has this ID on Linux.', false, 'wrong option marked right (root is UID 0)'),
    W('Why use sudo for one command instead of logging in as root?', 'It limits root privileges to that command, can be restricted per user, and is logged.', 'This follows least privilege and leaves an audit trail.'),
    W('Does a umask add permissions to new files?', 'Yes — the umask lists the permissions that are added.', 'A bigger umask gives more access.', false, 'wrong: the umask removes permissions'),
    C('Which command changes a file\'s owner?', ['chown', 'chmod', 'umask', 'passwd'], 0, 'chown changes the owner (and optionally group); chmod changes permissions.'),
    W('What is a group ID (gid) used for?', 'Giving several users the same access to files through group permissions.', 'Files have an owning group, and its permissions apply to that group\'s members.'),
    W('Can a user ever delete a file they can\'t write to?', 'No, never.', 'Deleting needs write permission on the file itself.', false, 'wrong: deleting depends on write permission on the directory (unless the sticky bit applies)'),
  ]),
  checker('c04-passwords', 'Check: password storage, MFA and recovery', 'lesson.passwords-mfa', [
    W('Why are passwords stored with a unique salt?', 'So identical passwords get different hashes and precomputed tables can\'t be reused across accounts.', 'Each account\'s hash must be attacked separately.'),
    W('Does a salt need to be kept secret?', 'Yes — if the salt leaks, the hashes can be reversed.', 'The salt is the key to the hash.', false, 'wrong: salts aren\'t secret, and hashes aren\'t reversed by knowing them'),
    C('Which of these is designed for storing passwords?', ['Argon2', 'SHA-256 on its own', 'MD5', 'Base64'], 0, 'Argon2 is a deliberately slow, memory-hard password hashing function.'),
    W('What is a work factor in password hashing?', 'A setting that makes each hash deliberately slow (and sometimes memory-hungry), so guessing at scale is expensive.', 'It can be raised over time as hardware gets faster.'),
    C('Which second factor resists phishing best?', ['An SMS code', 'A hardware security key (FIDO2/WebAuthn)', 'A security question'], 0, 'This factor is bound to the real site and can\'t be replayed on a fake one.', false, 'wrong option marked right (the hardware key resists phishing; SMS codes can be phished)'),
    W('Why is account recovery a security risk?', 'A weak recovery route, such as guessable questions or an insecure email reset, can bypass a strong password and MFA.', 'Attackers target the easiest way in, and recovery is often it.'),
    W('Is encoding a password in Base64 a safe way to store it?', 'Yes, Base64 encrypts it.', 'Base64 output can\'t be read without a key.', false, 'wrong: Base64 is an encoding, reversible by anyone'),
    W('What does multi-factor authentication add?', 'A second proof from a different category, such as something you have or are, so a stolen password alone isn\'t enough.', 'Two passwords would be the same factor twice.'),
    C('Why should password hashes be compared in constant time?', ['To avoid leaking information through timing differences', 'To make hashing faster', 'To store less data'], 0, 'A comparison that stops at the first difference can reveal how much matched.'),
    W('Should a site email you your current password if you forget it?', 'No — it should only let you reset it.', 'If it can send the password, it is stored in a recoverable form rather than hashed.'),
  ]),
];

// The real drafts, as the server would pass them to a checker (labels kept apart from what's sent).
type Labelled = DraftCard & { label: 'sound' | 'slip' | 'wrong'; why?: string };
export const DRAFT_SCENARIOS: CheckScenario[] = (drafts.sets as { id: string; lessonId: string; writtenBy: string; cards: Labelled[] }[]).map(set => ({
  kind: 'cards-check', id: `r-${set.id}`, title: `Check real drafts: ${set.id}`, now: T, lessonId: set.lessonId, writtenBy: set.writtenBy,
  tags: [`written by ${set.writtenBy}`, `${set.cards.filter(c => c.label === 'wrong').length} wrong, ${set.cards.filter(c => c.label === 'slip').length} slips`],
  cards: set.cards.map(({ label, why, ...card }) => ({ ...card, sound: label === 'sound' ? true : label === 'wrong' ? false : null, ...(why ? { why } : {}) })),
}));
