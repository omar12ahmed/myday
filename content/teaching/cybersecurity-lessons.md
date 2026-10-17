# Cybersecurity: lesson teaching companion

Original explanations, worked examples and guided exercises for every lesson. Use this alongside the course roadmap and practical labs. Lesson IDs match MyDay so existing progress is preserved.

For a short session, read the explanation and example, attempt the exercise, then reveal its solution. For a longer session, complete the first assigned resource and the existing practical task. The course session times are flexible choices; a full lecture or reference chapter may need several sessions.

External materials open at their original providers. Pages and relevant topics were checked on 16 October 2026. Media pages/players were identified, but playback was not tested. Readings and transcripts can support study if a player is unavailable; reading a transcript does not count as unaided listening. Optional paid services and certificates are not required.

## Modules

- [Learning method, scope and lab setup](#module-learning-lab)
- [Computer and operating-system fundamentals](#module-computer-os)
- [Networking and traffic fundamentals](#module-networking)
- [Linux administration and investigation](#module-linux)
- [Windows administration and evidence](#module-windows)
- [Programming, data and Python for security](#module-programming)
- [Shell automation, Git and reproducible work](#module-automation-git)
- [Security principles, risk and identity](#module-security-foundations)
- [Applied cryptography and modern identity](#module-cryptography-identity)
- [Web, JavaScript, HTTP and APIs](#module-web-technologies)
- [Hardening, resilience and system design](#module-secure-systems)
- [Vulnerability assessment and remediation](#module-vulnerability-assessment)
- [Defensive security, logs and SOC foundations](#module-defensive-foundations)
- [Professional practice, portfolio and job preparation](#module-career-portfolio)
- [Web application and API security testing](#module-web-security)
- [Penetration testing methodology and reporting](#module-penetration-testing)
- [Active Directory and enterprise identity](#module-active-directory)
- [Local privilege boundaries and escalation labs](#module-privilege-escalation)
- [SIEM, detection engineering and analyst practice](#module-detection-siem)
- [Incident response and threat hunting](#module-incident-response)
- [Digital forensics and evidence analysis](#module-digital-forensics)
- [Malware concepts and introductory reverse engineering](#module-malware-reversing)
- [Cloud foundations and practical security](#module-cloud-security)
- [Containers, delivery pipelines and DevSecOps](#module-containers-devsecops)
- [Secure development and application security engineering](#module-application-security)
- [Security architecture, assurance and tradeoffs](#module-security-architecture)
- [Advanced offensive analysis and controlled adversary simulation](#module-advanced-offensive)

<a id="module-learning-lab"></a>
## Learning method, scope and lab setup

<a id="lesson-learning-evidence"></a>
### Learning through evidence

Lesson ID: `lesson.learning-evidence`

#### Read

Recognising an explanation and producing an answer are different abilities. Reading gives you a model; retrieval tests whether you can reconstruct it; practice tests whether you can use it. Start with a small prediction, attempt the task, compare the result with your prediction, and record the correction. A useful baseline records what you can demonstrate now, including uncertainty. Confidence is useful for choosing support but is not a score for technical competence.

#### Worked example

You read that `pwd` shows the current directory. With the page closed, you predict that running it twice without changing directory gives the same path. It does. You can now explain this observation; you have not yet demonstrated navigating to an unfamiliar directory. Your note distinguishes the demonstrated action from the next skill.

#### Try it

Close this explanation. Write the difference between recognising, recalling and applying a command. Then describe one observation that would demonstrate application.

<details>
<summary>Reveal the explained answer</summary>

Recognition is understanding when shown; recall is reconstructing without the model; application is using it on a task. Predicting and verifying a path after changing directories demonstrates more than recognising the command's name.

</details>

#### Read, watch or explore next

- **Read:** [Learning Scientists — Six strategies for effective learning](https://www.learningscientists.org/downloadable-materials) — Open the retrieval-practice and spaced-practice materials. Write one change to tomorrow's study session.
  Public page at review; optional paid services are not assigned.

<a id="lesson-authorised-scope"></a>
### Permission, boundaries and stop conditions

Lesson ID: `lesson.authorised-scope`

#### Read

Permission applies to particular assets, actions and times. Owning an account does not grant permission to test the whole service. A useful scope names the target, who authorises it, allowed techniques, excluded systems, a time window and stop conditions. Public accessibility describes reachability, not permission. In this course, use supplied fictional evidence, your disposable lab or the exact training instance a provider assigns. Stop when an unexpected system or another person's data appears.

#### Worked example

A lab authorises requests to one assigned training hostname. A link redirects to the provider's payment service. The payment service is outside the exercise even though the same company owns it. Record the redirect and return to the assigned target; do not extend your tests based on a guess.

#### Try it

Draft a scope for analysing the supplied synthetic authentication CSV. Name the input, allowed actions, output and one stop condition.

<details>
<summary>Reveal the explained answer</summary>

Scope can allow reading and summarising the local synthetic file and writing a report. It should exclude contacting the addresses in it. An unexpected real credential or personal record is a reason to pause and clarify provenance.

</details>

#### Read, watch or explore next

- **Read:** [NIST SP 800-115 — Technical guide to information security testing](https://csrc.nist.gov/pubs/sp/800/115/final) — Open the linked publication and read Appendix B, the rules-of-engagement template. Choose three fields useful for a small training lab.
  Public page at review; optional paid services are not assigned.

<a id="lesson-lab-isolation"></a>
### Choose and isolate a learning environment

Lesson ID: `lesson.lab-isolation`

#### Read

Your host is the everyday computer; a guest is an operating system running in a virtual machine. The guest's CPU architecture must be supported by the host or emulated, which can be slower. Network settings, shared folders and clipboard access determine how much the guest can reach. A snapshot can help reverse guest changes but is not a backup of your host. On an 8 GB Apple Silicon Mac, start with browser exercises or one small ARM Linux guest rather than several large machines.

#### Worked example

A Linux guest has a NAT connection, a shared Documents folder and copied credentials. NAT alone has not made it isolated: the shared folder exposes host files, and outbound access still exists. A disposable training guest can omit shared folders and use fictional data; more sensitive exercises require stronger controls.

#### Try it

Draw host, guest, network and shared-folder connections. Mark every route by which a guest could affect real data. Choose a browser-only exercise if you cannot explain those connections yet.

<details>
<summary>Reveal the explained answer</summary>

The useful result is an exposure map, not merely a running VM. Remove unnecessary sharing, retain a known recovery point and confirm the exact guest architecture before downloading an image.

</details>

#### Read, watch or explore next

- **Read:** [UTM — Running Ubuntu on Apple Silicon](https://docs.getutm.app/guides/ubuntu/) — Read the ARM/Apple Silicon setup and guest requirements; record the architecture and memory choice without installing yet.
  Public page at review; optional paid services are not assigned.

<a id="lesson-technical-notes"></a>
### Evidence, privacy and reproducible notes

Lesson ID: `lesson.technical-notes`

#### Read

Reproducible notes let another person distinguish what happened from what you think it means. Record the date and timezone, tool and version, input, exact operation, relevant result and interpretation. Keep raw evidence separate from a redacted copy. An observation such as 'three failed logins' does not by itself establish a password attack. Label hypotheses, competing explanations and the next check. Exclude real credentials and private account details from public portfolios.

#### Worked example

Observation: three failures followed by a success for a fictional user at 09:02 UTC. Hypothesis: the user mistyped a password. Alternative: someone guessed it. Next check: compare source, device and normal login history. This is stronger than writing 'account hacked' without supporting evidence.

#### Try it

Write a six-line notebook entry for that sequence, separating observation, hypothesis and next check.

<details>
<summary>Reveal the explained answer</summary>

A sound entry preserves the event order and UTC label, identifies the source file, names both explanations and asks for corroborating evidence. It does not state that a compromise occurred.

</details>

#### Read, watch or explore next

- **Read:** [The Turing Way — Reproducible research](https://book.the-turing-way.org/reproducible-research/overview) — Read the definitions of reproducibility and replicability. Identify which details a reader needs to repeat your own exercise.
  Public page at review; optional paid services are not assigned.

<a id="lesson-help-and-debugging"></a>
### Read errors and ask useful questions

Lesson ID: `lesson.help-and-debugging`

#### Read

An error message reports the point where a program could not continue; the underlying cause may be earlier. Read the exception type and message, identify the operation, and compare expected with actual input. Change one relevant variable at a time. A minimal example removes unrelated code while preserving the failure. Useful help requests include the goal, environment, smallest reproducer, exact error and attempted fixes. Do not expose passwords or paste entire private files.

#### Worked example

`FileNotFoundError` while opening `logs/auth.csv` can mean the file is absent or the relative path is being resolved from a different working directory. Check the working directory and directory listing before reinstalling Python. Reinstalling does not resolve a mistaken path.

#### Try it

Explain why a script works when started in its folder but fails from another folder. Write two read-only checks you would perform.

<details>
<summary>Reveal the explained answer</summary>

Relative paths depend on the working directory. Inspect the current directory and confirm the intended file's absolute location; then deliberately resolve the path or run from the documented location.

</details>

#### Read, watch or explore next

- **Read:** [Python tutorial — Errors and exceptions](https://docs.python.org/3/tutorial/errors.html) — Read Syntax Errors and Exceptions. Compare a syntax error with FileNotFoundError and note what each tells you.
  Public page at review; optional paid services are not assigned.

<a id="module-computer-os"></a>
## Computer and operating-system fundamentals

<a id="lesson-hardware-resources"></a>
### CPU, memory, storage and peripherals

Lesson ID: `lesson.hardware-resources`

#### Read

A program needs CPU time to execute instructions, RAM for active working data, storage for persistent files and input/output to communicate. These resources fail or become saturated in different ways. High CPU use is not the same as running out of memory; a full disk can prevent saving even when CPU use is low. Architecture describes the instruction set a binary expects, such as ARM64 or x86-64. Diagnose the constrained resource before selecting a fix.

#### Worked example

A VM freezes while the host reports memory pressure and begins swapping heavily. Adding more guest RAM could make the host's shortage worse. Closing other workloads or using a smaller guest is a better first experiment than assigning every available gigabyte to it.

#### Try it

Match each symptom to a first measurement: cannot save a file; slow computation; switching apps stalls.

<details>
<summary>Reveal the explained answer</summary>

Check free storage, CPU utilisation and memory pressure respectively, while allowing for other causes. A measurement narrows the diagnosis; one symptom alone does not prove which component is faulty.

</details>

#### Read, watch or explore next

- **Watch / listen:** [CS50 — Lecture 0: Scratch](https://cs50.harvard.edu/x/2026/weeks/0/) — Use the lecture's notes and chapters on how computers represent and process information. Explain one input, processing and output example.
  Public page at review; optional paid services are not assigned.

<a id="lesson-data-representation"></a>
### Bits, bytes, text and encodings

Lesson ID: `lesson.data-representation`

#### Read

A bit holds one binary digit; eight bits form a byte. Hexadecimal writes four bits per digit, making bytes easier to inspect. Bytes acquire meaning through an encoding or file format: the same numeric value can represent a character, instruction or colour component. UTF-8 encodes Unicode text using variable-length byte sequences. Base64 encodes binary data as printable characters; it is reversible without a secret and is not encryption.

#### Worked example

Decimal 65 is hexadecimal `41` and represents A in ASCII-compatible UTF-8. The Arabic letter ب occupies more than one UTF-8 byte. Therefore a count of bytes is not generally a count of visible characters, and slicing arbitrary bytes can split a character.

#### Try it

Convert binary `00001111` to decimal and hex. Explain whether base64 protects a password from a reader.

<details>
<summary>Reveal the explained answer</summary>

The values are 15 and `0f`. Base64 provides representation, not confidentiality: decoding requires no secret. Store and compare text with an explicit encoding rather than assuming one byte per character.

</details>

#### Read, watch or explore next

- **Read:** [Python — Unicode HOWTO](https://docs.python.org/3/howto/unicode.html) — Read Encodings and Python's Unicode Support. Locate the difference between a Unicode code point and its encoded bytes.
  Public page at review; optional paid services are not assigned.
- **Watch / listen:** [CS50 — Lecture 0: Scratch](https://cs50.harvard.edu/x/2026/weeks/0/) — Use the binary and text-representation portions as an optional visual explanation.
  Public page at review; optional paid services are not assigned.

<a id="lesson-files-paths"></a>
### Files, paths and filesystem behaviour

Lesson ID: `lesson.files-paths`

#### Read

An absolute path identifies a location from the filesystem root. A relative path is interpreted from a working directory. A filename extension is a convention, not proof of format or safety. Metadata includes size, permissions and timestamps, while the contents are the file's bytes. Archives package files and may contain nested paths. Before extracting an unfamiliar archive, inspect its listing and select a disposable destination. Path spelling and case behaviour vary across systems.

#### Worked example

With working directory `/home/student`, `notes/day1.txt` resolves to `/home/student/notes/day1.txt`. After moving into `notes`, the same relative string points to a different nested location. The file did not move; the interpretation of the path changed.

#### Try it

Starting at `/home/student/lab`, resolve `../notes.txt` and `./capture.pcap`. Do not create or delete anything.

<details>
<summary>Reveal the explained answer</summary>

The paths are `/home/student/notes.txt` and `/home/student/lab/capture.pcap`. `..` means parent and `.` means current directory. Write the resolved path before using a command with destructive effects.

</details>

#### Read, watch or explore next

- **Read:** [Ubuntu — The Linux command line for beginners](https://ubuntu.com/tutorials/command-line-for-beginners) — Read sections 3 and 4 on the working directory, paths and listing files. Reproduce only navigation commands first.
  Public page at review; optional paid services are not assigned.

<a id="lesson-processes-users"></a>
### Processes, services, users and privileges

Lesson ID: `lesson.processes-users`

#### Read

A program is stored code; a process is a running instance with an identity, resources and execution state. Services are processes managed to provide ongoing functions. The operating system mediates access to files, memory and devices. User and group permissions restrict what a process can do; the person at the keyboard may launch processes with different identities. Knowing a process name is only a starting point: path, owner, parent and behaviour provide context.

#### Worked example

Two processes share the name `python`, but one runs your notebook and another runs a background service under a service account. Ending both by name can interrupt unrelated work. Inspect their command lines, owners and parents before deciding whether anything should change.

#### Try it

Given PID 100 owned by student and PID 200 owned by root, list three facts still needed before describing either as suspicious.

<details>
<summary>Reveal the explained answer</summary>

Ask for the executable path or command line, parent and start time, and expected purpose. High privilege increases possible impact but does not by itself prove malicious behaviour.

</details>

#### Read, watch or explore next

- **Read:** [Linux manual — proc](https://man7.org/linux/man-pages/man5/proc.5.html) — Read the DESCRIPTION and process-specific directories. Treat the manual as a reference, not an instruction to modify /proc.
  Public page at review; optional paid services are not assigned.

<a id="lesson-software-recovery"></a>
### Software installation, updates and recovery

Lesson ID: `lesson.software-recovery`

#### Read

A package manager records installed software, versions and dependencies. Updates can repair defects but may also change behaviour, so reproducible work records versions and a recovery method. Prefer the vendor or distribution's documented installation path. A backup is useful only if it can be restored; a snapshot has a different scope from a copy stored independently. Before changing a learning environment, identify what can be recreated and what must be preserved.

#### Worked example

A tutorial requires a newer Python package than your existing project. Installing it globally could disrupt that project. A separate virtual environment lets the exercise keep its own dependencies and makes cleanup easier. The environment still needs a record of which versions were used.

#### Try it

Write a change note for updating one lab dependency: current version, intended version, expected benefit, validation and rollback.

<details>
<summary>Reveal the explained answer</summary>

A complete note specifies a meaningful test and a reproducible way back, such as restoring the prior environment from a lockfile. 'Update everything' is not a bounded change or a recovery plan.

</details>

#### Read, watch or explore next

- **Read:** [Ubuntu Server — Package management](https://documentation.ubuntu.com/server/how-to/software/package-management/) — Read APT and updating package lists. Distinguish refreshing metadata from installing upgrades.
  Public page at review; optional paid services are not assigned.
- **Read:** [Python tutorial — Virtual environments and packages](https://docs.python.org/3/tutorial/venv.html) — Read Creating Virtual Environments before changing Python dependencies.
  Public page at review; optional paid services are not assigned.

<a id="module-networking"></a>
## Networking and traffic fundamentals

<a id="lesson-network-models"></a>
### Frames, packets and the network journey

Lesson ID: `lesson.network-models`

#### Read

Network data is carried in layers. An application produces data; transport adds information such as ports; IP supplies source and destination addressing; a local link carries the packet in a frame. These layers answer different questions. A router forwards between IP networks and normally creates a new link-layer frame for the next hop. The destination server's MAC address is not needed by a client communicating through a remote router.

#### Worked example

A laptop sends a request to a server on another subnet. Its local frame addresses the gateway, while the IP packet addresses the remote server. Confusing those two destinations makes a normal capture look inconsistent. Each field serves a different stage of delivery.

#### Try it

Draw a laptop, gateway and remote server. Label which destination belongs in the local Ethernet frame and which belongs in the IP packet.

<details>
<summary>Reveal the explained answer</summary>

The frame uses the local next hop's link-layer address; the packet uses the remote IP destination. NAT or tunnels may alter the observable packet later, so state the capture location.

</details>

#### Read, watch or explore next

- **Watch / listen:** [Professor Messer — Introduction to IP](https://www.professormesser.com/network-plus/n10-009/n10-009-video/introduction-to-ip-n10-009/) — Watch the explanation of encapsulation and moving traffic between devices. Recreate the example with your own three-node drawing.
  Public page at review; optional paid services are not assigned.

<a id="lesson-ip-addressing"></a>
### IPv4, IPv6 and practical subnetting

Lesson ID: `lesson.ip-addressing`

#### Read

An IP address and prefix length identify an address within a network. IPv4 uses 32 bits; a `/24` prefix fixes the first 24, leaving eight host bits. In an ordinary IPv4 /24 subnet, 256 addresses include the network and broadcast addresses, leaving 254 conventional host addresses. IPv6 has different addressing conventions and no broadcast. Private addresses are not globally routed on the public Internet, but they can still be reachable inside connected networks.

#### Worked example

`192.168.10.37/24` belongs to `192.168.10.0/24`; its conventional broadcast address is `192.168.10.255`. `192.168.11.37/24` is in another subnet. Sharing the first two decimal groups is insufficient: the prefix determines the boundary.

#### Try it

Identify the network and conventional host range for `10.2.8.14/24`. Explain whether `10.2.9.1/24` is local to it.

<details>
<summary>Reveal the explained answer</summary>

Network `10.2.8.0/24`, conventional hosts `.1` through `.254`. `10.2.9.1` is outside that prefix and normally needs a route through a gateway. This example does not generalise the host-count rule to /31 links or IPv6.

</details>

#### Read, watch or explore next

- **Read:** [Cloudflare — What is a subnet?](https://www.cloudflare.com/learning/network-layer/what-is-a-subnet/) — Read the subnet and subnet-mask explanations. Work the /24 example before attempting longer prefixes.
  Public page at review; optional paid services are not assigned.
- **Watch / listen:** [Professor Messer — Introduction to IP](https://www.professormesser.com/network-plus/n10-009/n10-009-video/introduction-to-ip-n10-009/) — Revisit the IP-addressing segment if the distinction between local and remote is unclear.
  Public page at review; optional paid services are not assigned.

<a id="lesson-routing-dns-dhcp"></a>
### Routing, DNS, DHCP and NAT

Lesson ID: `lesson.routing-dns-dhcp`

#### Read

Separate the services involved in a connection. DHCP can supply host configuration, including an address and gateway. DNS answers questions about names. Routing selects a next hop for an IP destination. ARP on IPv4 or neighbour discovery on IPv6 finds local link information. NAT translates addresses or ports at a boundary. These functions often run on one home router but remain distinct. Break this lesson into two sessions if the service names are new.

#### Worked example

A client has a valid address and reaches its gateway, but a DNS query times out. This narrows the problem to the path to the resolver or the resolver itself; it does not prove every Internet destination is unreachable. Conversely, a correct DNS answer does not prove the web service accepts connections.

#### Try it

Match four failures to a first check: no address; names fail; a remote subnet fails; one web service fails.

<details>
<summary>Reveal the explained answer</summary>

Inspect host configuration, resolver response, route or gateway, and service-specific reachability respectively. Keep the checks separate so a successful name lookup is not mistaken for a successful application connection.

</details>

#### Read, watch or explore next

- **Read:** [Cloudflare — What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/) — Read server roles and caching. Explain what a successful DNS answer does and does not establish.
  Public page at review; optional paid services are not assigned.
- **Watch / listen:** [Professor Messer — DNS Records](https://www.professormesser.com/network-plus/n10-009/n10-009-video/dns-records-n10-009/) — Watch A, AAAA, CNAME and MX record explanations and write one purpose for each.
  Public page at review; optional paid services are not assigned.

<a id="lesson-tcp-ip-basics"></a>
### TCP, UDP, ports and connection state

Lesson ID: `lesson.tcp-ip-basics`

#### Read

A port helps identify an application endpoint within a host. A TCP connection is distinguished by source and destination addresses and ports, with protocol included when comparing general flows. TCP provides an ordered byte stream with acknowledgement and retransmission; applications still need their own message structure. UDP sends datagrams without those TCP guarantees. Applications using UDP may implement reliability themselves. A port number suggests a convention, not proof of the program actually using it.

#### Worked example

A client connects from ephemeral port 52100 to server port 443. Replies reverse those endpoint roles. A second browser connection can use a different client port to the same server. Seeing 443 does not by itself prove the traffic is legitimate or that its content is readable.

#### Try it

Describe the return flow for `192.0.2.10:52100` to `198.51.100.20:443` over TCP.

<details>
<summary>Reveal the explained answer</summary>

Replies travel from `198.51.100.20:443` to `192.0.2.10:52100`. The two directions belong to one connection. NAT can change the tuple observed at another capture point.

</details>

#### Read, watch or explore next

- **Read:** [Cloudflare — What is TCP/IP?](https://www.cloudflare.com/learning/ddos/glossary/tcp-ip/) — Read the connection and reliability explanation; distinguish a stream from a message.
  Public page at review; optional paid services are not assigned.
- **Read:** [Cloudflare — What is UDP?](https://www.cloudflare.com/learning/ddos/glossary/user-datagram-protocol-udp/) — Read why an application might choose datagrams despite absent TCP guarantees.
  Public page at review; optional paid services are not assigned.

<a id="lesson-common-network-services"></a>
### Common services, time and remote administration

Lesson ID: `lesson.common-network-services`

#### Read

Services implement application protocols: HTTP transfers web representations, SSH provides secure remote access, SMTP transfers mail and NTP supports time synchronisation. A familiar port is a clue rather than a guaranteed identity. Separate service purpose, transport security, authentication and exposure. Accurate time matters when comparing logs; it does not mean every clock is correct. Only administer systems you control, and prefer inspecting a supplied service inventory before installing anything.

#### Worked example

An inventory lists 443/tcp, 22/tcp and 123/udp. You hypothesise HTTPS, SSH and NTP. You still need configuration or protocol evidence to confirm them. A successful connection to a port shows reachability, not permission to log in or proof of safe configuration.

#### Try it

Write the purpose and one evidence limitation for HTTPS and SSH.

<details>
<summary>Reveal the explained answer</summary>

HTTPS protects an HTTP connection using TLS; SSH supports encrypted authenticated remote operations. Both need correct configuration and credentials, and neither guarantees the endpoint itself is trustworthy.

</details>

#### Read, watch or explore next

- **Read:** [MDN — Overview of HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview) — Read Clients and servers and HTTP flow.
  Public page at review; optional paid services are not assigned.
- **Read:** [OpenBSD — ssh manual](https://man.openbsd.org/ssh) — Read the DESCRIPTION and authentication overview; do not attempt a connection to an unassigned host.
  Public page at review; optional paid services are not assigned.

<a id="lesson-packet-analysis"></a>
### Read a small packet capture

Lesson ID: `lesson.packet-analysis`

#### Read

A capture records packets visible at a particular interface and time. It is not automatically a complete view of a network. Capture filters decide what is collected; display filters select what is shown afterwards. Begin with endpoints, protocol, timing and a five-tuple before interpreting payloads. Encryption can hide application content while leaving some connection metadata visible. Retransmissions or resets are observations requiring context, not automatic indicators of an attack.

#### Worked example

A display filter hides everything except one TCP stream. Clearing it reveals other captured traffic because the underlying capture was retained. A capture filter that excluded that traffic would prevent later recovery from the saved file. Filtering and deletion are different operations.

#### Try it

Explain what can be concluded from three repeated SYN packets with no visible response, and name two uncertainties.

<details>
<summary>Reveal the explained answer</summary>

The capture shows attempts without a visible answer at that point. Possibilities include filtering, loss, an unavailable service or a missed return path. You cannot identify the cause without more evidence.

</details>

#### Read, watch or explore next

- **Read:** [Wireshark User's Guide — Display filtering](https://www.wireshark.org/docs/wsug_html_chunked/ChapterWork.html) — Open Filtering packets while viewing and Following protocol streams. Compare display filtering with capture filtering before using a supplied capture.
  Public page at review; optional paid services are not assigned.

<a id="lesson-network-diagnostics"></a>
### Troubleshoot segmentation and connectivity

Lesson ID: `lesson.network-diagnostics`

#### Read

Troubleshooting works best as a sequence of falsifiable checks. Confirm local configuration, next-hop reachability, DNS, transport and application behaviour separately. A firewall can allow one protocol while blocking another, so a failed ping is not proof that all traffic fails. VLANs divide link-layer broadcast domains; routing and policy determine communication between them. VPN connectivity adds routes and trust relationships rather than making every destination automatically reachable.

#### Worked example

A user can resolve a service name and connect to its HTTPS endpoint but receives an application error. Replacing DNS is unlikely to address the demonstrated failure. The next investigation is the HTTP response and application logs, while documenting which lower-layer checks succeeded.

#### Try it

Order checks for 'the website will not load' and describe when you would stop investigating DNS.

<details>
<summary>Reveal the explained answer</summary>

Stop treating DNS as the leading hypothesis once the relevant lookup succeeds and the client connects to the intended endpoint. Continue with TLS, HTTP status and service logs as appropriate.

</details>

#### Read, watch or explore next

- **Read:** [Ubuntu Server — Firewalls](https://documentation.ubuntu.com/server/how-to/security/firewalls/) — Read the firewall overview and the distinction between permitted traffic and service availability. Do not change your host firewall for this reading exercise.
  Public page at review; optional paid services are not assigned.

<a id="module-linux"></a>
## Linux administration and investigation

<a id="lesson-linux-shell"></a>
### Shell navigation, help and safe file work

Lesson ID: `lesson.linux-shell`

#### Read

A terminal hosts a shell that interprets commands. `pwd` prints the working directory, `ls` lists entries and `cd` changes the shell's location. Arguments are separated by shell syntax, so quoting matters when paths contain spaces. Read a command's help before adding options copied from a tutorial. Begin with observation and navigation; deletion and permission changes come later. Linux and macOS share many commands but may implement different options.

#### Worked example

`cd "practice notes"` passes one directory name. Without quotes, the shell sees two words. This is a parsing problem, not evidence that the directory is corrupt. Use `pwd` before and after navigation to check the change you intended.

#### Try it

In a disposable folder, create a directory named `practice notes` using your file manager. Enter it in Terminal and confirm your location.

<details>
<summary>Reveal the explained answer</summary>

Quote the path as one argument and use `pwd`. If it fails, check the current directory and exact name before changing permissions or using administrative privileges.

</details>

#### Read, watch or explore next

- **Read:** [Ubuntu — The Linux command line for beginners](https://ubuntu.com/tutorials/command-line-for-beginners) — Complete sections 3–5, using a disposable folder for file creation.
  Public page at review; optional paid services are not assigned.
- **Practice:** [OverTheWire Bandit — Level 0](https://overthewire.org/wargames/bandit/bandit0.html) — Optional: read Level 0 and connect only to its published training host using its supplied credentials.
  Public instructions; provider lab may require a free account.
- **Watch / listen:** [MIT Missing Semester — The Shell](https://missing.csail.mit.edu/2020/course-shell/) — Watch Using the Shell and Navigating in the Shell; repeat only harmless commands in a disposable folder.
  Public lecture and notes; no paid certificate assigned.

<a id="lesson-linux-text"></a>
### Streams, search and text pipelines

Lesson ID: `lesson.linux-text`

#### Read

Standard input, output and error are separate streams. A pipe passes one command's output into another, allowing small operations to compose. Search locates matching records; sorting orders them; counting summarises them. Know whether a command works on lines, bytes or structured fields. An exit status communicates success or failure separately from printed text. Preserve the original input and verify that a pipeline has not silently dropped malformed records.

#### Worked example

For lines `alice`, `bob`, `alice`, sorting places equal values together so `uniq -c` can count them. Using `uniq` alone on the original order does not combine the separated alice lines. The ordering step changes the meaning of the result.

#### Try it

On paper, predict the output of sorting and counting `red, blue, red, red` as four separate lines.

<details>
<summary>Reveal the explained answer</summary>

The counts are blue 1 and red 3. Explain that `uniq` collapses adjacent equal lines; sorting first creates those adjacent groups. Counts do not reveal the original event order.

</details>

#### Read, watch or explore next

- **Read:** [Ubuntu — The Linux command line for beginners](https://ubuntu.com/tutorials/command-line-for-beginners) — Read Combining commands and the sections on pipes and redirection. Reproduce the example on a tiny file before a real log.
  Public page at review; optional paid services are not assigned.

<a id="lesson-linux-permissions"></a>
### Users, groups and file permissions

Lesson ID: `lesson.linux-permissions`

#### Read

Traditional Linux permissions distinguish owner, group and others, each with read, write and execute bits. For directories, execute means traversal, while read allows listing names; deleting an entry depends mainly on permissions on its parent directory. `sudo` changes execution context according to policy, so it is not a general cure for permission errors. ACLs, capabilities and mount settings can add further constraints. Identify the operation and identity before proposing a change.

#### Worked example

A file has mode `640`: owner read/write, group read, others no access. A colleague outside that group cannot read it merely because the filename is known. Setting `777` grants unnecessary access and may not solve a parent-directory restriction anyway.

#### Try it

Decode `750` for a directory. Which category can traverse but not write?

<details>
<summary>Reveal the explained answer</summary>

Owner has all three permissions; group has read and execute; others have none. The group can list and traverse but cannot create entries under these basic bits. Additional ACLs may affect effective access.

</details>

#### Read, watch or explore next

- **Read:** [Linux manual — inode permissions](https://man7.org/linux/man-pages/man7/inode.7.html) — Read file type and mode plus the access-permissions discussion. Explain directory execute permission using your own example.
  Public page at review; optional paid services are not assigned.

<a id="lesson-linux-services"></a>
### Processes, packages and service logs

Lesson ID: `lesson.linux-services`

#### Read

A process is running execution; a service manager supervises selected processes and their lifecycle. A service being 'active' does not prove that its application is healthy. Logs, listening sockets and a small functional check provide complementary evidence. Package versions and configuration paths help explain differences between hosts. Use bounded log queries with a time range and service name; avoid collecting unrelated private data just because a tool permits it.

#### Worked example

A web service is active but returns errors after a configuration change. Restarting repeatedly may hide evidence. Compare the change, inspect that service's recent log messages and verify its expected listener before selecting a rollback or correction.

#### Try it

Write three checks for an active service that does not respond as expected.

<details>
<summary>Reveal the explained answer</summary>

Check the service's scoped logs, its listener and a known harmless request. Correlate timestamps with the change. An active status is process-management evidence, not an end-to-end service test.

</details>

#### Read, watch or explore next

- **Read:** [journalctl(1) - Linux manual page](https://man7.org/linux/man-pages/man1/journalctl.1.html) — Read unit selection and time filtering. Draft a bounded journal query for a fictional service without executing it.
  Public page at review; optional paid services are not assigned.

<a id="lesson-linux-network-investigation"></a>
### SSH, sockets and Linux investigation

Lesson ID: `lesson.linux-network-investigation`

#### Read

A listener waits for incoming connections; an established socket represents an active conversation. Inspect local and remote addresses, ports, protocol and owning process where permissions allow. Binding to loopback limits ordinary access to the same host; binding to all interfaces can expose a service more widely. SSH host keys identify servers and differ from your login credentials. Investigate unexpected host-key changes through a trusted channel rather than disabling checks.

#### Worked example

A training service listens on `127.0.0.1:8000`. Another machine cannot normally reach it through the host's network address. This is consistent with a loopback bind and is not necessarily a firewall fault. Changing it to `0.0.0.0` changes exposure.

#### Try it

Explain the difference between those two bind addresses and what to verify before changing one.

<details>
<summary>Reveal the explained answer</summary>

Loopback restricts ordinary network reachability to the host; all-interface binding may accept remote connections. Confirm the intended clients, firewall rules, authentication and disposable lab boundary first.

</details>

#### Read, watch or explore next

- **Read:** [OpenBSD — ssh manual](https://man.openbsd.org/ssh) — Read VERIFYING HOST KEYS and the port-forwarding cautions. Explain why a changed key deserves investigation.
  Public page at review; optional paid services are not assigned.

<a id="module-windows"></a>
## Windows administration and evidence

<a id="lesson-windows-system"></a>
### Windows architecture and everyday administration

Lesson ID: `lesson.windows-system`

#### Read

Windows separates user applications, background services and operating-system components. Task Manager and PowerShell expose different views of process activity. The registry stores structured configuration; it is not a safe place for speculative fixes. Inspect identities, paths, start times and service relationships before stopping a process. Record the Windows edition and tool version because available features and commands differ. Begin with read-only inspection on a disposable or permitted system.

#### Worked example

An application has several processes because it separates rendering, networking and background work. A high process count alone does not prove malware. Compare the executable paths and expected application behaviour, then investigate a specific anomaly rather than terminating every similarly named process.

#### Try it

Using the documentation examples, describe what Get-Process reports and two things it cannot establish by itself.

<details>
<summary>Reveal the explained answer</summary>

It reports properties of running processes. It does not independently determine malicious intent or explain every action those processes performed earlier. Historical investigation needs logs and other evidence.

</details>

#### Read, watch or explore next

- **Read:** [Microsoft Learn — Get-Process](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.management/get-process) — Read Examples 1 and 2 and the notes about permissions. Inspect the example output before running a command.
  Public page at review; optional paid services are not assigned.

<a id="lesson-windows-access"></a>
### Local users, groups, NTFS and UAC

Lesson ID: `lesson.windows-access`

#### Read

Windows identifies principals with security identifiers and controls many objects through access-control lists. Entries can allow or deny rights and may be inherited from a parent. Group membership contributes to effective access, so inspecting only the user's direct entry is insufficient. UAC separates ordinary operation from elevation; it is not a replacement for least privilege. A file's NTFS permissions and a network share's permissions are related but separate checks.

#### Worked example

A user has read access directly and belongs to a group with modify access. Looking only at the user's direct entry understates their effective rights. Conversely, a relevant deny or another access layer can prevent an action that one allow entry appears to permit.

#### Try it

For a shared project folder, list the identities and permission layers you would inspect before granting more rights.

<details>
<summary>Reveal the explained answer</summary>

Inspect the user, group memberships, inherited and explicit ACL entries, and share permissions when accessed remotely. Test the intended operation with a normal account rather than assuming an administrator's result applies.

</details>

#### Read, watch or explore next

- **Read:** [Microsoft Learn — Access control overview](https://learn.microsoft.com/en-us/windows/security/identity-protection/access-control/access-control) — Read security principals, permissions and inheritance. Explain why effective access can differ from one visible ACL entry.
  Public page at review; optional paid services are not assigned.

<a id="lesson-powershell-basics"></a>
### PowerShell objects and safe inspection

Lesson ID: `lesson.powershell-basics`

#### Read

PowerShell pipelines generally pass objects, not just printed lines. An object has properties describing it and methods that act on it. `Get-Command` discovers commands; `Get-Help` explains their contract; `Get-Member` reveals object structure. `Select-Object` chooses properties for inspection. Formatting is best left until the end because formatted output is not the original data. Start with read-only commands and distinguish missing output from an empty or inaccessible result.

#### Worked example

`Get-Process` produces process objects. Selecting Name and Id preserves meaningful properties. Formatting those objects for a table and then trying to calculate with the formatting output creates confusion because presentation has replaced the data you meant to analyse.

#### Try it

Describe a pipeline that lists process names and IDs. Explain where formatting belongs.

<details>
<summary>Reveal the explained answer</summary>

Retrieve process objects, select Name and Id, and format only if needed for display. Keep objects intact for filtering, sorting or export. Do not parse a visually aligned table when structured properties are available.

</details>

#### Read, watch or explore next

- **Read:** [Get-Member (Microsoft.PowerShell.Utility) - PowerShell | Microsoft Learn](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-member) — Read how Get-Member reveals properties and methods, then compare it with Select-Object.
  Public page at review; optional paid services are not assigned.
- **Read:** [Microsoft Learn — Get-Process](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.management/get-process) — Inspect the examples that retrieve and select process properties.
  Public page at review; optional paid services are not assigned.

<a id="lesson-windows-events"></a>
### Event logs, time and audit context

Lesson ID: `lesson.windows-events`

#### Read

Windows events belong to providers and logs. An event ID is meaningful with its provider, channel, version and fields, not in isolation. Absence of an event can reflect audit configuration or retention rather than absence of activity. Compare timestamps carefully, including displayed timezone and collection delay. Start with a specific question and a narrow time window so the relevant evidence remains manageable.

#### Worked example

A failed-logon event followed by success is an observable sequence. Without account, source, logon type and baseline context, it does not establish password guessing. A forwarded event may arrive later than the time the source recorded it. Preserve both timestamps when available.

#### Try it

Draft a filter description for checking one fictional account's sign-in activity during a ten-minute window.

<details>
<summary>Reveal the explained answer</summary>

Specify the relevant log/provider, time boundaries with timezone, account field and event types. Include a check that the source's audit settings and retention cover the window.

</details>

#### Read, watch or explore next

- **Read:** [Microsoft Learn — Get-WinEvent](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.diagnostics/get-winevent) — Read the FilterHashtable examples. Identify which filtering can happen before returning all events.
  Public page at review; optional paid services are not assigned.

<a id="lesson-windows-hardening"></a>
### Updates, endpoint controls and recovery

Lesson ID: `lesson.windows-hardening`

#### Read

Hardening reduces unnecessary exposure while keeping the system usable. Useful controls include supported software, timely updates, a host firewall, endpoint protection, appropriate account privileges, disk encryption and tested recovery. Each control addresses particular risks; none proves the absence of compromise. Record the initial configuration and intended change, then verify both protection and normal functionality. Recovery credentials must be stored somewhere independent of the device they unlock.

#### Worked example

Enabling disk encryption protects data on a lost powered-off device, but it does not prevent a signed-in malicious process from reading data the user can access. Its recovery key also needs a safe independent location; storing the only copy on the encrypted disk defeats recovery.

#### Try it

Match patching, firewall rules and disk encryption to three different failure scenarios.

<details>
<summary>Reveal the explained answer</summary>

Patching addresses known software defects, firewall rules limit network reachability and encryption protects stored data under its threat model. Explain the remaining risks instead of describing any one control as complete security.

</details>

#### Read, watch or explore next

- **Read:** [Microsoft Defender Antivirus in Windows Overview - Microsoft Defender for Endpoint | Microsoft Learn](https://learn.microsoft.com/en-us/defender-endpoint/microsoft-defender-antivirus-windows) — Read the Microsoft Defender Antivirus overview. Identify its purpose and deployment context; explain why antivirus does not replace patching, firewall rules or disk encryption.
  Public page at review; optional paid services are not assigned.
- **Read:** [Small organisations guide to cyber security | Backing up your data | National Cyber Security Centre](https://www.ncsc.gov.uk/collection/small-organisations-guide-to-cyber-security/backing-up-your-data) — Read the backup and recovery recommendations, treating recovery testing as part of the control.
  Public page at review; optional paid services are not assigned.

<a id="module-programming"></a>
## Programming, data and Python for security

<a id="lesson-code-control-flow"></a>
### Variables, types and control flow

Lesson ID: `lesson.code-control-flow`

#### Read

Variables name values; types influence which operations make sense. A condition chooses a branch, and a loop repeats a block over a sequence or while a condition holds. Trace a tiny input by hand before running unfamiliar code. Distinguish assignment from comparison and text digits from numeric values. A program can execute successfully while computing the wrong answer, so examples need expected results, not merely absence of errors.

#### Worked example

For results `['fail', 'success', 'fail']`, start `count` at zero and increment only when a value equals `fail`. The counter moves 0→1→1→2. Counting every iteration would produce three, which is the number of events rather than failures.

#### Try it

Trace the same rule on `['success', 'success', 'fail']` and explain the result.

<details>
<summary>Reveal the explained answer</summary>

The failure count is one. State the condition explicitly and test an empty list too: it should return zero rather than raising an unrelated error or inventing a result.

</details>

#### Read, watch or explore next

- **Read:** [Python tutorial — More control flow tools](https://docs.python.org/3/tutorial/controlflow.html) — Read if Statements and for Statements. Recreate a three-item example with a hand-written trace.
  Public page at review; optional paid services are not assigned.
- **Watch / listen:** [CS50 — Week 6: Python](https://cs50.harvard.edu/x/2026/weeks/6/) — Watch the conditionals and loops sections of Week 6; pause to predict each example before it runs.
  Public lecture and notes; no paid certificate assigned.

<a id="lesson-functions-debugging"></a>
### Functions, debugging and error handling

Lesson ID: `lesson.functions-debugging`

#### Read

A function packages an operation behind parameters and a return value. Its contract states accepted inputs, produced output and failure behaviour. Local variables help keep work contained. Exceptions signal failures that callers can handle deliberately; catching every exception and returning a success-shaped value hides defects. When debugging, reduce the input, inspect intermediate values and test a hypothesis. Keep computation separate from file or network effects when possible.

#### Worked example

A function divides failed events by total events. With zero total events, division is undefined. Returning 0% silently implies evidence of no failures. A better contract returns 'no data' or a distinct error state, which the caller displays honestly.

#### Try it

Define the input and output contract for that failure-rate function, including an empty input.

<details>
<summary>Reveal the explained answer</summary>

Require non-negative counts with failures no greater than total. Return a fraction for positive totals and a distinct no-data state for zero. Test invalid counts separately from legitimate empty evidence.

</details>

#### Read, watch or explore next

- **Read:** [Python tutorial — More control flow tools](https://docs.python.org/3/tutorial/controlflow.html) — Read Defining Functions and return values.
  Public page at review; optional paid services are not assigned.
- **Read:** [Python tutorial — Errors and exceptions](https://docs.python.org/3/tutorial/errors.html) — Read Handling Exceptions and Raising Exceptions, concentrating on explicit failure behaviour.
  Public page at review; optional paid services are not assigned.
- **Watch / listen:** [CS50 — Week 6: Python](https://cs50.harvard.edu/x/2026/weeks/6/) — Use the functions and return-values section to trace one call.
  Public lecture and notes; no paid certificate assigned.

<a id="lesson-structured-data"></a>
### Files, CSV, JSON and timestamps

Lesson ID: `lesson.structured-data`

#### Read

CSV stores rows and fields; JSON stores typed values, lists and objects. Use a parser rather than splitting arbitrary text on commas: quoted CSV fields can contain commas and newlines. Validate required fields, types and timestamps before analysis. Distinguish a missing value, an empty string and numeric zero. Preserve raw input so transformations can be reviewed. Timezone-aware timestamps make events from different systems comparable.

#### Worked example

The CSV row `7,"London, UK",failed` has three fields, not four. A simple comma split corrupts the city field. A proper CSV parser respects quotes. A timestamp without timezone needs a documented assumption before comparison with UTC events.

#### Try it

Explain how you would import that row and handle an event whose timestamp is missing its timezone.

<details>
<summary>Reveal the explained answer</summary>

Use a CSV parser, validate the three expected fields and keep the original row. Record timezone as unknown until the source convention is established; do not silently label local time UTC.

</details>

#### Read, watch or explore next

- **Read:** [Python tutorial — Input and output](https://docs.python.org/3/tutorial/inputoutput.html) — Read Reading and Writing Files and Saving structured data with JSON. Compare strings with numeric values after parsing.
  Public page at review; optional paid services are not assigned.

<a id="lesson-regex-parsing"></a>
### Regular expressions and reliable extraction

Lesson ID: `lesson.regex-parsing`

#### Read

A regular expression describes a pattern in text. Anchors constrain position, character classes constrain allowed characters and groups capture relevant parts. Regex is useful for bounded extraction, but it is not a substitute for a format-aware parser when syntax is structured. Test both matches and near-misses. An unanchored pattern may find a valid-looking substring inside invalid input, producing false confidence.

#### Worked example

The pattern `[0-9]+` finds `42` inside `user42x`. It does not establish that the whole field is numeric. Requiring a full match changes the question from 'contains digits' to 'consists of digits'. Validation should match the actual requirement.

#### Try it

Predict whether a full match of `[0-9]{3}` accepts `123`, `12` and `a123`.

<details>
<summary>Reveal the explained answer</summary>

Only `123` matches. The exact length rejects `12`, and full matching rejects the extra prefix in `a123`. Add negative cases whenever you add a pattern.

</details>

#### Read, watch or explore next

- **Read:** [Python — Regular expression HOWTO](https://docs.python.org/3/howto/regex.html) — Read Matching Characters, Repeating Things and Performing Matches. Compare search with full matching.
  Public page at review; optional paid services are not assigned.

<a id="lesson-sql-data"></a>
### Relational data and SQL queries

Lesson ID: `lesson.sql-data`

#### Read

A relational table contains rows with named columns. A primary key identifies a row; foreign keys can express relationships. SELECT chooses data and WHERE filters it. A JOIN combines related rows and can multiply results when the relationship is one-to-many. NULL represents missing or unknown data and does not behave like an ordinary value in comparisons. Start with a tiny dataset whose expected answer you can calculate manually.

#### Worked example

A users table has two users; one user has three login rows. Joining users to logins returns three rows for that user. Counting joined rows is therefore not the same as counting distinct users. The correct aggregation depends on your question.

#### Try it

Given logins `(alice, fail), (alice, fail), (bob, success)`, state failed-event count and distinct users with failures.

<details>
<summary>Reveal the explained answer</summary>

There are two failed events and one distinct user with a failure. Explain why both numbers are valid but answer different questions.

</details>

#### Read, watch or explore next

- **Read:** [PostgreSQL tutorial — Querying a table](https://www.postgresql.org/docs/current/tutorial-select.html) — Read SELECT, WHERE, ORDER BY and DISTINCT examples. Write two queries that answer different counting questions.
  Public page at review; optional paid services are not assigned.

<a id="lesson-testing-safe-code"></a>
### Tests, dependencies and safe tool use

Lesson ID: `lesson.testing-safe-code`

#### Read

Tests compare behaviour with explicit expectations. A fixture supplies controlled input, including edge cases such as empty files, duplicates and invalid timestamps. Useful tests can fail when the underlying behaviour is wrong; merely repeating the implementation in the assertion adds little confidence. Separate pure parsing from network or filesystem effects. Put timeouts and bounded inputs around external operations, and isolate dependencies so setup is reproducible.

#### Worked example

A parser correctly counts ordinary events but silently drops malformed rows. A test containing one valid row and one malformed row should check both the count and a visible rejection report. A test that only checks the valid count misses the loss of evidence.

#### Try it

Design three cases for a function counting failed logins: ordinary, empty and malformed input.

<details>
<summary>Reveal the explained answer</summary>

Assert the expected failure count, a zero count for a valid empty set, and explicit handling of malformed data. Do not treat a parsing failure as evidence that no failed logins occurred.

</details>

#### Read, watch or explore next

- **Read:** [Python — unittest](https://docs.python.org/3/library/unittest.html) — Read Basic example and the assertions used there; write expectations before implementation.
  Public page at review; optional paid services are not assigned.
- **Read:** [Python tutorial — Virtual environments and packages](https://docs.python.org/3/tutorial/venv.html) — Read the environment setup and dependency recording sections.
  Public page at review; optional paid services are not assigned.

<a id="module-automation-git"></a>
## Shell automation, Git and reproducible work

<a id="lesson-git-history"></a>
### Git history, diffs and sensible commits

Lesson ID: `lesson.git-history`

#### Read

Git records snapshots of tracked files. The working tree is what you edit; the index is what you stage; a commit records the staged snapshot with a message and parent. Saving a file does not stage it. Inspect differences before committing, and keep generated secrets and local credentials outside version control. Deleting a secret in a later commit does not remove it from earlier history.

#### Worked example

You edit two files but stage only `notes.md`. The next commit includes the staged notes, not every edit on disk. `git diff` shows unstaged changes; `git diff --cached` shows the proposed commit.

#### Try it

In a disposable repository, edit two text files and stage one. Predict which change the next commit contains, then inspect the staged diff.

<details>
<summary>Reveal the explained answer</summary>

Only the staged content is included. A later edit to the same file also needs staging if it should enter that commit. Review both status and staged diff.

</details>

#### Read, watch or explore next

- **Read:** [Pro Git — Recording changes to the repository](https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository) — Read Tracking New Files, Staging Modified Files and Viewing Your Staged and Unstaged Changes; repeat the two-file experiment.
  Public page at review; optional paid services are not assigned.
- **Watch / listen:** [MIT Missing Semester — Version Control](https://missing.csail.mit.edu/2020/version-control/) — Watch the snapshots, commits and staging explanations; draw the three states of one file.
  Public lecture and notes; no paid certificate assigned.

<a id="lesson-git-collaboration"></a>
### Branches, review and secret hygiene

Lesson ID: `lesson.git-collaboration`

#### Read

A branch names a line of commits. A merge combines histories; it can require a human decision when edits conflict. Fetch downloads remote history without merging it into your branch. A pull request presents a proposed change for review. Small commits with a clear purpose are easier to review and reverse. Never resolve a conflict by choosing a whole side without understanding the affected behaviour.

#### Worked example

Two branches change a firewall note from port 80 to different replacements. The conflict markers show the competing edits, but neither proves the intended configuration. Consult the agreed requirement, edit the final text and verify the result before committing.

#### Try it

Explain why fetching a branch is safer for inspection than immediately merging it. Write a review comment that asks about an uncertain change.

<details>
<summary>Reveal the explained answer</summary>

Fetch lets you compare histories before changing your working branch. A useful comment identifies the behaviour and asks for evidence: 'Which required service uses this port, and where is that requirement recorded?'

</details>

#### Read, watch or explore next

- **Read:** [Pro Git — Basic branching and merging](https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging) — Read Basic Merging and Basic Merge Conflicts. Identify the difference between a fast-forward and a merge commit.
  Public page at review; optional paid services are not assigned.

<a id="lesson-bash-automation"></a>
### Bash scripting with bounded effects

Lesson ID: `lesson.bash-automation`

#### Read

A shell script turns repeated commands into a documented procedure. Quote variable expansions when a value should stay one argument. Check prerequisites and return useful exit statuses. Prefer a dry-run mode for changes. A script should define how it behaves on missing files, spaces in paths and partial failure; success on one sample is not enough.

#### Worked example

With `report='weekly notes.txt'`, `printf '%s\n' "$report"` passes the whole filename as one value. An unquoted expansion can split it. A read-only script that first checks whether the input exists produces a clearer failure than continuing with empty data.

#### Try it

Design a read-only script that counts lines in a supplied file. List three inputs to test before trusting it.

<details>
<summary>Reveal the explained answer</summary>

Test an ordinary file, a path containing spaces and a missing file. Quote the path, reject unreadable input and return a nonzero status on failure. Do not mistake an error message for a successful count.

</details>

#### Read, watch or explore next

- **Read:** [bash(1) - Linux manual page](https://man7.org/linux/man-pages/man1/bash.1.html) — Read Positional Parameters and Special Parameters; distinguish the first argument from the previous command's exit status.
  Public page at review; optional paid services are not assigned.

<a id="lesson-powershell-automation"></a>
### PowerShell automation and structured output

Lesson ID: `lesson.powershell-automation`

#### Read

PowerShell passes objects through pipelines. Functions should accept explicit parameters, return useful objects and separate data from status messages. Filtering objects before formatting preserves their properties for later steps. For functions that change state, support confirmation and WhatIf when appropriate; a printed plan is not proof that an operation happened.

#### Worked example

A function returns objects with Name and Count. A caller can sort by Count or export CSV. If the function instead prints a decorative table as strings, later code must parse presentation text and can break when spacing changes.

#### Try it

Describe a function that summarises a synthetic event list. Specify its input, output properties and behaviour for an empty list.

<details>
<summary>Reveal the explained answer</summary>

Accept event objects, return one summary object per category, and document whether empty input returns no rows or a zero summary. Keep formatting at the final display step.

</details>

#### Read, watch or explore next

- **Read:** [Microsoft Learn — PowerShell functions](https://learn.microsoft.com/en-us/powershell/scripting/learn/ps101/09-functions) — Read the sections on parameters, returning results and advanced functions. Compare object output with Write-Host.
  Public page at review; optional paid services are not assigned.

<a id="lesson-reproducible-tooling"></a>
### Documentation and reproducible tooling

Lesson ID: `lesson.reproducible-tooling`

#### Read

A reproducible tool records its runtime, dependencies, configuration and input format. A Python virtual environment isolates project packages from other projects; it is not a security sandbox. Pinning versions reduces accidental changes but does not guarantee packages are safe. Keep a small known input and expected output so a fresh installation can be checked.

#### Worked example

An analyst's parser works with one library version but fails after an upgrade changes a field name. A recorded dependency set and sample fixture make that difference visible. 'Works on my machine' provides neither the version nor the input needed to reproduce it.

#### Try it

Write a five-item setup checklist for a CSV log parser another student will run.

<details>
<summary>Reveal the explained answer</summary>

Include Python version, environment creation, dependency installation, input schema and a sample invocation with expected output. Document secrets separately and provide placeholders instead of real values.

</details>

#### Read, watch or explore next

- **Read:** [Python tutorial — Virtual environments and packages](https://docs.python.org/3/tutorial/venv.html) — Read Creating Virtual Environments and Managing Packages with pip. Explain what the environment does and does not isolate.
  Public page at review; optional paid services are not assigned.

<a id="module-security-foundations"></a>
## Security principles, risk and identity

<a id="lesson-security-goals"></a>
### Assets, threats and security goals

Lesson ID: `lesson.security-goals`

#### Read

Confidentiality limits disclosure, integrity protects against unauthorised alteration, and availability keeps a service usable when needed. A single event can affect several goals. Controls can prevent, detect or help recover from harm; none is perfect in every setting. Start with the asset and its purpose before choosing a control.

#### Worked example

If a school's grades are secretly changed, integrity is affected even if no record is copied. If the grade portal becomes unreachable, availability is affected. Access controls reduce some risks, audit logs help investigate changes, and tested backups support recovery.

#### Try it

Classify a leaked report, an altered invoice and an unavailable booking service. Choose one relevant control for each.

<details>
<summary>Reveal the explained answer</summary>

Disclosure concerns confidentiality; alteration concerns integrity; outage concerns availability. Suitable examples are restricted access, approval and audit controls, and tested recovery arrangements. Explain the connection instead of listing product names.

</details>

#### Read, watch or explore next

- **Watch / listen:** [Security Controls - CompTIA Security+ SY0-701](https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/security-controls-sy0-701/) — Watch Security Controls and classify two examples as preventive, detective or corrective.
  Public page at review; optional paid services are not assigned.
- **Read:** [NIST Cybersecurity Framework 2.0](https://www.nist.gov/cyberframework) — Open the CSF 2.0 overview and identify the six functions.
  Public page at review; optional paid services are not assigned.

<a id="lesson-risk-prioritisation"></a>
### Risk, impact and proportionate decisions

Lesson ID: `lesson.risk-prioritisation`

#### Read

Risk connects an uncertain event to consequences for an organisation. A vulnerability is a weakness; a threat is a potential cause of harm; a control changes exposure or consequences. Severity scores describe properties of a vulnerability, while priority also depends on the affected asset, exposure, exploitation evidence and business impact. Record assumptions rather than inventing precise probabilities.

#### Worked example

A moderate weakness on an internet-facing login service may need attention before a severe weakness on a powered-off training machine. This is a prioritisation decision supported by context, not a claim that the severe flaw is harmless.

#### Try it

Rank those two cases and name two facts that could reverse your decision.

<details>
<summary>Reveal the explained answer</summary>

Exposure and business dependence favour the login service. Active exploitation of the other asset or evidence that it is actually reachable could change the order. Give an owner and a review date to the decision.

</details>

#### Read, watch or explore next

- **Read:** [FIRST — CVSS v4.0 user guide](https://www.first.org/cvss/v4.0/user-guide) — Read the guidance on threat and environmental metrics. Explain why a base score alone cannot set your remediation queue.
  Public page at review; optional paid services are not assigned.

<a id="lesson-iam-lifecycle"></a>
### Authentication, authorisation and account lifecycle

Lesson ID: `lesson.iam-lifecycle`

#### Read

Identity and access management covers creating identities, granting permissions, reviewing them and removing them. Authentication establishes who or what is requesting access; authorisation decides whether that identity may perform this action on this resource. Least privilege grants the access needed for a role, for an appropriate duration. Moving jobs should trigger a review, not just adding the new role's access.

#### Worked example

A contractor finishes a project. Disabling interactive login alone may leave an API key active. Offboarding must account for sessions, tokens, shared access and owned resources, with responsibility assigned for each.

#### Try it

Design access for a reader and an editor of one project. State an action each must be denied.

<details>
<summary>Reveal the explained answer</summary>

The reader may view the authorised project but cannot edit it. The editor may edit that project but cannot automatically manage users or access other projects. Check permissions on every request.

</details>

#### Read, watch or explore next

- **Read:** [OWASP — Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) — Read Enforce Least Privileges, Deny by Default and Validate the Permissions on Every Request.
  Public page at review; optional paid services are not assigned.
- **Watch / listen:** [Access Controls - CompTIA Security+ SY0-701 - 4.6 - Professor Messer IT Certification Training Courses](https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/access-controls-sy0-701/) — Watch Access Controls and compare role-based and attribute-based decisions.
  Public page at review; optional paid services are not assigned.

<a id="lesson-human-security"></a>
### Human factors, phishing recognition and reporting

Lesson ID: `lesson.human-security`

#### Read

Social engineering exploits trust, urgency or normal workflows to induce an unsafe action. A convincing logo or familiar sender name is not proof of authenticity. Verify unusual requests through a known, independent channel. Reporting should be easy and blame-free so a mistaken click can be handled quickly. Do not open suspicious attachments just to investigate them.

#### Worked example

An unexpected message asks a finance worker to change bank details immediately. Instead of replying to the message's telephone number, the worker contacts the supplier using a number already held in trusted records. This checks the request independently.

#### Try it

Draft a three-sentence response procedure for a suspicious password-reset message.

<details>
<summary>Reveal the explained answer</summary>

Avoid its links, navigate independently to the service if a reset is needed, and report the message through the established channel. If credentials were entered, promptly follow the organisation's account-recovery process.

</details>

#### Read, watch or explore next

- **Read:** [Phishing scams: how to spot and report them | National Cyber Security Centre](https://www.ncsc.gov.uk/collection/phishing-scams) — Read how to recognise and report suspicious messages. Write one example where urgency should trigger independent verification.
  Public page at review; optional paid services are not assigned.

<a id="lesson-governance-data"></a>
### Data handling, governance and ethical decisions

Lesson ID: `lesson.governance-data`

#### Read

Governance assigns who makes security decisions and who is accountable for outcomes. A policy states intent; a standard gives required rules; a procedure explains how to carry them out. Classifying data helps choose handling, access and retention requirements. Collecting more data also creates more exposure and operational responsibility. Requirements depend on the organisation and jurisdiction, so record what needs specialist confirmation.

#### Worked example

A policy says customer records must be protected. A standard requires approved encrypted storage. A procedure shows staff how to use that storage and request access. An owner reviews whether the controls are operating.

#### Try it

Write a policy, standard and procedure sentence for a fictional student project containing only synthetic records.

<details>
<summary>Reveal the explained answer</summary>

The policy names the protection goal; the standard gives a checkable requirement; the procedure gives steps. Assign an owner and a deletion date instead of assuming data should be retained forever.

</details>

#### Read, watch or explore next

- **Read:** [NIST Cybersecurity Framework 2.0](https://www.nist.gov/cyberframework) — Read the Govern function in the CSF 2.0 Core. Identify examples of policy, responsibilities and oversight.
  Public page at review; optional paid services are not assigned.

<a id="module-cryptography-identity"></a>
## Applied cryptography and modern identity

<a id="lesson-hashing-integrity"></a>
### Encoding, hashes and integrity

Lesson ID: `lesson.hashing-integrity`

#### Read

A cryptographic hash maps bytes to a fixed-size digest. Identical inputs produce identical digests; a small change normally changes the digest dramatically. A trusted expected digest can help detect alteration. A digest downloaded from the same compromised location as a file does not independently prove authenticity. Hashing is not encryption and cannot recover the original content.

#### Worked example

You hash two local copies of a report with SHA-256. Matching digests strongly support that their bytes match, but do not tell you who authored the report or whether its claims are true. A digital signature addresses a different question: whether a trusted key signed those bytes.

#### Try it

Predict what happens when one space is added to a file. Explain why storing a raw SHA-256 password digest is inadequate.

<details>
<summary>Reveal the explained answer</summary>

The digest changes. Human passwords can be guessed quickly against fast hashes; use a purpose-built salted password-hashing scheme with appropriate cost parameters.

</details>

#### Read, watch or explore next

- **Read:** [Python — hashlib](https://docs.python.org/3/library/hashlib.html) — Read the usage example and hash-object methods; hash a harmless local text sample.
  Public page at review; optional paid services are not assigned.
- **Watch / listen:** [Hashing and Digital Signatures - CompTIA Security+ SY0-701](https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/hashing-and-digital-signatures-sy0-701/) — Watch Hashing and Digital Signatures; distinguish integrity checking from signer authentication.
  Public page at review; optional paid services are not assigned.

<a id="lesson-encryption-keys"></a>
### Encryption, signatures and key lifecycle

Lesson ID: `lesson.encryption-keys`

#### Read

Encryption transforms plaintext into ciphertext using a key. Symmetric systems use a shared secret; asymmetric systems use related public and private keys for defined operations. The algorithm, mode, nonce handling and key management all matter. Prefer vetted libraries and authenticated encryption; inventing a cipher or hiding the algorithm is not a substitute for protecting keys.

#### Worked example

Encrypting a backup while storing its decryption key beside it with identical permissions leaves an attacker who obtains both able to read it. Separating access to keys and data changes that exposure. Losing the only key can also make recovery impossible.

#### Try it

Draw who can access a backup and its key. Identify one confidentiality risk and one recovery risk.

<details>
<summary>Reveal the explained answer</summary>

Excessive joint access weakens confidentiality; no recoverable key threatens availability. Restrict key access, plan rotation and test recovery with non-sensitive data.

</details>

#### Read, watch or explore next

- **Read:** [OWASP — Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html) — Read Where to Perform Encryption, Algorithms and Key Management; record why authenticated modes and key storage matter.
  Public page at review; optional paid services are not assigned.

<a id="lesson-tls-pki"></a>
### TLS, certificates and trust chains

Lesson ID: `lesson.tls-pki`

#### Read

TLS protects a connection against eavesdropping and tampering when correctly configured and validated. A certificate binds an identity to a public key through a trust system. A client checks the intended hostname, validity and trust chain. A valid HTTPS connection does not prove the site's business is honest, and disabling certificate checks removes a crucial part of authentication.

#### Worked example

A certificate for `shop.example` is not valid for `bank.example` merely because both sites use HTTPS. A hostname mismatch should lead to diagnosing configuration or the URL, not teaching users to ignore warnings.

#### Try it

Explain what HTTPS protects when a user visits a dishonest site's correctly certified domain.

<details>
<summary>Reveal the explained answer</summary>

The connection to that domain can be encrypted and authenticated while the site still deceives the user. Transport protection and trustworthiness of content are separate decisions.

</details>

#### Read, watch or explore next

- **Read:** [MDN — Transport Layer Security](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Transport_Layer_Security) — Read the overview and certificate-related guidance; draw client, server, certificate authority and the hostname being checked.
  Public page at review; optional paid services are not assigned.

<a id="lesson-passwords-mfa"></a>
### Password storage, MFA and recovery

Lesson ID: `lesson.passwords-mfa`

#### Read

Password storage should use a slow, salted password-hashing scheme rather than reversible encryption or a fast general-purpose hash. A salt is unique input, not a replacement for a strong password. Multifactor authentication combines different factor categories; two passwords are still the same factor type. Recovery and session handling must also be protected, or they can undermine strong login controls.

#### Worked example

A service protects login with MFA but allows account recovery through an easily guessed security question. The recovery path becomes the weaker route to the account. Review the whole account lifecycle rather than the login form alone.

#### Try it

Classify a password plus an authenticator app, and a password plus a PIN. Identify one recovery safeguard.

<details>
<summary>Reveal the explained answer</summary>

The first can combine knowledge and possession; two memorised secrets remain knowledge factors. Recovery needs robust verification, controlled reset tokens and notifications appropriate to the service.

</details>

#### Read, watch or explore next

- **Read:** [OWASP — Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) — Read Salting, Work Factors and the algorithm recommendations. Do not memorise cost settings without checking current library guidance.
  Public page at review; optional paid services are not assigned.

<a id="lesson-federation-tokens"></a>
### Sessions, OAuth, OIDC and tokens

Lesson ID: `lesson.federation-tokens`

#### Read

Federation lets a service rely on an identity provider. OAuth concerns delegated authorisation; OpenID Connect adds an identity layer. Access tokens and ID tokens have different audiences and purposes. A signed token still needs validation of signature, issuer, audience, expiry and the application's permissions. Decoding a token's text does not validate it.

#### Worked example

A token issued for application A is presented to application B. Even with a valid signature, B must reject an unsuitable audience. Accepting any token from a familiar issuer can confuse identities and permissions across services.

#### Try it

Explain why an API should not simply accept an ID token intended for a browser application.

<details>
<summary>Reveal the explained answer</summary>

The token may target a different audience and purpose. The API needs the appropriate access token and must perform its own validation and authorisation checks.

</details>

#### Read, watch or explore next

- **Read:** [OpenID Foundation — How OpenID Connect works](https://openid.net/developers/how-connect-works/) — Read the OpenID Connect flow and the role of ID tokens. Draw identity provider, client and resource server.
  Public page at review; optional paid services are not assigned.

<a id="module-web-technologies"></a>
## Web, JavaScript, HTTP and APIs

<a id="lesson-web-architecture"></a>
### Browser, server, HTML and trust boundaries

Lesson ID: `lesson.web-architecture`

#### Read

A browser requests resources from servers, which may call application services and databases. DNS resolves names; HTTP defines request and response semantics; TLS can protect transport. Client-side code runs under the user's control, so security decisions must be enforced by trusted server components. A diagram should show where data crosses trust boundaries.

#### Worked example

A web page hides an admin button for ordinary users. The underlying endpoint still needs to check the caller's permission because a request can be made without that button. Interface visibility improves usability but is not access control.

#### Try it

Draw a browser, web server and database for a reading-list app. Mark where ownership of a saved list should be checked.

<details>
<summary>Reveal the explained answer</summary>

Check ownership in the trusted application before returning or modifying the list. The database should be reachable only through appropriately constrained application access.

</details>

#### Read, watch or explore next

- **Read:** [MDN — How the web works](https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works) — Read Clients and Servers and the sequence of events when a browser requests a page.
  Public page at review; optional paid services are not assigned.
- **Watch / listen:** [Week 8 HTML, CSS, JavaScript - CS50x 2026](https://cs50.harvard.edu/x/2026/weeks/8/) — Use CS50 Week 8's HTTP section to follow one browser request.
  Public page at review; optional paid services are not assigned.

<a id="lesson-http-messages"></a>
### HTTP methods, status, headers and cookies

Lesson ID: `lesson.http-messages`

#### Read

An HTTP request includes a method, target, headers and sometimes a body. A response carries a status, headers and optional body. Status codes describe protocol outcomes, but application meaning still needs inspection. Methods such as GET should not be designed to trigger destructive changes. HTTPS protects transport while leaving application authorisation necessary.

#### Worked example

`GET /books/7` returns 200 with a book representation. `GET /books/99` may return 404 for an absent resource. A 200 response containing an error screen does not prove the intended business operation succeeded.

#### Try it

Label the method, path and status in a captured request to your own local test page. Identify one header and its purpose.

<details>
<summary>Reveal the explained answer</summary>

The method and path belong to the request; the status belongs to the response. Content-Type describes the representation, while authentication and caching headers have different roles.

</details>

#### Read, watch or explore next

- **Read:** [MDN — Overview of HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview) — Read HTTP Messages, Requests and Responses. Sketch one request/response pair without cookies or credentials.
  Public page at review; optional paid services are not assigned.

<a id="lesson-javascript-basics"></a>
### JavaScript, events and asynchronous requests

Lesson ID: `lesson.javascript-basics`

#### Read

JavaScript can update a page and make asynchronous requests. A promise represents a future result, and `await` waits within an async function. A successful network exchange is different from a successful HTTP status: fetch can resolve for a 404 response. Treat server-provided text as data and avoid inserting untrusted strings as HTML.

#### Worked example

A page fetches a missing JSON record. The network request completes, but `response.ok` is false. Checking only whether fetch threw an exception would miss this application failure. Display a useful error before trying to use absent data.

#### Try it

Describe handling for a failed connection, a 404 response and invalid JSON.

<details>
<summary>Reveal the explained answer</summary>

Handle transport rejection, test the HTTP status, and handle parsing failure separately. Give a user-facing message without exposing internal stack traces or secret values.

</details>

#### Read, watch or explore next

- **Read:** [MDN — Using the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) — Read Handling the Response and Checking the Response Status. Explain why a fetch promise resolving does not guarantee 200.
  Public page at review; optional paid services are not assigned.

<a id="lesson-backend-database"></a>
### Server routes, validation and database operations

Lesson ID: `lesson.backend-database`

#### Read

A backend validates requests, enforces business rules and accesses persistent data. SQL parameters represent values separately from query structure. String concatenation can allow user input to change the query's meaning. Parameterisation does not replace authorisation, and identifiers such as column names may need strict allowlists rather than ordinary value parameters.

#### Worked example

A query selects a reading list by ID using a parameter. It also constrains owner_id to the authenticated user. The parameter prevents input becoming SQL syntax; the owner condition prevents reading someone else's list. Both checks have distinct jobs.

#### Try it

Explain the two separate problems in a query built by concatenating a requested list ID with no ownership condition.

<details>
<summary>Reveal the explained answer</summary>

It risks SQL injection and broken access control. Use the database driver's parameter mechanism and enforce the resource's ownership or other applicable permission.

</details>

#### Read, watch or explore next

- **Read:** [OWASP — SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html) — Read Prepared Statements and Allow-list Input Validation. Identify which parts of a query can be parameterised.
  Public page at review; optional paid services are not assigned.

<a id="lesson-web-sessions"></a>
### Sessions, same-origin policy and browser boundaries

Lesson ID: `lesson.web-sessions`

#### Read

A session connects successive requests to an authenticated context, often through a cookie containing an opaque identifier. Secure limits cookie transport to HTTPS; HttpOnly prevents normal JavaScript access; SameSite influences cross-site sending. These flags address different risks and do not fix every session vulnerability. Rotate identifiers appropriately and invalidate sessions when required.

#### Worked example

A user signs out, but a copied session identifier continues to work because only the browser cookie was deleted. Server-side invalidation is needed when the application promises the session has ended.

#### Try it

Match Secure, HttpOnly and SameSite to transport, script access and cross-site request behaviour.

<details>
<summary>Reveal the explained answer</summary>

Secure concerns HTTPS transport, HttpOnly concerns script access, and SameSite concerns cross-site sending. None substitutes for server-side expiry, logout handling or per-request authorisation.

</details>

#### Read, watch or explore next

- **Read:** [MDN — Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies) — Read Security, Block Access to Your Cookies and Controlling Third-party Cookies. Review the flags on a fictional session cookie.
  Public page at review; optional paid services are not assigned.

<a id="lesson-api-design"></a>
### REST, JSON APIs and observable behaviour

Lesson ID: `lesson.api-design`

#### Read

An API exposes operations and data contracts. Consistent resource names, validation, pagination and clear errors make it easier to use and defend. Distinguish authentication, object-level authorisation and input validation. Limit returned fields to what a caller needs. Idempotence means repeating an operation has the same intended effect as doing it once; it does not mean there are no logs or other incidental effects.

#### Worked example

Repeating a properly designed PUT that sets a reading-list title should leave the same title. Repeating a request that creates a new payment could have a different effect unless the API has a suitable idempotency design.

#### Try it

Design GET and update operations for a user's own list. State one permission and one validation rule.

<details>
<summary>Reveal the explained answer</summary>

Check list ownership for both operations. Validate the title's type and length on update, and return only appropriate fields. Choose documented statuses for absent, forbidden and invalid cases.

</details>

#### Read, watch or explore next

- **Read:** [Microsoft Azure Architecture — Web API design best practices](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design) — Read Resource URI Design, Define API Operations in Terms of HTTP Methods and Filter and Paginate Data.
  Public page at review; optional paid services are not assigned.

<a id="module-secure-systems"></a>
## Hardening, resilience and system design

<a id="lesson-threat-modelling"></a>
### Threat modelling a small service

Lesson ID: `lesson.threat-modelling`

#### Read

Threat modelling starts with what a system does, which assets matter, and where trust changes. Identify what could go wrong, choose mitigations and check whether they work. A diagram alone is not a threat model: it needs assumptions, plausible abuse cases and owners for decisions. Repeat the analysis when architecture or use changes.

#### Worked example

A file-upload service accepts documents from strangers and sends them to a parser. The parser crosses a trust boundary. Controls can include type and size limits, isolation, constrained privileges and handling failures without exposing files.

#### Try it

Draw that upload flow and name two distinct threats with a control and verification idea for each.

<details>
<summary>Reveal the explained answer</summary>

Oversized input can exhaust resources: test enforced limits. Malformed input can exploit the parser: use patched components, isolation and safe malformed samples. Avoid claiming one check eliminates every risk.

</details>

#### Read, watch or explore next

- **Read:** [OWASP — Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html) — Read System Modeling, Threat Identification and Response and Review. Produce a small data-flow diagram with one trust boundary.
  Public page at review; optional paid services are not assigned.

<a id="lesson-host-hardening"></a>
### Baseline hardening and change control

Lesson ID: `lesson.host-hardening`

#### Read

Hardening reduces unnecessary exposure through supported software, minimal services, constrained permissions and secure configuration. A baseline is a documented starting point, not a universal list of switches. Check dependencies before disabling services, retain a recovery route, and verify the desired behaviour after a change. Configuration drift means the running system no longer matches the intended baseline.

#### Worked example

Removing an unused remote-access service reduces reachable functionality. Disabling the only authorised administration route during a remote session can instead lock out the operator. A planned change includes impact, rollback and a way to confirm success.

#### Try it

Propose three checks for a disposable Linux guest before changing configuration.

<details>
<summary>Reveal the explained answer</summary>

Inventory listening services, inspect update status and review users/privileges. Record current state and recovery access; choose one justified change and verify its effect.

</details>

#### Read, watch or explore next

- **Read:** [Ubuntu Server — Package management](https://documentation.ubuntu.com/server/how-to/software/package-management/) — Read Updating Packages and Automatic Updates.
  Public page at review; optional paid services are not assigned.
- **Read:** [Microsoft Defender Antivirus in Windows Overview - Microsoft Defender for Endpoint | Microsoft Learn](https://learn.microsoft.com/en-us/defender-endpoint/microsoft-defender-antivirus-windows) — Compare platform security features with the controls available in your actual lab operating system.
  Public page at review; optional paid services are not assigned.

<a id="lesson-network-controls"></a>
### Firewalls, segmentation and secure administration

Lesson ID: `lesson.network-controls`

#### Read

Segmentation limits which systems can communicate. A firewall evaluates traffic against rules; rules need direction, source, destination, protocol and port context. Default-deny policies still need explicitly permitted essential flows. Filtering is one layer alongside identity, application validation and monitoring. An allowed connection does not mean its contents are authorised.

#### Worked example

A web service may need inbound HTTPS and outbound access to one database. Allowing every host to reach that database because 'the application needs it' widens access unnecessarily. Record the specific application-to-database flow.

#### Try it

Write a rule description for that database flow and one expected denial test.

<details>
<summary>Reveal the explained answer</summary>

Permit only the required application source and database destination on the needed protocol/port. Verify an unrelated lab host cannot connect, while the application's legitimate operation still works.

</details>

#### Read, watch or explore next

- **Read:** [Ubuntu Server — Firewalls](https://documentation.ubuntu.com/server/how-to/security/firewalls/) — Read Basic Firewall Usage and rules for specific hosts/networks. Draft rules on paper before changing a machine.
  Public page at review; optional paid services are not assigned.

<a id="lesson-backup-resilience"></a>
### Backups, recovery and operational continuity

Lesson ID: `lesson.backup-resilience`

#### Read

Backups support recovery only if usable copies, keys, dependencies and procedures survive the incident. Recovery point objective concerns tolerable data loss measured in time; recovery time objective concerns restoration time. Replication can copy accidental deletion or corruption, so it is not automatically a substitute for retained backups. Test restoration into an isolated destination.

#### Worked example

A service backs up nightly at midnight. A failure at 18:00 can lose up to 18 hours of new work if no other recoverable copy exists. A 'backup succeeded' notification does not show that the application can restart from it.

#### Try it

For a fictional daily journal, choose recovery objectives and describe one restore test.

<details>
<summary>Reveal the explained answer</summary>

State acceptable lost entries and acceptable downtime separately. Restore a sample to a new location, verify contents and permissions, measure elapsed time and record dependencies.

</details>

#### Read, watch or explore next

- **Read:** [Small organisations guide to cyber security | Backing up your data | National Cyber Security Centre](https://www.ncsc.gov.uk/collection/small-organisations-guide-to-cyber-security/backing-up-your-data) — Read the backup and recovery recommendations. Turn one recommendation into an observable restore check.
  Public page at review; optional paid services are not assigned.

<a id="lesson-cloud-container-overview"></a>
### Cloud, virtual machines and containers

Lesson ID: `lesson.cloud-container-overview`

#### Read

Cloud services divide responsibilities between provider and customer. The split depends on the service: managed infrastructure does not remove responsibility for identities, data and application behaviour. Containers package processes and dependencies while typically sharing a host kernel; they are not equivalent to fully separate machines. Managed services still need configuration, monitoring and cost control.

#### Worked example

A provider maintains object-storage infrastructure, but a customer can expose a private bucket by granting public access. The underlying service being managed does not make the customer's access policy safe.

#### Try it

Compare one customer responsibility for a virtual machine and for managed object storage.

<details>
<summary>Reveal the explained answer</summary>

A VM customer commonly manages the guest OS and application. An object-storage customer still manages access and data handling. Read the exact provider/service responsibility split rather than assuming it.

</details>

#### Read, watch or explore next

- **Read:** [AWS — Shared responsibility model](https://aws.amazon.com/compliance/shared-responsibility-model/) — Read the shared-responsibility examples for infrastructure and abstracted services.
  Public page at review; optional paid services are not assigned.
- **Read:** [Docker — What is a container?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/) — Read the container definition and compare it with a virtual machine.
  Public page at review; optional paid services are not assigned.

<a id="module-vulnerability-assessment"></a>
## Vulnerability assessment and remediation

<a id="lesson-assessment-scope"></a>
### Assessment scope and safe test planning

Lesson ID: `lesson.assessment-scope`

#### Read

An assessment needs a question, an authorised target and a method suited to the risk. Discovery identifies what is present; vulnerability assessment looks for weaknesses; a penetration test may validate agreed attack paths. These are related but not interchangeable. Scope must cover third-party dependencies and disruptive techniques explicitly.

#### Worked example

A team asks whether its staging API enforces ownership. That question can be tested with two supplied test accounts and synthetic records. A broad network scan of the hosting provider would not answer it and would exceed the target.

#### Try it

Write a four-line assessment plan for that API: question, targets, permitted method and stopping rule.

<details>
<summary>Reveal the explained answer</summary>

Use only the assigned staging API and test accounts. Compare each account's access to its own and the other's synthetic records. Stop if real data appears or availability changes unexpectedly.

</details>

#### Read, watch or explore next

- **Read:** [NIST SP 800-115 — Technical guide to information security testing](https://csrc.nist.gov/pubs/sp/800/115/final) — Read the planning and rules-of-engagement material. Distinguish a test objective from a list of tools.
  Public page at review; optional paid services are not assigned.

<a id="lesson-service-discovery"></a>
### Inventory and low-impact service discovery

Lesson ID: `lesson.service-discovery`

#### Read

A listening port suggests a reachable service, not necessarily a vulnerability. Port states describe what a probe observed under particular network conditions. An apparent service banner may be incomplete or misleading. Record the target, timestamp, network path and method so the observation can be reproduced in an authorised lab.

#### Worked example

A scan reports one lab port as filtered. That does not prove the service is absent; a firewall may prevent the probe receiving a decisive response. An administrator's local listener inventory can provide complementary evidence.

#### Try it

Compare open, closed and filtered in your own words. Explain why two network positions can produce different results.

<details>
<summary>Reveal the explained answer</summary>

Open means a service accepted the relevant interaction; closed indicates reachability without a listening service; filtered means filtering prevents a clear classification. Routing and policy can differ by source.

</details>

#### Read, watch or explore next

- **Read:** [Nmap — Port scanning basics](https://nmap.org/book/man-port-scanning-basics.html) — Read the six port states. Interpret a supplied scan report before running any scan of your own lab.
  Public page at review; optional paid services are not assigned.

<a id="lesson-vulnerability-validation"></a>
### Validate scanner and configuration findings

Lesson ID: `lesson.vulnerability-validation`

#### Read

A scanner finding is a lead that needs context. Confirm the affected component, actual version or backported fix, relevant configuration and reachability. Use the least disruptive evidence that can answer the question. A version string alone may not establish exploitability, and a failed test may reflect missing preconditions rather than safety.

#### Worked example

A scanner flags an old package version, but the distribution has backported the security fix without adopting the upstream version number. Checking the vendor advisory and installed package revision can resolve the apparent contradiction.

#### Try it

List the evidence needed before marking that finding confirmed or false positive.

<details>
<summary>Reveal the explained answer</summary>

Preserve the scanner claim, package revision, vendor advisory and relevant configuration. Explain how the advisory applies to that exact build. Leave unresolved items explicitly uncertain.

</details>

#### Read, watch or explore next

- **Read:** [FIRST — CVSS v4.0 user guide](https://www.first.org/cvss/v4.0/user-guide) — Read the discussion of vulnerability characteristics and environmental context; identify which facts your scanner did not establish.
  Public page at review; optional paid services are not assigned.

<a id="lesson-finding-priority"></a>
### Severity, exploitability and remediation order

Lesson ID: `lesson.finding-priority`

#### Read

A useful priority decision combines technical severity with asset importance, exposure, exploitation evidence and available mitigations. Known exploitation increases urgency but does not remove the need to establish whether your asset is affected. A remediation queue should name owners, deadlines and interim controls. Reassess when exposure or evidence changes.

#### Worked example

A public-facing service has an applicable known-exploited flaw; an isolated test tool has a higher base score but no production role. The first may warrant urgent action because the realistic path and consequences are greater.

#### Try it

Write a priority note with three supporting facts and one remaining uncertainty.

<details>
<summary>Reveal the explained answer</summary>

State applicability, exposure and impact; identify the missing fact, such as whether a compensating control blocks the relevant path. Avoid translating a score directly into a deadline without context.

</details>

#### Read, watch or explore next

- **Read:** [GitHub - cisagov/kev-data: Mirror of cisa.gov/kev data files · GitHub](https://github.com/cisagov/kev-data) — Open known_exploited_vulnerabilities.json in this official catalog mirror. Review one entry and its required action; use a fictional asset only.
  Public page at review; optional paid services are not assigned.
- **Read:** [FIRST — CVSS v4.0 user guide](https://www.first.org/cvss/v4.0/user-guide) — Compare base severity with threat and environmental information.
  Public page at review; optional paid services are not assigned.

<a id="lesson-security-reporting"></a>
### Findings, remediation and retest

Lesson ID: `lesson.security-reporting`

#### Read

A finding should let a responsible owner understand and fix the problem. Include affected asset, observed behaviour, expected behaviour, reproducible evidence, impact, recommendation and limitations. Separate a concise decision summary from technical details. A screenshot alone rarely explains preconditions or establishes repeatability. Redact secrets while preserving the evidence's meaning.

#### Worked example

'Access control is broken' is vague. 'Test account A could read account B's synthetic record in the staging API' identifies the boundary and observation. The recommendation should name the missing server-side ownership check and a regression test.

#### Try it

Write a finding title and a two-sentence impact/remediation paragraph for that case.

<details>
<summary>Reveal the explained answer</summary>

A suitable title names cross-account record access. Explain exposure of other users' records, then require server-side authorisation for each object and positive/negative tests. State that only staging synthetic data was tested.

</details>

#### Read, watch or explore next

- **Read:** [OWASP WSTG — Reporting structure](https://owasp.github.io/www-project-web-security-testing-guide/latest/5-Reporting/01-Reporting_Structure) — Read the reporting structure and compare executive summary, findings and remediation guidance.
  Public page at review; optional paid services are not assigned.

<a id="module-defensive-foundations"></a>
## Defensive security, logs and SOC foundations

<a id="lesson-telemetry-basics"></a>
### Events, logs and telemetry quality

Lesson ID: `lesson.telemetry-basics`

#### Read

Telemetry is evidence emitted by systems: logs, metrics, traces and events. It is useful only if the source, time, identity and relevant action can be interpreted. Collection can be incomplete, delayed or disabled. Avoid logging secrets and unnecessary personal content. Plan access, retention and integrity controls for logs themselves.

#### Worked example

An authentication event records a failure but omits the account and time zone. It is difficult to correlate with other activity. Adding structured fields improves analysis, while logging the attempted password would create a new security problem.

#### Try it

Design six fields for a synthetic login event and name one field that must not be logged.

<details>
<summary>Reveal the explained answer</summary>

Include event time, timezone, account identifier, source, action/result and event ID or correlation ID. Do not record passwords or full authentication tokens. Document missing-value handling.

</details>

#### Read, watch or explore next

- **Read:** [OWASP — Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) — Read Event Attributes and Data to Exclude.
  Public page at review; optional paid services are not assigned.
- **Watch / listen:** [Log Data - CompTIA Security+ SY0-701 - 4.9 - Professor Messer IT Certification Training Courses](https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/log-data-sy0-701/) — Watch Log Data and list what two different log sources can establish.
  Public page at review; optional paid services are not assigned.

<a id="lesson-log-analysis"></a>
### Filtering, timelines and competing hypotheses

Lesson ID: `lesson.log-analysis`

#### Read

Analysis turns events into a bounded question. Normalise time, validate fields, filter the relevant interval, group carefully and inspect representative raw records. Counts depend on the unit: rows, unique users and sessions are different. Preserve the original evidence and explain transformations so another analyst can repeat the result.

#### Worked example

Ten failed logins may be ten attempts by one user or one attempt by each of ten users. Grouping by account and source exposes the difference. Duplicated ingestion can also inflate the count.

#### Try it

For six synthetic rows, three duplicated, describe how you would report total rows and distinct events.

<details>
<summary>Reveal the explained answer</summary>

Report both the ingested row count and the deduplicated count using a justified key. Do not silently delete repeated events merely because their visible messages resemble each other.

</details>

#### Read, watch or explore next

- **Read:** [Microsoft Learn — Get-WinEvent](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.diagnostics/get-winevent) — Read filtering examples for Get-WinEvent. Identify which filter fields your synthetic dataset actually contains.
  Public page at review; optional paid services are not assigned.
- **Read:** [OWASP — Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) — Review time synchronisation and verification guidance.
  Public page at review; optional paid services are not assigned.

<a id="lesson-soc-triage"></a>
### SOC workflow and alert triage

Lesson ID: `lesson.soc-triage`

#### Read

Triage determines whether an alert needs action, more evidence or closure. Start with what triggered it, the affected identities/assets, time window and confidence. Check plausible benign explanations and corroborating sources. An alert is a signal, not a confirmed incident. Escalate based on impact and evidence, with a clear handover.

#### Worked example

A login from a new location could reflect travel, a VPN or account misuse. Compare device history, MFA events and subsequent actions before choosing a conclusion. Do not let a reassuring geolocation alone outweigh stronger evidence.

#### Try it

Write a triage note with observed facts, two hypotheses and one next query.

<details>
<summary>Reveal the explained answer</summary>

Keep hypotheses separate from evidence. A useful next query examines whether the login was followed by unusual privileged changes or data access, within a defined time window.

</details>

#### Read, watch or explore next

- **Read:** [MITRE ATT&CK — Valid Accounts](https://attack.mitre.org/techniques/T1078/) — Read Valid Accounts detection ideas and identify evidence that would distinguish ordinary use from abuse.
  Public page at review; optional paid services are not assigned.

<a id="lesson-attack-defence-mapping"></a>
### Attacker behaviour and defensive visibility

Lesson ID: `lesson.attack-defence-mapping`

#### Read

ATT&CK describes observed adversary behaviours and can help organise hypotheses and coverage. Mapping a technique does not identify an attacker or prove detection completeness. A useful mapping explains why the behaviour fits, which telemetry supports it and what remains unseen. Prefer a specific, defensible mapping over many speculative labels.

#### Worked example

A successful login is not automatically malicious Valid Accounts activity. Evidence that a stolen test credential was used in an authorised exercise gives the behaviour context. The detection still needs to distinguish expected use from abuse.

#### Try it

Map a fictional unauthorised account use to a technique and state one limitation of the mapping.

<details>
<summary>Reveal the explained answer</summary>

Valid Accounts is a candidate when the account's use is established as abusive. The mapping alone does not establish how the credential was obtained or who used it.

</details>

#### Read, watch or explore next

- **Read:** [MITRE ATT&CK — Valid Accounts](https://attack.mitre.org/techniques/T1078/) — Read the technique description, detection and mitigations; write one evidence-backed mapping and one unsupported inference to avoid.
  Public page at review; optional paid services are not assigned.

<a id="lesson-response-basics"></a>
### Containment, escalation and recovery basics

Lesson ID: `lesson.response-basics`

#### Read

Incident response coordinates investigation, containment, recovery and learning. Preparation defines roles, contacts and authority before urgency makes decisions harder. Containment can protect systems but also interrupt operations or destroy volatile evidence, so consider dependencies and approvals. Record decisions and timestamps throughout.

#### Worked example

An affected workstation may need network isolation, but shutting it down immediately can lose memory evidence. The appropriate action depends on ongoing harm, evidence needs and the organisation's response plan; no universal sequence fits every incident.

#### Try it

For a fictional suspicious login, name an immediate evidence-preservation step and a proportionate containment option.

<details>
<summary>Reveal the explained answer</summary>

Preserve relevant event records and session context. An authorised responder might revoke the suspicious session or restrict the affected account, while coordinating impact and recovery. Record the reason and result.

</details>

#### Read, watch or explore next

- **Read:** [NIST SP 800-61 Rev. 3 — Incident response recommendations](https://csrc.nist.gov/pubs/sp/800/61/r3/final) — Read the publication's incident-response model and response/recovery recommendations.
  Public page at review; optional paid services are not assigned.
- **Watch / listen:** [Incident Response - CompTIA Security+ SY0-701 - 4.8 - Professor Messer IT Certification Training Courses](https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/incident-response-sy0-701/) — Watch Incident Response and compare preparation, containment and recovery actions.
  Public page at review; optional paid services are not assigned.

<a id="module-career-portfolio"></a>
## Professional practice, portfolio and job preparation

<a id="lesson-role-selection"></a>
### Understand roles and select a first target

Lesson ID: `lesson.role-selection`

#### Read

Cybersecurity roles differ in their daily work, evidence and prerequisites. A job title is a weak guide by itself. Compare actual tasks: monitoring events, reviewing code, configuring identity, testing applications or managing risk. Choose an initial direction through small projects that reveal which work you can sustain and explain.

#### Worked example

A student enjoys turning noisy logs into an evidence-based timeline but dislikes maintaining web applications. That experience supports exploring analyst work; it does not prove all analyst roles are alike or exclude future AppSec work.

#### Try it

Pick two roles and write one concrete weekly task and one portfolio artefact for each.

<details>
<summary>Reveal the explained answer</summary>

An analyst might produce a triage timeline; an AppSec reviewer might produce a reviewed code change with regression tests. Use task descriptions to identify learning gaps rather than collecting unrelated certificates.

</details>

#### Read, watch or explore next

- **Read:** [NIST NICE — Framework components](https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center/nice-framework-current-versions) — Inspect work roles and task/knowledge/skill components. Select two task statements that match work you want to try.
  Public page at review; optional paid services are not assigned.

<a id="lesson-portfolio-evidence"></a>
### Build an honest, useful portfolio

Lesson ID: `lesson.portfolio-evidence`

#### Read

A portfolio demonstrates decisions, reproducibility and limitations. A strong item states the question, environment, method, evidence, conclusion and what changed after feedback. Readers should be able to distinguish your work from a tutorial's supplied solution. Use synthetic or explicitly shareable data and remove credentials and identifying details.

#### Worked example

A log-analysis notebook includes a tiny fictional dataset, a documented query, a timeline and two competing explanations. This gives a reviewer more evidence than a screenshot saying a lab was completed.

#### Try it

Outline a portfolio page for one completed lesson using six headings.

<details>
<summary>Reveal the explained answer</summary>

Include objective, scope, setup, method, results and limitations/next steps. Link to runnable or readable evidence and explain your contribution. Do not imply a training result was a production incident.

</details>

#### Read, watch or explore next

- **Read:** [The Turing Way — Reproducible research](https://book.the-turing-way.org/reproducible-research/overview) — Read the reproducibility overview and audit your project for missing inputs, versions and procedures.
  Public page at review; optional paid services are not assigned.

<a id="lesson-professional-communication"></a>
### Tickets, handoffs and responsible disclosure

Lesson ID: `lesson.professional-communication`

#### Read

Security communication should fit the decision and audience. Explain what is known, why it matters, what action is proposed and who owns it. Translate technical findings into consequences without exaggerating certainty. A concise handover includes timestamps, evidence locations, completed actions and unresolved questions.

#### Worked example

'Possible account misuse; session revoked; no confirmed data access yet' communicates different certainty levels. 'Everything is compromised' hides both scope and evidence, making it harder to choose a proportionate response.

#### Try it

Write a four-sentence handover for a synthetic alert: status, evidence, action and next step.

<details>
<summary>Reveal the explained answer</summary>

Each sentence should answer a decision-relevant question. Label unknowns and assign the next investigation step; avoid tool output dumps that leave the recipient to infer the conclusion.

</details>

#### Read, watch or explore next

- **Read:** [OWASP WSTG — Reporting structure](https://owasp.github.io/www-project-web-security-testing-guide/latest/5-Reporting/01-Reporting_Structure) — Use the executive-summary guidance to rewrite one technical finding for a service owner.
  Public page at review; optional paid services are not assigned.

<a id="lesson-applications-interviews"></a>
### Applications, technical interviews and demonstrations

Lesson ID: `lesson.applications-interviews`

#### Read

An interview example is stronger when it shows the problem, your reasoning, your action and an observable result. Be precise about what you did yourself and what a tool or teammate supplied. If you do not know an answer, describe how you would investigate it and the limits of your current understanding.

#### Worked example

Asked about DNS troubleshooting, you explain checking name resolution separately from service reachability, then give a lab observation that changed your hypothesis. This demonstrates a method rather than reciting command names.

#### Try it

Prepare a 90-second answer about one mistake you corrected during a lab.

<details>
<summary>Reveal the explained answer</summary>

State the initial assumption, the contradictory evidence, the correction and how you verified it. Do not invent employment experience; a clearly labelled training example is valid evidence of learning.

</details>

#### Read, watch or explore next

- **Read:** [NIST NICE — Framework components](https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center/nice-framework-current-versions) — Choose one relevant task statement and prepare a truthful example showing your current ability to perform part of it.
  Public page at review; optional paid services are not assigned.

<a id="lesson-learning-roadmap"></a>
### Readiness review and continuing development

Lesson ID: `lesson.learning-roadmap`

#### Read

A roadmap should connect a goal to missing skills, deliberate practice and review dates. Distinguish foundations needed now from advanced topics that can wait. Use demonstrated performance to adjust difficulty. Completion counts are useful for organisation but cannot substitute for an unfamiliar task performed without the answer visible.

#### Worked example

A learner can follow a packet-filter tutorial but cannot select a filter for a new question. The next step is a small unseen capture question, not repeating the same video until it feels familiar.

#### Try it

Plan two weeks with one foundation gap, one practical artefact and one independent checkpoint.

<details>
<summary>Reveal the explained answer</summary>

Make the checkpoint observable: for example, explain an unfamiliar request trace and justify two conclusions. Include time for correction and revisit rather than filling every session with new material.

</details>

#### Read, watch or explore next

- **Read:** [Learning Scientists — Six strategies for effective learning](https://www.learningscientists.org/downloadable-materials) — Use retrieval and spaced practice to schedule two delayed checks for your selected skill.
  Public page at review; optional paid services are not assigned.

<a id="module-web-security"></a>
## Web application and API security testing

<a id="lesson-web-testing-workflow"></a>
### Proxy workflow and web test planning

Lesson ID: `lesson.web-testing-workflow`

#### Read

Web testing begins by understanding normal behaviour with assigned test accounts. Map endpoints, roles, state changes and trust boundaries, then choose tests tied to specific hypotheses. A proxy helps inspect requests and responses; it does not decide whether an action is authorised. Keep evidence minimal and reproducible within the assigned training instance.

#### Worked example

Two lab users own separate notes. You record a normal read, then compare whether the server enforces ownership using the provider's authorised test procedure. The result should include account role, object ownership and observed response.

#### Try it

Draft a test matrix with owner, other user and unauthenticated caller for one synthetic note.

<details>
<summary>Reveal the explained answer</summary>

The owner may have intended access; the other callers should receive the documented denial or login flow. Record actual response and data exposure, not only status codes.

</details>

#### Read, watch or explore next

- **Practice:** [PortSwigger — Intercepting HTTP traffic](https://portswigger.net/burp/documentation/desktop/getting-started/intercepting-http-traffic) — Follow the Burp tutorial using its demonstration target only. Learn interception, forwarding and history before testing a lab.
  Public instructions; provider lab may require a free account.

<a id="lesson-injection-security"></a>
### SQL and command injection: causes and fixes

Lesson ID: `lesson.injection-security`

#### Read

Injection occurs when untrusted input is interpreted as part of a command or query language. The defensive goal is to keep data separate from structure. For SQL, parameterised queries are the main control for values. Training labs make the boundary visible; use only the lab's assigned target and read remediation alongside the demonstration.

#### Worked example

A search term is inserted into a SQL string, allowing its syntax to affect the query. Binding it as a parameter preserves it as a value. Input length limits alone do not establish that separation.

#### Try it

Complete the named beginner lab, then rewrite its root cause and fix in plain English without copying the solution.

<details>
<summary>Reveal the explained answer</summary>

Explain which input reached which interpreter, why structure changed and how parameterisation would prevent that class of change. Include a regression case that verifies ordinary quoted text works safely.

</details>

#### Read, watch or explore next

- **Read:** [PortSwigger — SQL injection](https://portswigger.net/web-security/sql-injection) — Read What Is SQL Injection and How to Prevent SQL Injection.
  Public page at review; optional paid services are not assigned.
- **Practice:** [PortSwigger — SQL injection: retrieving hidden data](https://portswigger.net/web-security/sql-injection/lab-retrieve-hidden-data) — Use the assigned lab instance, try independently, then compare the explanation with your evidence.
  Public instructions; provider lab may require a free account.

<a id="lesson-browser-security-testing"></a>
### XSS, CSRF and cross-origin mistakes

Lesson ID: `lesson.browser-security-testing`

#### Read

Cross-site scripting occurs when untrusted content executes as script in another user's browser context. Reflected, stored and DOM-based describe different paths. Defences depend on the output context: safe DOM APIs, contextual encoding and appropriate sanitisation have different roles. A content security policy is an additional layer, not a replacement for fixing unsafe data handling.

#### Worked example

A comments page displays text using a safe text node. Changing it to HTML interpretation gives the same input a new capability. Review the data flow from input to browser sink, rather than assuming all string display is equivalent.

#### Try it

Compare displaying a comment as text with inserting it as HTML. Name the trust boundary and a regression check.

<details>
<summary>Reveal the explained answer</summary>

The browser must treat the untrusted comment as data. A test can verify markup-like input is displayed literally and does not create active elements. Use only harmless local or provider lab samples.

</details>

#### Read, watch or explore next

- **Read:** [PortSwigger — Cross-site scripting](https://portswigger.net/web-security/cross-site-scripting) — Read Reflected, Stored and DOM-based XSS and prevention guidance. Draw one source-to-sink path.
  Public page at review; optional paid services are not assigned.

<a id="lesson-access-auth-testing"></a>
### Authentication, sessions and broken object access

Lesson ID: `lesson.access-auth-testing`

#### Read

Authentication and authorisation need separate tests. A user can be correctly logged in yet forbidden from another user's record or an administrative action. Object identifiers are not secrets that replace permission checks. Test roles, ownership, unauthenticated requests and changes of state with synthetic accounts and explicit scope.

#### Worked example

Hiding a delete button from readers does not protect a delete endpoint. The server must reject an unauthorised request even if the caller constructs it directly. A successful UI restriction is only one observation.

#### Try it

Create a permission matrix for viewer, owner and administrator over a synthetic document.

<details>
<summary>Reveal the explained answer</summary>

Define view, edit, delete and sharing separately. Test both allowed and denied cases, including direct endpoint access. Avoid assuming an administrator should automatically bypass every data boundary.

</details>

#### Read, watch or explore next

- **Read:** [PortSwigger — Access control vulnerabilities](https://portswigger.net/web-security/access-control) — Read Vertical and Horizontal Privilege Escalation and Preventing Access Control Vulnerabilities.
  Public page at review; optional paid services are not assigned.

<a id="lesson-server-side-web"></a>
### Server-side requests, files and parsers

Lesson ID: `lesson.server-side-web`

#### Read

Server-side request forgery lets an attacker influence requests made by a server. That server may reach destinations the client cannot, crossing a network trust boundary. Defences include tightly constrained destinations, robust URL handling, redirect checks and network egress limits. File handling and server-side interpretation also need explicit limits on what untrusted input can cause.

#### Worked example

A preview service accepts a URL. Checking its initial hostname but following an unchecked redirect can invalidate the intended restriction. Review the final destination and every permitted redirect, not only the first string.

#### Try it

Draw client, preview service and allowed content origin. List two controls and one bypass assumption to investigate in a training lab.

<details>
<summary>Reveal the explained answer</summary>

Restrict destinations by policy and enforce network egress boundaries. Check redirect and name-resolution behaviour. Use a provider's SSRF lab rather than probing real internal addresses.

</details>

#### Read, watch or explore next

- **Read:** [PortSwigger — Server-side request forgery](https://portswigger.net/web-security/ssrf) — Read What Is SSRF, Common Attacks and Circumventing Common Defences to understand why simplistic filters fail.
  Public page at review; optional paid services are not assigned.

<a id="lesson-api-business-logic"></a>
### API authorisation and business logic testing

Lesson ID: `lesson.api-business-logic`

#### Read

Business-logic flaws violate intended workflow rules even when each request is syntactically valid. Identify invariants: quantities stay positive, an order is paid once, and a refund cannot exceed eligible payment. Model state transitions and permissions. API testing should check sequences and concurrent operations, not just isolated endpoints.

#### Worked example

A fictional checkout accepts a negative item quantity. The arithmetic produces an unintended credit despite valid JSON. The missing rule is a business constraint enforced by the server, not a JSON parsing issue.

#### Try it

Write three invariants for a training booking service and one negative test for each.

<details>
<summary>Reveal the explained answer</summary>

Examples: seats cannot fall below zero; only the owner can cancel; a cancelled booking cannot be charged again. Validate state transitions and transactional behaviour, using synthetic data.

</details>

#### Read, watch or explore next

- **Read:** [PortSwigger — Business logic vulnerabilities](https://portswigger.net/web-security/logic-flaws) — Read Examples of Business Logic Vulnerabilities and prevention guidance. Turn one example into a stated invariant.
  Public page at review; optional paid services are not assigned.

<a id="module-penetration-testing"></a>
## Penetration testing methodology and reporting

<a id="lesson-pentest-engagement"></a>
### Rules of engagement and test design

Lesson ID: `lesson.pentest-engagement`

#### Read

A penetration test is an agreed investigation, not permission to attempt everything technically possible. Define objectives, targets, allowed techniques, test accounts, time limits, communication and cleanup. Discuss operational effects before testing. The report should answer the engagement's questions, including what was not tested.

#### Worked example

A staging assessment permits ownership checks but excludes password guessing and load testing. Discovering a login page does not expand those permissions. The tester records the observation and continues within the agreed method.

#### Try it

Write a scope and stopping rule for a two-account web lab.

<details>
<summary>Reveal the explained answer</summary>

Name the assigned host and synthetic accounts, permit bounded ownership tests, exclude unrelated services and stop on real data or unexpected disruption. Include evidence handling and cleanup.

</details>

#### Read, watch or explore next

- **Read:** [NIST SP 800-115 — Technical guide to information security testing](https://csrc.nist.gov/pubs/sp/800/115/final) — Read Appendix B and adapt the rules-of-engagement fields to your lab.
  Public page at review; optional paid services are not assigned.

<a id="lesson-recon-hypotheses"></a>
### Reconnaissance and hypothesis-driven enumeration

Lesson ID: `lesson.recon-hypotheses`

#### Read

Reconnaissance should reduce uncertainty about an authorised system. Maintain separate columns for observations, hypotheses and tests. Passive information can be stale; active discovery can affect a service. Select the smallest permitted check that distinguishes competing explanations. More collected data is not automatically better understanding.

#### Worked example

A lab exposes HTTPS and redirects to a login page. This supports 'a web application is present', not 'the application has an authentication bypass'. A useful next question concerns intended roles and available test accounts.

#### Try it

Turn three lab observations into hypotheses and name evidence that would disprove each.

<details>
<summary>Reveal the explained answer</summary>

Every hypothesis should be falsifiable. A banner can suggest software; an authoritative package inventory can contradict it. State confidence and avoid turning a tool label into a confirmed finding.

</details>

#### Read, watch or explore next

- **Read:** [Nmap — Port scanning basics](https://nmap.org/book/man-port-scanning-basics.html) — Read the interpretation of port states and compare observations with what remains unknown.
  Public page at review; optional paid services are not assigned.

<a id="lesson-controlled-validation"></a>
### Exploit selection and minimal lab validation

Lesson ID: `lesson.controlled-validation`

#### Read

Validation establishes whether a suspected weakness actually exists under stated conditions. Use a minimal demonstration with synthetic data, preserve a normal baseline and stop when the agreed question is answered. A failed attempt does not prove absence; a successful attempt does not prove unlimited impact.

#### Worked example

Reading one other test account's synthetic record establishes a particular ownership failure. Downloading all records adds impact and risk without necessarily strengthening the finding. Record the minimal request, identity, expected denial and actual result.

#### Try it

Define sufficient evidence for that ownership finding and one limitation.

<details>
<summary>Reveal the explained answer</summary>

Evidence should show account context, object ownership and unauthorised returned data. Limit the claim to tested actions and roles; do not infer write access from read access.

</details>

#### Read, watch or explore next

- **Read:** [PortSwigger — Access control vulnerabilities](https://portswigger.net/web-security/access-control) — Read horizontal access-control failures and prevention. Write a minimal validation plan before using a training lab.
  Public page at review; optional paid services are not assigned.

<a id="lesson-access-impact"></a>
### Post-access judgement and evidence limits

Lesson ID: `lesson.access-impact`

#### Read

Security impact describes what a demonstrated capability enables, subject to constraints. Distinguish reading, changing, deleting and administering resources. A chain of weaknesses needs evidence for each link; plausible continuation should be labelled as a hypothesis. Do not escalate privileges merely to produce a dramatic screenshot.

#### Worked example

A lab account can edit one shared document but cannot manage users. The supported impact is unauthorised document modification, not complete system control. The affected content and business process determine why the flaw matters.

#### Try it

Write a supported impact sentence and an unsupported exaggeration for this case.

<details>
<summary>Reveal the explained answer</summary>

Supported: an unintended user can alter the tested document. Unsupported: the whole organisation is compromised. State prerequisites and scope alongside consequences.

</details>

#### Read, watch or explore next

- **Read:** [OWASP WSTG — Reporting structure](https://owasp.github.io/www-project-web-security-testing-guide/latest/5-Reporting/01-Reporting_Structure) — Read findings and impact-reporting guidance; make each claim traceable to a recorded observation.
  Public page at review; optional paid services are not assigned.

<a id="lesson-pentest-delivery"></a>
### Professional pentest report, cleanup and retest

Lesson ID: `lesson.pentest-delivery`

#### Read

Delivery includes a clear report, evidence handover, removal of test artefacts and retesting of agreed fixes. Retesting checks the original failure and relevant legitimate behaviour. A patched example may leave similar endpoints affected, so distinguish a specific verified fix from a comprehensive review.

#### Worked example

A developer adds an ownership check. Retesting confirms the other user is denied and the owner still succeeds. The report records the build and date, and notes that unrelated endpoints were outside the retest.

#### Try it

Create a retest checklist for a synthetic cross-account read flaw.

<details>
<summary>Reveal the explained answer</summary>

Repeat the original failing case, test valid access, inspect relevant variants, document version and scope, and remove test records or access according to the engagement agreement.

</details>

#### Read, watch or explore next

- **Read:** [OWASP WSTG — Reporting structure](https://owasp.github.io/www-project-web-security-testing-guide/latest/5-Reporting/01-Reporting_Structure) — Use the reporting structure to draft a finding status update with evidence and remaining limitations.
  Public page at review; optional paid services are not assigned.

<a id="module-active-directory"></a>
## Active Directory and enterprise identity

<a id="lesson-ad-structure"></a>
### Domains, forests, objects and DNS

Lesson ID: `lesson.ad-structure`

#### Read

Active Directory Domain Services organises identities and resources in domains, forests and organisational units. Domain controllers provide directory and authentication services. An organisational unit can support administration and policy targeting, but it is not the same thing as a security group. Understand relationships before interpreting permissions.

#### Worked example

An employee object lives in an HR organisational unit and belongs to a payroll-readers group. The group can grant resource access; the organisational unit may determine which policies apply. Their roles differ even when their names resemble each other.

#### Try it

Draw a forest, domain, organisational unit, user and group. Label an administrative relationship and an access relationship.

<details>
<summary>Reveal the explained answer</summary>

Place the user in the organisational unit and show group membership separately. Do not equate directory location with all effective permissions.

</details>

#### Read, watch or explore next

- **Read:** [Microsoft Learn — Active Directory Domain Services overview](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview) — Read the overview and directory-service components. Define domain controller, domain and forest in your own words.
  Public page at review; optional paid services are not assigned.

<a id="lesson-kerberos-directory"></a>
### Kerberos, LDAP and authentication flows

Lesson ID: `lesson.kerberos-directory`

#### Read

Kerberos uses tickets to authenticate access to services without repeatedly sending a user's password to each service. The client, key distribution centre and service have distinct roles. Time, names and service identities matter. Authentication success still leaves the service responsible for authorisation.

#### Worked example

A user obtains a ticket for one service. That ticket is not a universal permission to read every file on the server. The service must apply the user's effective rights to the requested resource.

#### Try it

Draw the ticket-granting and service-ticket stages at a high level. Identify where access rights are checked.

<details>
<summary>Reveal the explained answer</summary>

The client first obtains a ticket-granting ticket, then a ticket for the relevant service. The service authenticates the request and enforces its access policy.

</details>

#### Read, watch or explore next

- **Read:** [Microsoft Learn — Kerberos authentication overview](https://learn.microsoft.com/en-us/windows-server/security/kerberos/kerberos-authentication-overview) — Read the protocol overview and benefits. Keep authentication flow separate from the resource's permission decision.
  Public page at review; optional paid services are not assigned.

<a id="lesson-ad-policy"></a>
### Groups, GPOs and delegated administration

Lesson ID: `lesson.ad-policy`

#### Read

Group Policy applies managed configuration based on directory structure, links, inheritance and filtering. Effective policy can differ from one visible policy object's settings. Changes need controlled scope and rollback because a mistaken rule can affect many users or computers. Inspect resultant policy rather than guessing from a name.

#### Worked example

A password or desktop setting appears in one policy object, but another applicable policy or filtering rule changes the result. Looking at the editor alone does not establish the endpoint's effective configuration.

#### Try it

Explain why a test organisational unit is useful before a broad policy change.

<details>
<summary>Reveal the explained answer</summary>

It allows a controlled set of users/computers to validate applicability and side effects. Record link location, filtering, expected outcome and rollback, then inspect effective policy.

</details>

#### Read, watch or explore next

- **Read:** [Microsoft Learn — Group Policy overview](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/group-policy/group-policy-overview) — Read how Group Policy works and its management components. Trace one setting from policy object to a test computer.
  Public page at review; optional paid services are not assigned.

<a id="lesson-ad-exposure"></a>
### Identity exposure and attack-path reasoning

Lesson ID: `lesson.ad-exposure`

#### Read

Directory exposure often comes from excessive privileges, stale accounts, insecure delegation and administrative practices. An attack path describes relationships that may permit a sequence of actions; it is not proof that every step is usable. Validate assumptions with authorised, minimally invasive evidence and consider operational dependencies.

#### Worked example

A service account has broad group membership despite needing one application resource. Removing unnecessary membership can reduce exposure, but first identify services depending on that account and test a scoped replacement.

#### Try it

Identify three facts needed before reducing the service account's rights.

<details>
<summary>Reveal the explained answer</summary>

Establish actual resource needs, current effective privileges and dependent services. Plan testing and rollback; do not remove access blindly on a production directory.

</details>

#### Read, watch or explore next

- **Read:** [Microsoft Learn — Best practices for securing Active Directory](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/security-best-practices/best-practices-for-securing-active-directory) — Read reducing the attack surface and protecting privileged accounts. Turn one recommendation into a review question.
  Public page at review; optional paid services are not assigned.

<a id="lesson-ad-defence"></a>
### AD hardening, audit and recovery

Lesson ID: `lesson.ad-defence`

#### Read

Defending a directory requires protecting privileged identities, maintaining controllers, limiting administrative paths and monitoring important changes. Preventive controls and visibility complement each other. A group-membership alert is useful only if the organisation can identify the actor, target, expected change and response owner.

#### Worked example

A privileged group gains a new member. A defender correlates the change with an approved request and the administrator's session. An approved change and a suspicious change can have similar event shapes but different context.

#### Try it

Draft a triage checklist for that membership event.

<details>
<summary>Reveal the explained answer</summary>

Check actor, target, time, source, approval and subsequent activity. Preserve evidence and route unexplained changes to the authorised responder rather than automatically declaring compromise.

</details>

#### Read, watch or explore next

- **Read:** [Microsoft Learn — Best practices for securing Active Directory](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/security-best-practices/best-practices-for-securing-active-directory) — Read the privileged-account protection guidance.
  Public page at review; optional paid services are not assigned.
- **Read:** [MITRE ATT&CK — Valid Accounts](https://attack.mitre.org/techniques/T1078/) — Review mitigation and detection ideas for account abuse.
  Public page at review; optional paid services are not assigned.

<a id="module-privilege-escalation"></a>
## Local privilege boundaries and escalation labs

<a id="lesson-privilege-enumeration"></a>
### Local enumeration and execution context

Lesson ID: `lesson.privilege-enumeration`

#### Read

Privilege enumeration asks who you are, what you can access and which trusted processes act on your behalf. Effective rights can come from groups, file permissions, service configuration and delegation. Start with read-only inventory. A potentially dangerous configuration needs contextual validation before being called exploitable.

#### Worked example

A writable configuration file belongs to a service running with greater privilege. The important questions are whether the service reads that file, how it interprets it and whether the current user truly has write access.

#### Try it

Make an evidence table for identity, groups, writable paths and privileged services in a disposable lab.

<details>
<summary>Reveal the explained answer</summary>

Record observed rights and the source of each observation. Keep a separate hypothesis column for possible consequences and avoid changing configuration during discovery.

</details>

#### Read, watch or explore next

- **Read:** [Linux manual — inode permissions](https://man7.org/linux/man-pages/man7/inode.7.html) — Read ownership and permission fields.
  Public page at review; optional paid services are not assigned.
- **Read:** [Microsoft Learn — Service security and access rights](https://learn.microsoft.com/en-us/windows/win32/services/service-security-and-access-rights) — Read the service access rights and distinguish querying configuration from changing it.
  Public page at review; optional paid services are not assigned.

<a id="lesson-linux-escalation"></a>
### Linux privilege misconfigurations

Lesson ID: `lesson.linux-escalation`

#### Read

Linux privilege boundaries involve users, groups, capabilities, file modes and delegated administration. Sudo rules can grant narrow commands or dangerously broad capabilities depending on arguments and environment. A file being writable is significant only in relation to how a more privileged process uses it. Review configurations in a disposable lab before changing them.

#### Worked example

A maintenance task runs as a privileged user and reads a configuration file writable by an ordinary account. The trust boundary is between the writer and the privileged consumer; remediation may involve ownership, permissions and safer task design.

#### Try it

Explain the risk without running an escalation payload. Propose a least-privilege correction.

<details>
<summary>Reveal the explained answer</summary>

Restrict writes to the appropriate administrator and constrain the task's privileges and inputs. Verify legitimate maintenance still works and inspect related paths for the same weakness.

</details>

#### Read, watch or explore next

- **Read:** [sudoers(5) - Linux manual page](https://man7.org/linux/man-pages/man5/sudoers.5.html) — Read the sudoers rule format, command matching and environment controls. Explain why an apparently narrow command may still be powerful.
  Public page at review; optional paid services are not assigned.

<a id="lesson-windows-escalation"></a>
### Windows service and task permission flaws

Lesson ID: `lesson.windows-escalation`

#### Read

Windows services have an execution identity and access controls over service configuration and related files. Rights to query a service are different from rights to change it. Review effective permissions on the service, executable and writable dependencies together. Do not infer administrator access from a single scanner label.

#### Worked example

A service runs with a privileged identity, but only administrators can change its configuration and binary. This differs materially from a service whose executable is writable by ordinary users. The relevant boundary includes both service and filesystem permissions.

#### Try it

Name the three permission checks needed to assess that service safely.

<details>
<summary>Reveal the explained answer</summary>

Inspect service configuration rights, executable/directory ACLs and the service account's privileges. Document evidence without modifying or restarting a production service.

</details>

#### Read, watch or explore next

- **Read:** [Microsoft Learn — Service security and access rights](https://learn.microsoft.com/en-us/windows/win32/services/service-security-and-access-rights) — Read the service-specific access rights table and the guidance on granting change-configuration rights.
  Public page at review; optional paid services are not assigned.

<a id="lesson-secret-exposure"></a>
### Secrets, credentials and local blast radius

Lesson ID: `lesson.secret-exposure`

#### Read

A secret is a credential or key whose disclosure grants capability. It can leak through source history, logs, build output, configuration or backups. Removing the visible string does not revoke the capability. Response usually needs revocation or rotation, investigation of use and removal from inappropriate locations.

#### Worked example

A fictional API key was committed yesterday and deleted today. Earlier commits still contain it, and copies may exist elsewhere. Replacing the credential and reviewing its use addresses risks that deleting the current file does not.

#### Try it

Write the response sequence for a deliberately fake leaked key in a training repository.

<details>
<summary>Reveal the explained answer</summary>

Identify scope, revoke/rotate the affected credential through its owner, review use, remove exposed copies appropriately and prevent recurrence. Never test a discovered real credential to see whether it works.

</details>

#### Read, watch or explore next

- **Read:** [OWASP — Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) — Read Incident Response and Secret Lifecycle Management. Distinguish rotation from deletion of a file.
  Public page at review; optional paid services are not assigned.

<a id="lesson-privilege-remediation"></a>
### Escalation report and regression checks

Lesson ID: `lesson.privilege-remediation`

#### Read

A privilege fix should remove the unnecessary capability while preserving intended work. Document the original condition, proposed change, dependencies, rollback and verification. Retest the precise failure and legitimate use. Ownership and permissions can drift, so define an ongoing check where appropriate.

#### Worked example

A service configuration is changed from broadly writable to administrator-only. The service starts successfully and ordinary users can no longer edit the file. Both observations are needed to show a useful correction.

#### Try it

Write positive and negative tests for that change.

<details>
<summary>Reveal the explained answer</summary>

Positive: the authorised maintenance process still updates and runs correctly. Negative: an ordinary test account cannot change the protected configuration. Record the effective rights after deployment.

</details>

#### Read, watch or explore next

- **Read:** [OWASP — Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) — Read least privilege and permission validation.
  Public page at review; optional paid services are not assigned.
- **Read:** [Linux manual — inode permissions](https://man7.org/linux/man-pages/man7/inode.7.html) — Use the permission definitions to explain the intended final state.
  Public page at review; optional paid services are not assigned.

<a id="module-detection-siem"></a>
## SIEM, detection engineering and analyst practice

<a id="lesson-siem-ingestion"></a>
### Ingestion, schemas and time normalisation

Lesson ID: `lesson.siem-ingestion`

#### Read

A SIEM can search and correlate collected events, but collection quality comes first. Preserve raw events, parse fields consistently, normalise time and monitor ingestion delay or loss. A dashboard showing no events may indicate a collection failure rather than a quiet system. Define expected sources and volumes.

#### Worked example

One collector parses local time as UTC, shifting events by an hour. A correlation rule then misses a sequence that actually occurred close together. Validate timestamps against a known event before tuning the rule.

#### Try it

Specify checks for a new synthetic authentication-log feed.

<details>
<summary>Reveal the explained answer</summary>

Verify event count, required fields, time zone, parsing errors, duplicates and delivery delay. Generate a known test event and trace it from source to query result.

</details>

#### Read, watch or explore next

- **Read:** [OWASP — Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) — Read Verification and Event Collection. Design a small ingestion acceptance checklist.
  Public page at review; optional paid services are not assigned.

<a id="lesson-siem-querying"></a>
### Search, aggregation and correlation

Lesson ID: `lesson.siem-querying`

#### Read

A query should answer a defined question over a defined interval and population. Filters, grouping and joins can change the unit of analysis. Test queries against a tiny dataset whose answer you can calculate manually. Preserve the raw records behind an aggregate so surprising results can be investigated.

#### Worked example

Joining five login events to two duplicate inventory rows produces ten output rows. Counting those rows overstates logins. The correct fix starts with understanding join cardinality, not dividing every result by two.

#### Try it

Describe a query for unique users with more than three failed events in ten minutes. State your deduplication assumption.

<details>
<summary>Reveal the explained answer</summary>

Filter the interval and failure outcome, deduplicate on a justified event identity, group by user and count events. Distinguish unique users from total failed attempts.

</details>

#### Read, watch or explore next

- **Read:** [PostgreSQL tutorial — Querying a table](https://www.postgresql.org/docs/current/tutorial-select.html) — Read SELECT filtering and expressions; adapt the reasoning to your lab query language.
  Public page at review; optional paid services are not assigned.
- **Read:** [Microsoft Learn — Get-WinEvent](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.diagnostics/get-winevent) — Compare source-side filtering with filtering already collected results.
  Public page at review; optional paid services are not assigned.

<a id="lesson-detection-logic"></a>
### Detection hypotheses and Sigma-style rules

Lesson ID: `lesson.detection-logic`

#### Read

A detection rule expresses observable conditions linked to a threat hypothesis. Specify required telemetry, filters, time windows, thresholds, exclusions and the response question. Behavioural context usually makes a rule more useful than matching a single tool name. Version and document the rule so changes are reviewable.

#### Worked example

'Five failed logins then a success for the same account in ten minutes' is more specific than 'a failed login occurred'. It still needs testing against ordinary password mistakes and ingestion duplicates.

#### Try it

Write that rule in plain language and list two benign scenarios.

<details>
<summary>Reveal the explained answer</summary>

Include same-account grouping and event order. Benign cases can include a user correcting a forgotten password or duplicated logs. These require evaluation, not blanket exclusions that hide genuine abuse.

</details>

#### Read, watch or explore next

- **Read:** [Sigma — Rule basics](https://sigmahq.io/docs/basics/rules.html) — Read rule structure, logsource, detection and falsepositives. Translate a small rule into plain English.
  Public page at review; optional paid services are not assigned.

<a id="lesson-detection-evaluation"></a>
### Evaluate precision, recall and base rates

Lesson ID: `lesson.detection-evaluation`

#### Read

Precision is the proportion of alerts that are true positives. Recall is the proportion of relevant incidents detected. A rule can improve one while worsening the other. Evaluation needs labelled cases, representative benign activity and a clear definition of the event being detected. Accuracy can be misleading when harmful events are rare.

#### Worked example

A rule raises ten alerts, of which two are true incidents: precision is 2/10, or 20%. If there were four relevant incidents overall, recall is 2/4, or 50%. These answer different operational questions.

#### Try it

Compute precision and recall for 6 true alerts, 4 false alerts and 3 missed incidents.

<details>
<summary>Reveal the explained answer</summary>

Precision is 6/10 = 60%; recall is 6/9, about 67%. Explain the cost of false alerts and missed incidents before choosing a threshold.

</details>

#### Read, watch or explore next

- **Read:** [Google Machine Learning — Accuracy, precision and recall](https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall) — Read Precision, Recall and the precision-recall tradeoff. Recalculate the worked examples yourself.
  Public page at review; optional paid services are not assigned.

<a id="lesson-analyst-investigation"></a>
### Triage a correlated alert and write a playbook

Lesson ID: `lesson.analyst-investigation`

#### Read

Investigation develops and tests explanations over a bounded evidence set. Build a timeline, correlate identities and assets, identify gaps and actively seek evidence that could disprove the leading hypothesis. Keep the distinction between not observed and ruled out. Each query should have a reason.

#### Worked example

A suspicious login is followed by a role change. Matching account names alone is insufficient if the records refer to different tenants or clocks. Correlate stable identifiers, time and environment before joining the events into a story.

#### Try it

Write three investigation questions, each paired with a data source and possible disconfirming result.

<details>
<summary>Reveal the explained answer</summary>

Useful questions concern identity, action and impact. A verified approved role change can contradict one hypothesis while leaving the login unexplained. Update confidence instead of forcing every event into one narrative.

</details>

#### Read, watch or explore next

- **Read:** [MITRE ATT&CK — Valid Accounts](https://attack.mitre.org/techniques/T1078/) — Read Valid Accounts detection context.
  Public page at review; optional paid services are not assigned.
- **Read:** [OWASP — Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) — Review event attributes needed for reliable correlation.
  Public page at review; optional paid services are not assigned.

<a id="lesson-detection-lifecycle"></a>
### Detection change control and operational metrics

Lesson ID: `lesson.detection-lifecycle`

#### Read

Detections require ownership, testing, deployment, monitoring, tuning and retirement. Changes to software or log schemas can silently break a previously useful rule. Keep test fixtures and change history, and monitor whether required telemetry still arrives. A quiet rule is not necessarily a successful rule.

#### Worked example

An application renames `user_id` to `principal_id`. The rule still loads but matches nothing. A fixture that represents the new event schema and an ingestion health check expose the problem.

#### Try it

Define a release checklist for a revised rule.

<details>
<summary>Reveal the explained answer</summary>

Include schema compatibility, positive and negative fixtures, expected alert volume, owner, response playbook, staged rollout and rollback. Review results after deployment.

</details>

#### Read, watch or explore next

- **Read:** [Sigma — Rule basics](https://sigmahq.io/docs/basics/rules.html) — Read rule metadata and detection fields; identify what should change when a rule is revised.
  Public page at review; optional paid services are not assigned.

<a id="module-incident-response"></a>
## Incident response and threat hunting

<a id="lesson-response-preparation"></a>
### Preparation, roles and evidence preservation

Lesson ID: `lesson.response-preparation`

#### Read

Preparation establishes authority, contacts, evidence handling, communications and recovery options before an incident. Playbooks should guide decisions rather than assume every event follows an identical script. Tabletop exercises reveal missing responsibilities and dependencies without disrupting real services.

#### Worked example

A simulated identity-provider outage exposes that responders' emergency contact list is available only behind that provider. Maintaining an appropriately protected alternative access route becomes a concrete improvement.

#### Try it

Design a 20-minute tabletop with a trigger, three decision questions and an observable outcome.

<details>
<summary>Reveal the explained answer</summary>

Ask who declares the incident, who can authorise containment and how essential communication continues. Record gaps, owners and follow-up dates rather than only attendance.

</details>

#### Read, watch or explore next

- **Read:** [NIST SP 800-61 Rev. 3 — Incident response recommendations](https://csrc.nist.gov/pubs/sp/800/61/r3/final) — Read preparation-related recommendations and organisational responsibilities.
  Public page at review; optional paid services are not assigned.
- **Watch / listen:** [Incident Response - CompTIA Security+ SY0-701 - 4.8 - Professor Messer IT Certification Training Courses](https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/incident-response-sy0-701/) — Watch Incident Response and list decisions that require prior authority.
  Public page at review; optional paid services are not assigned.

<a id="lesson-incident-scoping"></a>
### Scope an incident and build a defensible timeline

Lesson ID: `lesson.incident-scoping`

#### Read

Scoping asks which identities, hosts, data and time periods may be affected. Begin with confirmed evidence, then expand through justified relationships. Record collection gaps and the confidence of exclusions. An indicator search finds matches to that indicator; it cannot rule out every other form of compromise.

#### Worked example

One account has suspicious activity on two hosts. Investigators review its other sessions and access history. A third host with no retained logs cannot honestly be labelled unaffected solely because no events were found.

#### Try it

Divide a fictional scope table into confirmed, suspected, excluded with evidence and unknown.

<details>
<summary>Reveal the explained answer</summary>

Use explicit evidence for each category. Missing telemetry belongs under unknown, with a collection or mitigation action, rather than under clean.

</details>

#### Read, watch or explore next

- **Read:** [NIST SP 800-61 Rev. 3 — Incident response recommendations](https://csrc.nist.gov/pubs/sp/800/61/r3/final) — Read detection and analysis recommendations; identify how scope and confidence inform response priorities.
  Public page at review; optional paid services are not assigned.

<a id="lesson-threat-hunting"></a>
### Hypothesis-driven hunting and intelligence use

Lesson ID: `lesson.threat-hunting`

#### Read

A hunt starts with a testable hypothesis about behaviour that existing alerts may miss. Define the environment, available telemetry, query method and stopping criteria. A hunt producing no findings can still reveal visibility gaps; it does not establish universal absence. Preserve queries and feedback for future detection.

#### Worked example

Hypothesis: a service account is being used interactively outside its normal systems. Search appropriate authentication events and compare against its documented purpose. A missing logon-type field limits what the data can establish.

#### Try it

Write a hypothesis, required fields and a benign explanation for this hunt.

<details>
<summary>Reveal the explained answer</summary>

Required context includes account, logon type, source, destination and time. A documented maintenance action may explain a match. Report coverage and missing fields with the result.

</details>

#### Read, watch or explore next

- **Read:** [MITRE ATT&CK — Valid Accounts](https://attack.mitre.org/techniques/T1078/) — Read the Valid Accounts description and detection ideas; convert one into a falsifiable hunt hypothesis.
  Public page at review; optional paid services are not assigned.

<a id="lesson-containment-recovery"></a>
### Containment, eradication and verified recovery

Lesson ID: `lesson.containment-recovery`

#### Read

Containment limits ongoing harm; eradication addresses the cause; recovery restores trusted operation. Actions can affect evidence and business services, so coordinate and record them. Restoring a backup without removing the initial access path can recreate the problem. Validate recovery and monitor for recurrence.

#### Worked example

A compromised test account is disabled, its sessions revoked and exposed credentials replaced. The team also fixes the permission weakness that enabled access and verifies normal authorised use before declaring recovery.

#### Try it

Separate immediate containment, root-cause correction and recovery checks for that scenario.

<details>
<summary>Reveal the explained answer</summary>

Session/account restrictions contain access; fixing the weakness and replacing credentials address causes; functional and security checks support recovery. Include evidence preservation and a monitoring period.

</details>

#### Read, watch or explore next

- **Read:** [NIST SP 800-61 Rev. 3 — Incident response recommendations](https://csrc.nist.gov/pubs/sp/800/61/r3/final) — Read Respond and Recover recommendations.
  Public page at review; optional paid services are not assigned.
- **Read:** [Small organisations guide to cyber security | Backing up your data | National Cyber Security Centre](https://www.ncsc.gov.uk/collection/small-organisations-guide-to-cyber-security/backing-up-your-data) — Review restoration and recovery guidance and connect it to root-cause removal.
  Public page at review; optional paid services are not assigned.

<a id="lesson-incident-reporting"></a>
### Incident reports and learning without blame

Lesson ID: `lesson.incident-reporting`

#### Read

An incident report should preserve a timeline, evidence, decisions, impact, uncertainty and corrective actions. Readers need to distinguish confirmed facts from hypotheses that changed during investigation. Avoid blame-focused descriptions that obscure systemic causes. Track improvements through owners and deadlines.

#### Worked example

An early note suspects data theft; later evidence establishes unauthorised access but cannot determine whether files were copied. The final report should preserve that uncertainty rather than silently turning suspicion into fact.

#### Try it

Write a short conclusion using confirmed access, unknown copying and a recommended logging improvement.

<details>
<summary>Reveal the explained answer</summary>

State what the evidence establishes, what retention gaps prevent determining, and how the improvement would help future investigations. Avoid claiming that absence of a download log proves no copying occurred.

</details>

#### Read, watch or explore next

- **Read:** [NIST SP 800-61 Rev. 3 — Incident response recommendations](https://csrc.nist.gov/pubs/sp/800/61/r3/final) — Read communication and improvement recommendations. Draft a lessons-learned action with an owner and verification method.
  Public page at review; optional paid services are not assigned.

<a id="module-digital-forensics"></a>
## Digital forensics and evidence analysis

<a id="lesson-forensic-handling"></a>
### Evidence handling, acquisition and provenance

Lesson ID: `lesson.forensic-handling`

#### Read

Forensic handling preserves evidence provenance and records changes made during collection and analysis. Work on verified copies where possible, document tools and times, and maintain a chain of custody. A hash supports integrity comparison but does not prove the original acquisition was complete or lawful. Collection priorities depend on volatility, ongoing harm and authority.

#### Worked example

An analyst hashes a disk image, stores the original securely and analyses a working copy. Matching later hashes support that the stored image has not changed; the acquisition log still needs to explain which device and method produced it.

#### Try it

List the minimum entries in an evidence-transfer record.

<details>
<summary>Reveal the explained answer</summary>

Record identifier, source, collector, date/time with timezone, method, integrity values where appropriate, storage and each transfer's sender/recipient/purpose. Do not overwrite original evidence with annotations.

</details>

#### Read, watch or explore next

- **Read:** [NIST SP 800-86 — Integrating forensics into incident response](https://csrc.nist.gov/pubs/sp/800/86/final) — Read the collection, examination, analysis and reporting process.
  Public page at review; optional paid services are not assigned.
- **Watch / listen:** [Digital Forensics - CompTIA Security+ SY0-701 - 4.8 - Professor Messer IT Certification Training Courses](https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/digital-forensics-sy0-701/) — Watch Digital Forensics and distinguish integrity from provenance.
  Public page at review; optional paid services are not assigned.

<a id="lesson-filesystem-forensics"></a>
### Filesystem structures and recoverable artefacts

Lesson ID: `lesson.filesystem-forensics`

#### Read

A filesystem records content and metadata under rules specific to its format and operating system. Timestamps can represent creation, modification or access with different precision and update behaviour. Deleted content may or may not remain recoverable. Interpret artefacts with their acquisition context and corroboration rather than treating one timestamp as a complete story.

#### Worked example

A file copied to another volume may gain a new creation timestamp while retaining a modification timestamp. That pattern does not alone prove deliberate timestamp manipulation. The copy operation is a competing explanation.

#### Try it

Explain why file creation time and document authorship time can differ.

<details>
<summary>Reveal the explained answer</summary>

The filesystem records operations on that instance of the file, while authorship may precede copying or extraction. Correlate content, metadata and application logs, and document filesystem-specific limits.

</details>

#### Read, watch or explore next

- **Read:** [NIST SP 800-86 — Integrating forensics into incident response](https://csrc.nist.gov/pubs/sp/800/86/final) — Read the data-files section and its discussion of filesystem information and deleted files.
  Public page at review; optional paid services are not assigned.

<a id="lesson-host-artefacts"></a>
### Windows, Linux and browser artefact correlation

Lesson ID: `lesson.host-artefacts`

#### Read

Host artefacts can show execution, user activity, configuration and persistence, but each has collection and interpretation limits. Some indicate presence rather than execution; some records are cleared or disabled. Build conclusions from multiple independent artefacts and the relevant operating-system version.

#### Worked example

A program file exists on disk. This establishes presence, not that a user ran it. A correlated process event can support execution, while its identity and timestamp still need verification.

#### Try it

Write separate conclusions for file presence, recorded process execution and a missing process log.

<details>
<summary>Reveal the explained answer</summary>

Presence and execution are distinct claims. A missing log may reflect disabled collection or retention loss and cannot, by itself, establish that execution never occurred.

</details>

#### Read, watch or explore next

- **Read:** [NIST SP 800-86 — Integrating forensics into incident response](https://csrc.nist.gov/pubs/sp/800/86/final) — Read operating-system and application data sources.
  Public page at review; optional paid services are not assigned.
- **Read:** [Microsoft Learn — Get-WinEvent](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.diagnostics/get-winevent) — Inspect event filtering and metadata needed to interpret a supplied record.
  Public page at review; optional paid services are not assigned.

<a id="lesson-memory-forensics"></a>
### Memory evidence and process relationships

Lesson ID: `lesson.memory-forensics`

#### Read

Memory captures contain volatile state such as processes and connections, but collection changes a running system and captures only a moment. Tool support depends on operating system, symbols and acquisition format. Analyse known training images with documented provenance; do not assume every plugin output is complete or correct.

#### Worked example

A memory tool reports a process with an unusual parent. Correlate command line, creation time and other artefacts before labelling it malicious. Missing symbols or a mismatched image can produce unreliable interpretation.

#### Try it

Record four prerequisites before analysing a supplied memory image.

<details>
<summary>Reveal the explained answer</summary>

Confirm source permission, hash/provenance, OS/build and compatible tool/symbol requirements. Preserve command output and note collection time and limitations.

</details>

#### Read, watch or explore next

- **Read:** [Volatility 3 — Getting started](https://volatility3.readthedocs.io/en/latest/getting-started-linux-tutorial.html) — Follow the Linux tutorial's setup and example workflow with its documented prerequisites; use a supplied training image only.
  Public page at review; optional paid services are not assigned.

<a id="lesson-forensic-reporting"></a>
### Timelines, confidence and forensic reporting

Lesson ID: `lesson.forensic-reporting`

#### Read

A forensic report should allow another examiner to follow the path from evidence to conclusion. Include the question, acquisition details, tools, methods, relevant results, alternative explanations and limitations. Explain technical terms in relation to the question being answered. Maintain uncertainty when evidence cannot distinguish hypotheses.

#### Worked example

Two artefacts support that an application ran, but no available record identifies who physically used the keyboard. The report can establish execution while leaving the human actor unresolved.

#### Try it

Write a conclusion that states both the supported observation and the unresolved attribution.

<details>
<summary>Reveal the explained answer</summary>

Name the supporting artefacts and their timestamps, then state that user-account association does not necessarily identify the person operating it. Specify additional evidence that could help.

</details>

#### Read, watch or explore next

- **Read:** [NIST SP 800-86 — Integrating forensics into incident response](https://csrc.nist.gov/pubs/sp/800/86/final) — Read reporting and recommendations. Check that every conclusion in your mock report points to evidence.
  Public page at review; optional paid services are not assigned.

<a id="module-malware-reversing"></a>
## Malware concepts and introductory reverse engineering

<a id="lesson-malware-analysis-safety"></a>
### Malware categories and analysis boundaries

Lesson ID: `lesson.malware-analysis-safety`

#### Read

Malware analysis can expose the host, network and other people. Begin with benign training binaries and static inspection. Isolation requires understanding network access, sharing, clipboard, storage and recovery; a VM label alone is insufficient. Do not download live malware for this curriculum. Record hashes, provenance and tool versions for harmless samples.

#### Worked example

A training guest shares the host's Documents directory and network. Running an unknown binary there could affect real files or contact external systems. Removing those paths and using a benign educational sample reduces unnecessary exposure.

#### Try it

Create a diagram of an analysis environment and choose a static-only exercise you can perform safely.

<details>
<summary>Reveal the explained answer</summary>

Inspect a self-compiled hello-world binary's metadata and strings. If you cannot explain the environment's boundaries, remain with static benign samples or provider-controlled demonstrations.

</details>

#### Read, watch or explore next

- **Read:** [ghidra/GhidraDocs/GhidraClass/Beginner/Introduction_to_Ghidra_Student_Guide.html at master · NationalSecurityAgency/ghidra · GitHub](https://github.com/NationalSecurityAgency/ghidra/blob/master/GhidraDocs/GhidraClass/Beginner/Introduction_to_Ghidra_Student_Guide.html) — Read the introduction and project/import workflow; use your own harmless binary.
  Public page at review; optional paid services are not assigned.
- **Watch / listen:** [OpenSecurityTraining2 — Architecture 1001: x86-64 Assembly](https://p.ost2.fyi/courses/course-v1:OpenSecurityTraining2+Arch1001_x86-64_Asm+2021_v1/about) — Review course prerequisites before selecting the introductory architecture material.
  Course study may require registration; introductory page is public.

<a id="lesson-c-memory"></a>
### C, memory, pointers and program layout

Lesson ID: `lesson.c-memory`

#### Read

C exposes memory and resource management more directly than many high-level languages. Arrays have bounds, pointers refer to locations and allocated objects have lifetimes. Reading or writing outside valid bounds produces undefined behaviour; a program appearing to work once does not make it valid. Compiler warnings and sanitizers can reveal mistakes in benign examples.

#### Worked example

An array of four elements has valid indices 0 through 3. Accessing index 4 is outside it even if nearby memory happens to be readable. The correct repair is enforcing bounds, not relying on the observed output.

#### Try it

State valid indices for an array of eight items and explain why a freed pointer must not be reused.

<details>
<summary>Reveal the explained answer</summary>

Indices are 0–7. After deallocation, the object no longer has a valid lifetime for access through that pointer; memory may be reused. Design ownership and checks explicitly.

</details>

#### Read, watch or explore next

- **Watch / listen:** [Week 4 Memory - CS50x 2026](https://cs50.harvard.edu/x/2026/weeks/4/) — Watch CS50 Week 4's memory explanation and follow the notes on pointers, allocation and memory errors.
  Public page at review; optional paid services are not assigned.

<a id="lesson-assembly-basics"></a>
### Registers, instructions and calling conventions

Lesson ID: `lesson.assembly-basics`

#### Read

Assembly represents machine instructions for a particular architecture. Registers hold working values; instructions change registers, memory and control flow. Calling conventions describe argument passing and return values. x86-64 examples do not map instruction-for-instruction to an ARM64 Mac, so label the architecture of every sample.

#### Worked example

A comparison followed by a conditional branch implements a decision such as an if statement. Understanding the compared values and branch condition matters more than memorising an opcode name.

#### Try it

Compare a tiny source-level conditional with a compiler's assembly listing for your machine.

<details>
<summary>Reveal the explained answer</summary>

Identify inputs, comparison, branch and returned value. Record architecture and optimisation level; compiler optimisation can change the visible structure substantially.

</details>

#### Read, watch or explore next

- **Watch / listen:** [OpenSecurityTraining2 — Architecture 1001: x86-64 Assembly](https://p.ost2.fyi/courses/course-v1:OpenSecurityTraining2+Arch1001_x86-64_Asm+2021_v1/about) — Start with the architecture/register and instruction introductions. Treat x86-64 as an explicit study target, not your Mac's native instruction set.
  Course study may require registration; introductory page is public.

<a id="lesson-binary-analysis"></a>
### Executable formats and static analysis

Lesson ID: `lesson.binary-analysis`

#### Read

Static analysis examines a binary without running it. File headers, imports, strings and control-flow views offer clues, not automatic verdicts. Decompilers produce approximations of source-level logic and may infer types incorrectly. Correlate views and keep a distinction between what the binary contains and what execution would do.

#### Worked example

A harmless program contains the string 'error'. Its presence does not establish an error occurred. Finding references to that string can show the branch where it would be used.

#### Try it

Import a self-compiled benign program and locate one string plus its reference.

<details>
<summary>Reveal the explained answer</summary>

Record the file format, architecture, string and referencing function. Compare with your source and note differences introduced by compilation or optimisation.

</details>

#### Read, watch or explore next

- **Read:** [ghidra/GhidraDocs/GhidraClass/Beginner/Introduction_to_Ghidra_Student_Guide.html at master · NationalSecurityAgency/ghidra · GitHub](https://github.com/NationalSecurityAgency/ghidra/blob/master/GhidraDocs/GhidraClass/Beginner/Introduction_to_Ghidra_Student_Guide.html) — Read importing, auto-analysis and program-navigation sections of the beginner guide; follow them with a harmless binary.
  Public page at review; optional paid services are not assigned.

<a id="lesson-dynamic-analysis"></a>
### Controlled observation and debugging

Lesson ID: `lesson.dynamic-analysis`

#### Read

Dynamic analysis observes a program during a particular execution. Inputs, privileges, environment and timing influence the path taken. An unobserved behaviour may simply not have been triggered. For this course, use self-written harmless programs and record baseline activity before execution so ordinary system noise is not attributed to the sample.

#### Worked example

A toy program writes a temporary file only when given a particular argument. A run without that argument shows no file write, but cannot prove the program never writes files.

#### Try it

Design two runs of that toy program with controlled inputs and expected observations.

<details>
<summary>Reveal the explained answer</summary>

Record exact arguments, environment, start/end time and created files. Compare against the baseline and source; keep observation separate from claims about all possible paths.

</details>

#### Read, watch or explore next

- **Read:** [ghidra/GhidraDocs/GhidraClass/Beginner/Introduction_to_Ghidra_Student_Guide.html at master · NationalSecurityAgency/ghidra · GitHub](https://github.com/NationalSecurityAgency/ghidra/blob/master/GhidraDocs/GhidraClass/Beginner/Introduction_to_Ghidra_Student_Guide.html) — Use the guide to compare static branch structure with your benign program's observed behaviour.
  Public page at review; optional paid services are not assigned.

<a id="lesson-malware-reporting"></a>
### Behaviour reports and detection ideas

Lesson ID: `lesson.malware-reporting`

#### Read

An analysis report describes the sample, environment, observed behaviour, supporting evidence and limitations. Indicators such as hashes identify particular bytes and may change across builds. Behavioural descriptions can be more general but require sufficient evidence. A rule matching one sample is not a reliable family classifier without broader evaluation.

#### Worked example

A YARA rule matches a distinctive string in a benign training binary. It may also match unrelated files containing that string. Testing a negative corpus reveals false positives that the single positive sample cannot.

#### Try it

Draft a report section with one observed behaviour, one indicator and one limitation.

<details>
<summary>Reveal the explained answer</summary>

Link behaviour to a recorded observation, label the indicator's scope and explain untested paths. Evaluate any rule on positive and negative harmless examples.

</details>

#### Read, watch or explore next

- **Read:** [YARA — Writing rules](https://yara.readthedocs.io/en/stable/writingrules.html) — Read strings, conditions and rule examples. Explain why a distinctive-looking string still needs false-positive testing.
  Public page at review; optional paid services are not assigned.

<a id="module-cloud-security"></a>
## Cloud foundations and practical security

<a id="lesson-cloud-operating-model"></a>
### Cloud services, regions and shared responsibility

Lesson ID: `lesson.cloud-operating-model`

#### Read

Cloud systems are controlled through APIs, identities and policy. Provider-managed infrastructure changes operational work but does not remove customer responsibility for configuration, data and permissions. Inventory accounts, regions, services and owners. A diagram must include management-plane actions as well as application traffic.

#### Worked example

A storage service is reachable only by authorised identities, but an overly powerful automation role can change its access policy. Securing the data path while ignoring the management plane leaves an important route unreviewed.

#### Try it

Draw a user, application role, storage service and administrator. Label data access and configuration changes separately.

<details>
<summary>Reveal the explained answer</summary>

Data-plane requests read or write objects; management-plane actions change service configuration. Each needs appropriate permissions, logging and ownership.

</details>

#### Read, watch or explore next

- **Read:** [AWS — Shared responsibility model](https://aws.amazon.com/compliance/shared-responsibility-model/) — Read the responsibilities associated with the services in your diagram.
  Public page at review; optional paid services are not assigned.

<a id="lesson-cloud-sandbox-costs"></a>
### Accounts, budgets and lab teardown

Lesson ID: `lesson.cloud-sandbox-costs`

#### Read

Cloud exercises can create costs even when nothing appears active. Storage, public addresses, logs and data transfer can remain after compute stops. Budgets are monitoring tools and are not a universal spending cap. Start with paper exercises or local simulations; any paid lab needs explicit resource limits and cleanup verification.

#### Worked example

Stopping a test VM may leave its disk and address allocated. A cleanup checklist that checks only running instances misses those resources. Compare the full inventory with the expected empty baseline.

#### Try it

Write a paper-only lab budget and cleanup checklist without creating resources.

<details>
<summary>Reveal the explained answer</summary>

Include services, regions, maximum duration, alerts, owner and retained resources. Verify actual billing/resource state after cleanup; do not assume a free-tier label guarantees zero cost.

</details>

#### Read, watch or explore next

- **Read:** [AWS Budgets — Managing costs](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html) — Read how budgets and alerts work and their limitations before considering a cloud lab.
  Public page at review; optional paid services are not assigned.

<a id="lesson-cloud-iam"></a>
### Cloud IAM, roles and policy evaluation

Lesson ID: `lesson.cloud-iam`

#### Read

Cloud policies decide which principal may perform which action on which resource under which conditions. Effective permission can involve multiple policy types and explicit denies. Broad wildcard grants are convenient but can create unintended paths. Evaluate the actual request context, not just one policy document.

#### Worked example

A role's allow statement permits reading a bucket, but an applicable explicit deny blocks the request. Seeing an allow in one place is insufficient to predict the final decision.

#### Try it

Annotate a fictional policy with principal, action, resource and condition. Explain one missing constraint.

<details>
<summary>Reveal the explained answer</summary>

Identify each component and constrain the grant to the intended resource and operation. Check all applicable policies and test both allowed and denied requests in a simulator or paper exercise.

</details>

#### Read, watch or explore next

- **Read:** [AWS IAM — Policy evaluation logic](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html) — Read policy evaluation logic and the interaction of explicit denies with allows.
  Public page at review; optional paid services are not assigned.

<a id="lesson-cloud-network-data"></a>
### Cloud networks, storage and encryption controls

Lesson ID: `lesson.cloud-network-data`

#### Read

Cloud data protection combines identity policy, network exposure, encryption and service-specific settings. Private networking does not replace authorisation; encryption does not make public access acceptable. Review inherited and account-level controls as well as resource settings. Use fictional policies before creating any live resource.

#### Worked example

An object store has encryption enabled but allows anonymous reads. The encryption protects storage media while the service legitimately decrypts data for callers it considers authorised. The access policy remains the exposure.

#### Try it

Explain that scenario and propose two independent controls.

<details>
<summary>Reveal the explained answer</summary>

Restrict public access and define least-privilege identity permissions. Add appropriate network restrictions and monitoring as needed; verify access with both permitted and denied identities.

</details>

#### Read, watch or explore next

- **Read:** [Amazon S3 — Blocking public access](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html) — Read how Block Public Access settings apply at account and bucket levels.
  Public page at review; optional paid services are not assigned.

<a id="lesson-cloud-audit-response"></a>
### Cloud audit trails and incident questions

Lesson ID: `lesson.cloud-audit-response`

#### Read

Cloud audit records show API actions with identity and request context, subject to logging configuration and retention. Management events and data events can cover different activities. Confirm what is enabled before concluding that an action did not occur. Preserve account, region and stable resource identifiers.

#### Worked example

A trail records a bucket-policy change but not individual object reads because the relevant data events were not configured. The available record establishes a policy change, not whether anyone downloaded an object afterward.

#### Try it

State what you can and cannot conclude from that evidence.

<details>
<summary>Reveal the explained answer</summary>

Report the actor and policy change supported by the management event. Label object access unknown unless appropriate data-access evidence exists, and recommend proportionate visibility improvements.

</details>

#### Read, watch or explore next

- **Read:** [AWS CloudTrail — Logging management events](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/logging-management-events-with-cloudtrail.html) — Read management-event logging and compare it with the linked data-event guidance.
  Public page at review; optional paid services are not assigned.

<a id="lesson-cloud-iac"></a>
### Infrastructure as code and configuration review

Lesson ID: `lesson.cloud-iac`

#### Read

Infrastructure as code records intended resources in reviewable files. A plan previews proposed changes; applying them changes the environment. State and provider context matter, and a saved plan can become stale. Keep secrets out of source and review destructive changes and cost implications before applying.

#### Worked example

A plan proposes replacing a database rather than updating it in place. That can affect data and availability. The correct next step is investigating the replacement reason and recovery plan, not automatically accepting the output.

#### Try it

Review a fictional plan with one create, one update and one destroy. Name the questions needed before approval.

<details>
<summary>Reveal the explained answer</summary>

Check target account/region, dependencies, data preservation, permissions, cost and rollback. A successful syntax check does not establish that the intended change is safe or correct.

</details>

#### Read, watch or explore next

- **Read:** [HashiCorp — Terraform plan](https://developer.hashicorp.com/terraform/cli/commands/plan) — Read plan purpose, planning modes and options. Explain the difference between preview and apply.
  Public page at review; optional paid services are not assigned.

<a id="lesson-cloud-security-review"></a>
### Cloud security review, restore and teardown

Lesson ID: `lesson.cloud-security-review`

#### Read

A cloud review should connect workload purpose to identity, exposure, data handling, logging, resilience and cost. Use an inventory and an agreed threat model so findings are not just a checklist of product switches. Prioritise by realistic impact and assign actionable owners.

#### Worked example

A test application has private storage but a role capable of granting public access. The review should include both current exposure and who can change it, then propose constraints and monitoring.

#### Try it

Produce a one-page review of a fictional app with three findings and evidence requirements.

<details>
<summary>Reveal the explained answer</summary>

For each finding state the asset, observed condition, impact, recommendation, owner and verification. Mark paper assumptions clearly instead of pretending they are observations from a real account.

</details>

#### Read, watch or explore next

- **Read:** [AWS — Shared responsibility model](https://aws.amazon.com/compliance/shared-responsibility-model/) — Check responsibility allocation.
  Public page at review; optional paid services are not assigned.
- **Read:** [AWS IAM — Policy evaluation logic](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html) — Review effective permissions.
  Public page at review; optional paid services are not assigned.
- **Read:** [Amazon S3 — Blocking public access](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html) — Review public-access controls against your fictional design.
  Public page at review; optional paid services are not assigned.

<a id="module-containers-devsecops"></a>
## Containers, delivery pipelines and DevSecOps

<a id="lesson-container-foundations"></a>
### Images, containers, registries and networks

Lesson ID: `lesson.container-foundations`

#### Read

A container runs processes using an image and runtime configuration, usually sharing the host kernel. Images are templates; containers are instances with writable state. Volumes persist data outside the disposable container layer. Port publication and mounts can expose services or host files, so inspect runtime options as well as the image.

#### Worked example

A container image contains a web server, but a host directory mounted into it grants access to host content not present in the image. Reviewing only the Dockerfile misses that exposure.

#### Try it

Draw image, running container, host kernel, published port and volume.

<details>
<summary>Reveal the explained answer</summary>

Keep build-time contents separate from runtime mounts and permissions. Explain where data survives after the container is removed and what the host exposes to it.

</details>

#### Read, watch or explore next

- **Read:** [Docker — What is a container?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/) — Read the container definition and container-versus-VM explanation.
  Public page at review; optional paid services are not assigned.

<a id="lesson-container-hardening"></a>
### Container runtime and image hardening

Lesson ID: `lesson.container-hardening`

#### Read

Container hardening reduces privileges, writable surfaces and exposed interfaces. Run as an appropriate non-root user where possible, constrain capabilities and mounts, and maintain patched trusted images. Access to the container engine's control interface can be highly privileged. A small image is not automatically a secure image.

#### Worked example

A non-root application container mounts the host's engine socket. That connection may grant powerful host-management capabilities despite the process's user setting. Evaluate the whole runtime configuration.

#### Try it

Identify three risks in a container with a privileged flag, broad host mount and unnecessary published port.

<details>
<summary>Reveal the explained answer</summary>

Each expands capability or reachability. Remove unnecessary privileges, narrow mounts and publish only required interfaces; verify legitimate application behaviour after changes.

</details>

#### Read, watch or explore next

- **Read:** [Docker — Security](https://docs.docker.com/engine/security/) — Read kernel namespaces, control groups and daemon attack surface. Map each to your runtime diagram.
  Public page at review; optional paid services are not assigned.

<a id="lesson-ci-cd-security"></a>
### CI/CD, build identity and protected changes

Lesson ID: `lesson.ci-cd-security`

#### Read

CI/CD systems turn repository events into executable jobs, often with access to credentials and deployment rights. Treat untrusted pull-request content and workflow inputs as potential code execution sources. Restrict token permissions and secret availability, pin dependencies appropriately and separate build from privileged deployment decisions.

#### Worked example

A workflow interpolates a contributor-controlled issue title into a shell command. The title has crossed from data into executable syntax. Pass it through a safe data channel and avoid granting that job unnecessary credentials.

#### Try it

Draw trusted maintainers, external contributors, build job and deployment job. Mark where secrets become available.

<details>
<summary>Reveal the explained answer</summary>

Untrusted code should not automatically execute with deployment authority. Define explicit trust boundaries, minimal permissions and protected promotion steps.

</details>

#### Read, watch or explore next

- **Read:** [GitHub — Secure use of GitHub Actions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions) — Read script-injection risks, least-privilege credentials and third-party action guidance.
  Public page at review; optional paid services are not assigned.

<a id="lesson-software-supply-chain"></a>
### Dependencies, SBOMs and provenance

Lesson ID: `lesson.software-supply-chain`

#### Read

A software supply chain includes source, dependencies, build systems, artefacts and distribution. A package inventory describes components; provenance describes how an artefact was built. A signature supports verification of a key's endorsement but does not prove the code is harmless. Controls must cover each transition.

#### Worked example

A signed release was built on a compromised builder. Signature verification can succeed while the artefact is still malicious. Build isolation, provenance verification and dependency controls address different parts of the risk.

#### Try it

Map source to dependency resolution, build, registry and installation. Name one verification at each transition.

<details>
<summary>Reveal the explained answer</summary>

Examples include reviewed source, constrained dependencies, protected builder, verified provenance and expected artefact digest. Explain what each check establishes and what it cannot.

</details>

#### Read, watch or explore next

- **Read:** [SLSA — Supply chain threats](https://slsa.dev/spec/v1.1/threats-overview) — Read the supply-chain threats overview and map three threats to your build diagram.
  Public page at review; optional paid services are not assigned.

<a id="lesson-kubernetes-basics"></a>
### Kubernetes objects and security boundaries

Lesson ID: `lesson.kubernetes-basics`

#### Read

Kubernetes manages desired workload state through an API and controllers. Pods run containers; services provide network access; roles control API permissions. Namespaces organise resources but do not alone provide complete isolation. Review service accounts, secrets, network policy and host access together.

#### Worked example

Two applications share a cluster but use different namespaces. Without suitable network and permission controls, the namespace separation does not necessarily prevent communication or inappropriate API access.

#### Try it

Draw API server, workload service account, pod and service. Identify an authorisation and a network control.

<details>
<summary>Reveal the explained answer</summary>

RBAC constrains API actions; network policy can constrain supported pod traffic. Their coverage depends on configuration and implementation, so verify actual behaviour.

</details>

#### Read, watch or explore next

- **Read:** [Kubernetes — Security checklist](https://kubernetes.io/docs/concepts/security/security-checklist/) — Read the security checklist sections on authentication, authorisation, network security and workload settings.
  Public page at review; optional paid services are not assigned.

<a id="lesson-devsecops-gates"></a>
### Security gates, exceptions and rollback

Lesson ID: `lesson.devsecops-gates`

#### Read

A security gate makes an explicit release decision based on defined evidence. Scanners, tests and reviews provide signals with limitations. Set criteria, ownership, exceptions and expiry so the gate supports timely remediation rather than producing an unowned backlog. A clean scan does not prove absence of vulnerabilities.

#### Worked example

A dependency scanner finds a flaw in an unused development tool. The team checks applicability and records a time-limited exception with an owner. Silent suppression would remove accountability and future review.

#### Try it

Define a gate for a fictional web app with one blocking condition and one exception process.

<details>
<summary>Reveal the explained answer</summary>

Tie the blocking condition to material risk and reliable evidence. Exceptions need rationale, compensating controls, owner, expiry and re-evaluation when context changes.

</details>

#### Read, watch or explore next

- **Read:** [NIST — Secure Software Development Framework](https://csrc.nist.gov/projects/ssdf) — Open the SSDF publication and read the practices for producing well-secured software and responding to vulnerabilities.
  Public page at review; optional paid services are not assigned.

<a id="module-application-security"></a>
## Secure development and application security engineering

<a id="lesson-security-requirements"></a>
### Security requirements and abuse cases

Lesson ID: `lesson.security-requirements`

#### Read

A security requirement describes observable behaviour under defined conditions. 'Be secure' is not testable. Derive requirements from assets, threats, roles and use cases, then pair each with verification. Include failure behaviour and abuse cases as well as normal operation.

#### Worked example

'A reader cannot edit another user's private note through any endpoint' names identity, action and boundary. It can be checked with positive owner access and negative cross-user tests.

#### Try it

Write three requirements for account recovery with a verification idea for each.

<details>
<summary>Reveal the explained answer</summary>

Cover appropriate token lifetime/use, protected identity verification and notification or session handling. State expected denial behaviour and test it without real accounts.

</details>

#### Read, watch or explore next

- **Read:** [OWASP — Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/) — Open the standard and inspect authentication, session and access-control requirements; select two relevant controls.
  Public page at review; optional paid services are not assigned.

<a id="lesson-secure-code-review"></a>
### Code review for trust boundaries and unsafe sinks

Lesson ID: `lesson.secure-code-review`

#### Read

Code review traces untrusted inputs to sensitive operations and asks whether the relevant boundary is enforced. Check authentication context, object ownership, query construction, output handling and error paths. Read enough surrounding code to understand assumptions. A dangerous-looking function may be safe in context, while ordinary code can implement a flawed rule.

#### Worked example

A handler parameterises SQL but selects records by requested ID without checking ownership. Injection protection is present; object authorisation is missing. Reviewing only the database call's syntax would miss the second issue.

#### Try it

Annotate a toy handler's input, authenticated identity, object lookup and permission check.

<details>
<summary>Reveal the explained answer</summary>

Confirm authorisation is enforced before returning or modifying the object, including alternative endpoints and error paths. Recommend a focused fix and regression case.

</details>

#### Read, watch or explore next

- **Read:** [OWASP — Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) — Read permission validation and relationship-based access considerations.
  Public page at review; optional paid services are not assigned.
- **Read:** [OWASP — SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html) — Review the boundary between parameterisation and other application controls.
  Public page at review; optional paid services are not assigned.

<a id="lesson-security-regression"></a>
### Security tests, fuzzing concepts and failure handling

Lesson ID: `lesson.security-regression`

#### Read

Regression tests preserve a known security property across changes. Include allowed behaviour and meaningful denial cases, and assert the resulting data/state rather than only that no exception occurred. Fuzzing explores many inputs but needs defined invariants, resource limits and reproducible failures. It complements targeted tests.

#### Worked example

A test verifies user A cannot read B's note and that A can still read A's own note. This catches a missing ownership check and an overbroad fix that denies everyone.

#### Try it

Design a regression test for a single-use reset token.

<details>
<summary>Reveal the explained answer</summary>

Verify first valid use succeeds, reuse fails, expiry is enforced and invalid input does not alter account state. Use isolated synthetic accounts and deterministic time.

</details>

#### Read, watch or explore next

- **Read:** [Python — unittest](https://docs.python.org/3/library/unittest.html) — Read basic unittest assertions and fixtures.
  Public page at review; optional paid services are not assigned.
- **Read:** [LLVM — libFuzzer tutorial and usage](https://llvm.org/docs/LibFuzzer.html) — Read the libFuzzer introduction and target-function requirements; explain what an invariant contributes.
  Public page at review; optional paid services are not assigned.

<a id="lesson-appsec-operations"></a>
### Vulnerability intake, secrets and secure change ownership

Lesson ID: `lesson.appsec-operations`

#### Read

Application security work needs intake, triage, remediation, verification and feedback into development. Findings require owners and useful evidence. Track time to meaningful risk reduction, not just the number of closed tickets. Similar recurring findings may indicate a shared framework or training problem.

#### Worked example

Three teams repeatedly miss object-level checks. Fixing each endpoint matters, but a reusable authorisation helper and default regression pattern may reduce recurrence. The helper itself must be reviewed and adopted correctly.

#### Try it

Draft a finding lifecycle with a definition of done.

<details>
<summary>Reveal the explained answer</summary>

Include applicability review, owner, agreed fix, regression tests, retest evidence and deployment verification. Closure should reflect corrected behaviour, not merely a merged patch.

</details>

#### Read, watch or explore next

- **Read:** [NIST — Secure Software Development Framework](https://csrc.nist.gov/projects/ssdf) — Read responding to vulnerabilities and root-cause analysis practices.
  Public page at review; optional paid services are not assigned.

<a id="lesson-ai-application-security"></a>
### Optional AI application trust boundaries

Lesson ID: `lesson.ai-application-security`

#### Read

AI applications combine model behaviour with ordinary software permissions, retrieval and tools. Untrusted text can contain instructions that try to redirect the model. Keep authority in application policy, validate tool arguments, minimise privileges and treat model output as untrusted data. A system prompt alone cannot enforce every security boundary.

#### Worked example

A retrieved document says to email private files elsewhere. The application should treat that sentence as document content, not as authority to use a sending tool. Tool permissions and destination checks must be enforced outside the model.

#### Try it

Threat-model a document summariser with optional file access. Name assets, untrusted input and two enforceable controls.

<details>
<summary>Reveal the explained answer</summary>

Restrict readable files to the user's authorised scope, separate document content from instructions, validate outputs/tool calls and require appropriate authority for external actions. Test benign adversarial fixtures.

</details>

#### Read, watch or explore next

- **Read:** [OWASP — LLM prompt injection prevention](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) — Read direct/indirect injection, structured separation and least-privilege guidance. Map controls to your application boundary.
  Public page at review; optional paid services are not assigned.

<a id="module-security-architecture"></a>
## Security architecture, assurance and tradeoffs

<a id="lesson-architecture-requirements"></a>
### Business requirements, assets and design constraints

Lesson ID: `lesson.architecture-requirements`

#### Read

Security architecture begins with purpose, assets, users, trust boundaries and constraints. Requirements should express the protection needed while recognising availability, usability, cost and operations. Document assumptions and tradeoffs so later changes can be evaluated. A diagram is useful when it makes decisions and boundaries visible.

#### Worked example

A clinic booking system needs patient privacy and reliable appointment access. An authentication design that repeatedly locks legitimate users out can harm availability even while limiting some guessing attempts. Consider recovery and operational support alongside prevention.

#### Try it

Write three requirements for a fictional booking app and one tradeoff for each.

<details>
<summary>Reveal the explained answer</summary>

Make requirements testable, assign owners and state the assumptions behind choices. Use synthetic data and avoid treating a generic reference architecture as a complete design.

</details>

#### Read, watch or explore next

- **Read:** [OWASP — Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html) — Read system modelling and response/review; connect each proposed control to a specific threat or requirement.
  Public page at review; optional paid services are not assigned.

<a id="lesson-zero-trust-design"></a>
### Identity-centred access and zero-trust principles

Lesson ID: `lesson.zero-trust-design`

#### Read

Zero trust avoids granting implicit trust solely because a request comes from an internal network. Decisions use identity, device/workload context, resource and policy, with appropriately limited access. It is an architectural approach, not a product or a demand to retype a password for every packet. Consider policy availability and emergency operations too.

#### Worked example

A worker on the office network still needs permission to access payroll. Network location can contribute context but should not alone grant access to every internal service.

#### Try it

Draw a request to a sensitive resource and label the policy decision, enforcement and evidence inputs.

<details>
<summary>Reveal the explained answer</summary>

Identify who/what requests which action, applicable policy and the component enforcing it. Define behaviour when context is missing or the policy service is unavailable.

</details>

#### Read, watch or explore next

- **Read:** [NIST SP 800-207 — Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final) — Read the tenets and logical components in SP 800-207; map them to your example.
  Public page at review; optional paid services are not assigned.

<a id="lesson-resilient-architecture"></a>
### Resilience, segmentation and data protection

Lesson ID: `lesson.resilient-architecture`

#### Read

Resilience means maintaining or restoring essential outcomes despite failures and attacks. Redundancy, isolation, backups and tested recovery address different failure modes. Shared dependencies can defeat apparent redundancy. Define recovery objectives and exercise realistic failures rather than assuming multiple copies guarantee continuity.

#### Worked example

Two application servers depend on one identity service and one database. Losing either shared dependency can disable both servers. The architecture must consider those common failure points.

#### Try it

Draw a dependency map and choose one failure to simulate on paper.

<details>
<summary>Reveal the explained answer</summary>

Trace consequences through shared services, identify a recovery route and measure against explicit recovery objectives. Include communications and operational access, not just compute capacity.

</details>

#### Read, watch or explore next

- **Read:** [Small organisations guide to cyber security | Backing up your data | National Cyber Security Centre](https://www.ncsc.gov.uk/collection/small-organisations-guide-to-cyber-security/backing-up-your-data) — Read recovery recommendations and identify dependencies required to restore the fictional service.
  Public page at review; optional paid services are not assigned.

<a id="lesson-control-assurance"></a>
### Control evidence, reviews and supplier boundaries

Lesson ID: `lesson.control-assurance`

#### Read

Assurance asks whether a control is designed appropriately, implemented and operating over time. A policy document proves intent; configuration evidence supports implementation; observed tests support effectiveness within their scope. Define evidence freshness, population and sampling limits. Avoid treating one passing screenshot as perpetual assurance.

#### Worked example

A backup policy requires daily copies. A configuration screenshot shows scheduling, but a restore exercise tests usability. Monitoring subsequent failures is needed to support continued operation.

#### Try it

Define evidence for design, implementation and operation of an access-review control.

<details>
<summary>Reveal the explained answer</summary>

Use documented criteria/owner, actual configured access and records of completed reviews with resolved exceptions. State the period and accounts covered.

</details>

#### Read, watch or explore next

- **Read:** [NIST Cybersecurity Framework 2.0](https://www.nist.gov/cyberframework) — Use the CSF Core outcomes to frame a control objective and identify evidence that would support it.
  Public page at review; optional paid services are not assigned.

<a id="lesson-architecture-review"></a>
### Architecture decisions and design review

Lesson ID: `lesson.architecture-review`

#### Read

An architecture review checks whether design choices meet requirements and address realistic threats. Present the diagram, assumptions, decisions, residual risks and unresolved questions together. Record why alternatives were accepted or rejected. Review again when data flows, dependencies or trust boundaries change.

#### Worked example

A new analytics integration copies customer data to an external service. Even if the existing application is unchanged, the new recipient and data flow require renewed decisions about access, retention and failure handling.

#### Try it

Write an architecture decision record for a fictional analytics integration.

<details>
<summary>Reveal the explained answer</summary>

State context, options, decision, rationale, consequences and verification. Identify who accepts remaining risks and which changes would trigger reconsideration.

</details>

#### Read, watch or explore next

- **Read:** [OWASP — Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html) — Read review and validation guidance; use it to challenge one assumption in your decision record.
  Public page at review; optional paid services are not assigned.

<a id="module-advanced-offensive"></a>
## Advanced offensive analysis and controlled adversary simulation

<a id="lesson-advanced-web-logic"></a>
### Advanced authentication and multi-step web flaws

Lesson ID: `lesson.advanced-web-logic`

#### Read

Advanced web flaws often emerge from interactions among otherwise reasonable components. Model state, trust and permissions across the complete workflow. Tokens need purpose-specific validation; a successful signature check alone does not establish intended audience, lifetime or authorisation. Use provider labs with explicit scope.

#### Worked example

An application accepts a signed token created for a different service. The cryptography can be intact while the trust decision is wrong. Validate the token's intended context and the requested action.

#### Try it

Write acceptance conditions for a fictional API token and one negative test per condition.

<details>
<summary>Reveal the explained answer</summary>

Include approved algorithms/keys, issuer, audience, expiry and applicable permissions. Reject unsuitable context even when the token's signature is valid.

</details>

#### Read, watch or explore next

- **Read:** [PortSwigger — JWT attacks](https://portswigger.net/web-security/jwt) — Read JWT vulnerabilities and prevention guidance; choose an Academy lab only after understanding its intended validation failure.
  Public page at review; optional paid services are not assigned.

<a id="lesson-protocol-race-analysis"></a>
### Request ambiguity, race conditions and cache boundaries

Lesson ID: `lesson.protocol-race-analysis`

#### Read

A race condition occurs when correctness depends on timing between operations. A check and later update can both look valid individually while failing together. Define the invariant and identify the atomic operation or concurrency control needed. Test timing flaws only in assigned labs, with bounded concurrency.

#### Worked example

A coupon should be usable once. Two requests both read 'unused' before either writes 'used', allowing two discounts. A reliable fix makes checking and consuming the coupon one protected state transition.

#### Try it

Draw the two interleaved requests and explain why simply hiding the button is insufficient.

<details>
<summary>Reveal the explained answer</summary>

The server must preserve the invariant under concurrent requests, using an appropriate transaction or atomic operation. Client behaviour cannot enforce a server-side concurrency property.

</details>

#### Read, watch or explore next

- **Read:** [PortSwigger — Race conditions](https://portswigger.net/web-security/race-conditions) — Read the introduction and limit-overrun race conditions; reproduce only the provider's assigned lab scenario.
  Public page at review; optional paid services are not assigned.

<a id="lesson-lab-pivoting"></a>
### Network reachability and pivoting in an isolated range

Lesson ID: `lesson.lab-pivoting`

#### Read

Pivoting uses an intermediate system to reach another network location. In a lab, understand routes, listeners, authentication and scope before creating a path. A permitted first target does not automatically authorise everything it can reach. Prefer diagrams and bounded provider exercises over open-ended exploration.

#### Worked example

A training host connects two isolated lab segments. A forwarding rule might expose a service more broadly than intended if it binds to all interfaces. Bind narrowly and document the exact source, destination and lifetime.

#### Try it

Draw a two-segment lab and mark which hosts and services are explicitly authorised.

<details>
<summary>Reveal the explained answer</summary>

Include route direction, permitted endpoints, authentication and cleanup. Stop at an unexpected destination rather than extending scope based on reachability.

</details>

#### Read, watch or explore next

- **Read:** [OpenBSD — ssh manual](https://man.openbsd.org/ssh) — Read TCP forwarding options and binding behaviour as a design exercise; do not open a tunnel until the lab scope and endpoints are clear.
  Public page at review; optional paid services are not assigned.

<a id="lesson-ad-attack-path-validation"></a>
### Advanced AD path validation and mitigation

Lesson ID: `lesson.ad-attack-path-validation`

#### Read

An Active Directory attack path is a hypothesis about a sequence of rights and relationships. Validate each edge, relevant group membership and actual configuration. Stale inventory can create apparent paths that no longer exist. Use disposable or provider-managed directory labs and avoid collecting real credentials.

#### Worked example

A graph suggests account A can modify group B, which grants access to resource C. If the effective ACL denies that modification or the resource no longer trusts B, the proposed path fails.

#### Try it

Create a three-edge fictional path and list evidence needed for each edge.

<details>
<summary>Reveal the explained answer</summary>

Require effective permissions, current membership and resource access rules. Mark unverified edges and propose remediation at the least disruptive point that breaks the path.

</details>

#### Read, watch or explore next

- **Read:** [Microsoft Learn — Best practices for securing Active Directory](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/security-best-practices/best-practices-for-securing-active-directory) — Read privileged-access protection guidance and apply it to one fictional relationship chain.
  Public page at review; optional paid services are not assigned.

<a id="lesson-exploit-reliability"></a>
### Optional binary vulnerability and exploit-reliability concepts

Lesson ID: `lesson.exploit-reliability`

#### Read

Reliability means an observed failure reproduces under documented conditions, not that it succeeds once. Record versions, configuration, inputs, timing and the success criterion. Crashes can have many causes, and a crash alone does not prove code execution or a particular impact. Use benign toy programs and controlled training environments.

#### Worked example

A malformed input crashes a toy parser on one build but not another. Minimising the input and recording compiler options helps identify the actual condition. Repeating an uncontrolled crash provides less understanding.

#### Try it

Define a reproducibility record for a harmless parser failure.

<details>
<summary>Reveal the explained answer</summary>

Include source/build identifier, environment, minimal input, exact invocation, expected/actual result and repetition limits. State only demonstrated impact and verify the corrected build with regression input.

</details>

#### Read, watch or explore next

- **Read:** [LLVM — libFuzzer tutorial and usage](https://llvm.org/docs/LibFuzzer.html) — Read reproducing/minimising failures and corpus guidance; work only with your own benign parser.
  Public page at review; optional paid services are not assigned.

<a id="lesson-purple-team-campaign"></a>
### Scoped adversary simulation and professional synthesis

Lesson ID: `lesson.purple-team-campaign`

#### Read

A purple-team exercise connects agreed simulated behaviour to prevention, visibility, detection and response. Start with measurable objectives and bounded techniques, coordinate operational impact and stop conditions, then compare expected with observed outcomes. Tool execution alone is not a successful exercise.

#### Worked example

A team simulates an unusual login with synthetic accounts. The useful outcome is whether telemetry arrived, the rule alerted, the analyst understood it and the response followed the plan. Each failed stage suggests a different improvement.

#### Try it

Design one exercise with a hypothesis, scope, telemetry requirement, success criteria and cleanup.

<details>
<summary>Reveal the explained answer</summary>

Measure the whole chain and record timing and gaps. Assign owners to improvements and retest them. Use supplied benign events if live simulation would exceed your resources or permission.

</details>

#### Read, watch or explore next

- **Read:** [MITRE Caldera — Getting started](https://caldera.readthedocs.io/en/latest/Getting-started.html) — Read getting started and the architecture before deciding whether a controlled lab is appropriate.
  Public page at review; optional paid services are not assigned.
- **Read:** [Sigma — Rule basics](https://sigmahq.io/docs/basics/rules.html) — Use rule structure to state the expected observable detection.
  Public page at review; optional paid services are not assigned.
