export const GLOSSARY = {
  mvdb: {
    term: 'MVDB',
    definition: 'Microsoft Vulnerable Driver Blocklist. Windows refuses to load drivers on this list when HVCI or Smart App Control is on.',
  },
  'mvdb-passed': {
    term: 'MVDB passed',
    definition: 'This exact hash is not on the Microsoft Vulnerable Driver Blocklist, so Windows will still load it. The highest-risk case for defenders.',
  },
  'mvdb-blocked': {
    term: 'MVDB blocked',
    definition: 'This hash is on the Microsoft Vulnerable Driver Blocklist and is refused when HVCI or Smart App Control is enabled.',
  },
  'mvdb-unchecked': {
    term: 'MVDB pending',
    definition: 'This sample has not been checked against the Microsoft blocklist yet. The pipeline re-runs the check after every catalog update.',
  },
  hvci: {
    term: 'HVCI',
    definition: 'Hypervisor-protected Code Integrity (Memory Integrity). Uses virtualization to enforce kernel code signing and the driver blocklist.',
  },
  byovd: {
    term: 'BYOVD',
    definition: 'Bring Your Own Vulnerable Driver: an attacker installs a legitimately signed but flawed driver to gain kernel access.',
  },
  'process-killer': {
    term: 'Process killer',
    definition: 'Imports ZwTerminateProcess, so it can kill protected processes such as EDR and antivirus agents from the kernel.',
  },
  'featured-killer': {
    term: 'Featured killer',
    definition: 'A process-killer driver highlighted by the maintainers because it is actively used to disable security tools.',
  },
  'memory-manipulator': {
    term: 'Memory manipulation',
    definition: 'Imports APIs that map, allocate or reprotect memory. Often the primitive behind arbitrary kernel read and write.',
  },
  'debug-bypass': {
    term: 'Debug bypass',
    definition: 'Imports APIs that change process or thread information or query debugger state, used to hide from or disable debugging.',
  },
  'registry-manipulator': {
    term: 'Registry access',
    definition: 'Imports kernel registry APIs, which can be abused for persistence or to tamper with security configuration.',
  },
  'file-manipulator': {
    term: 'File system access',
    definition: 'Imports kernel file APIs, which can read, write or delete files while bypassing user-mode protections.',
  },
  'cert-valid': {
    term: 'Valid certificate',
    definition: 'At least one code-signing certificate in the signature is still within its validity period.',
  },
  'cert-expired': {
    term: 'Expired certificate',
    definition: 'Every signing certificate has expired. Windows can still load the driver if it was timestamped while the certificate was valid.',
  },
  'cert-missing': {
    term: 'No signature data',
    definition: 'The catalog has no certificate details for this sample. It does not necessarily mean the file is unsigned.',
  },
  sha256: { term: 'SHA256', definition: 'SHA-256 hash of the whole file. The most reliable identifier for blocking and threat-intel lookups.' },
  sha1: { term: 'SHA1', definition: 'SHA-1 hash of the whole file. Still used by some blocklists and older tooling.' },
  md5: { term: 'MD5', definition: 'MD5 hash of the whole file. Fast to compute, but collision-prone: prefer SHA256 for decisions.' },
  authentihash: {
    term: 'Authentihash',
    definition: 'Hash of the PE image that skips the signature and checksum. Stays the same when a driver is re-signed, which is what WDAC rules match.',
  },
  imphash: {
    term: 'Imphash',
    definition: 'Hash of the import table. Samples built from the same code tend to share it, which helps cluster variants.',
  },
  imports: {
    term: 'Imported functions',
    definition: 'Kernel APIs the driver links against. They reveal what the driver is able to do once loaded.',
  },
  x64: { term: 'x64', definition: 'Built for 64-bit Intel and AMD processors (AMD64).' },
  x86: { term: 'x86', definition: 'Built for 32-bit Intel processors (I386). Cannot load on 64-bit Windows.' },
  arm64: { term: 'ARM64', definition: 'Built for 64-bit ARM processors, such as Windows on Snapdragon devices.' },
  virustotal: {
    term: 'VirusTotal score',
    definition: 'Engines that flag this exact file as malicious or suspicious, out of those that analysed it. Refreshed daily within the API quota.',
  },
  'vt-none': { term: 'No detections', definition: 'No antivirus engine flags this file. Common for signed vulnerable drivers, which is what makes them useful to attackers.' },
  'vt-low': { term: '1 to 5 detections', definition: 'A handful of engines flag the file, often by generic or heuristic signatures.' },
  'vt-medium': { term: '6 to 20 detections', definition: 'A clear minority of engines flag the file as malicious or suspicious.' },
  'vt-high': { term: 'More than 20 detections', definition: 'Widely flagged by antivirus engines. Typical of malicious drivers and well-known BYOVD tools.' },
  'vt-unscanned': { term: 'Not scanned yet', definition: 'No VirusTotal result yet. The daily job scans new samples first, within the free API quota.' },
  mitre: {
    term: 'MITRE ATT&CK',
    definition: 'The ATT&CK technique this abuse maps to, for example T1068 Exploitation for Privilege Escalation.',
  },
  ioctl: {
    term: 'IOCTL',
    definition: 'I/O control code sent from user mode to a driver. Vulnerable drivers expose IOCTLs that perform privileged actions.',
  },
} as const;

export type GlossaryKey = keyof typeof GLOSSARY;

const ARCH_KEYS: Record<string, GlossaryKey> = { x64: 'x64', x86: 'x86', ARM64: 'arm64' };

export function archGlossaryKey(label: string | null): GlossaryKey | undefined {
  return label ? ARCH_KEYS[label] : undefined;
}

export function hashGlossaryKey(label: string, kind: 'file' | 'authentihash'): GlossaryKey {
  if (kind === 'authentihash') return 'authentihash';
  return label.toLowerCase() as GlossaryKey;
}
