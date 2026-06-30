# About this database

A research-focused interface for the LOLDrivers dataset. It goes beyond a plain catalogue: behavioral analysis, advanced filtering, and live verification against Microsoft's Vulnerable Driver Blocklist for the Windows drivers abused in real-world attacks.

**Built for:** security researchers, threat hunters, malware analysts, and system administrators.

---

## What it does

- **Behavioral analysis** - Each driver's imported functions are inspected to surface capabilities: process killing, memory manipulation, debug bypass, registry access, and file-system access.
- **Blocklist verification** - Compatibility is checked daily against Microsoft's live Vulnerable Driver Blocklist (MVDB), rather than a static bundled list.
- **Search & filtering** - Find drivers by name, hash, company, description, blocklist status, architecture, or behavior - and combine those filters freely.
- **Certificate insight** - Code-signing certificate status is surfaced on each card to help judge legitimacy.
- **Architecture awareness** - Filter and identify drivers by x64, x32, or arm64.

## How it works

- **Live data pipeline** - Continuously synced with the upstream LOLDrivers project for current threat intelligence.
- **Server-side search** - Filtering and search run on the server, so large queries stay fast.
- **Shareable state** - Your search and filters live in the URL; copy the link to share or bookmark an exact view.
- **Responsive** - Works on desktop and smaller screens alike.

## Key terms

- **MVDB** - Microsoft's Vulnerable Driver Blocklist: the driver hashes Windows blocks when Hypervisor-protected Code Integrity (HVCI) is enabled. "MVDB passed" means a driver is *not* on that list.
- **BYOVD** - "Bring Your Own Vulnerable Driver": loading a legitimately signed but vulnerable driver to gain kernel access and disable defenses.
- **Process killer** - A driver that can be abused to terminate protected processes, often security software.
- **Authentihash** - A code-level hash that ignores the signature, so it stays stable when a file is re-signed. See the dedicated help from any hash row.
- **Behavioral capabilities** - The tags on each card, derived from the kernel functions a driver imports.

## Legal & ethical notice

This database exists for legitimate security research and defensive work only. Your use must comply with applicable laws, organizational policy, and ethical standards. Misuse for malicious purposes is prohibited.

## Disclaimer

Provided "as is", without warranty. Maintainers are not responsible for the accuracy, completeness, or fitness of the data. You assume all risk when using this database and the information it contains.
