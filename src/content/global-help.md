# About LOLDrivers Database

A driver security research platform that goes beyond cataloging: advanced filtering, behavioral analysis, and Microsoft Vulnerable Drivers Blocklist compatibility verification for Windows drivers used in real-world attacks.

**Audience:** Security researchers, threat hunters, malware analysts, and system administrators.

---

## Project Vision

- Address gaps in existing driver analysis tools with a comprehensive, research-focused platform.
- Enable efficient identification, analysis, and defense against driver-based attacks through search and filtering that existing solutions do not offer.

## Features

- **Behavioral analysis** — Imported functions are analyzed to detect capabilities such as memory manipulation, process killing, debug bypass, registry manipulation, and file system access.
- **Microsoft Vulnerable Drivers Blocklist verification** — Compatibility is checked against Microsoft’s Vulnerable Driver Blocklist (MVDB) for more accurate results than static lists.
- **Search and filtering** — Find drivers by hashes, company, description, Microsoft Vulnerable Drivers Blocklist status, architecture, and behavioral patterns.
- **Certificate information** — Certificate validation and status are shown in driver details for security assessment.
- **Architecture-aware filtering** — Filter by x64, x32, or arm64 with clear labels on each driver card.

## Technical Implementation

- **Data pipeline** — Continuous integration with the LOLDrivers project for up-to-date threat intelligence.
- **Server-side processing** — Filtering and search run on the server for good performance on large datasets.
- **Microsoft Vulnerable Drivers Blocklist data** — Automated workflows fetch and parse Microsoft’s Vulnerable Driver Blocklist (MVDB) so blocklist compatibility data stays current.
- **URL state** — Filter and search state live in the URL for sharing and bookmarking.
- **Responsive layout** — Usable on desktop and smaller screens.

## Research Use

- Support for cybersecurity research, threat intelligence, and academic work on driver-based attack vectors.
- Open-source and community-oriented to encourage contributions and collaborative research.

## Quick Reference — Key Terms

- **Microsoft Vulnerable Drivers Blocklist (MVDB)** — The official list of driver hashes that Windows blocks when Hypervisor-protected Code Integrity is enabled; our checks compare against this list.
- **Process killer drivers** — Legitimate drivers with vulnerabilities that can be abused to terminate processes with elevated privileges.
- **Behavioral analysis** — Automated detection of driver capabilities from imported function analysis.
- **Architecture display** — x64, x32, or arm64 shown next to driver names for quick identification.
- **Capacities section** — Part of each driver card that lists behavioral capabilities from function analysis.

## Legal & Ethical Notice

This database is for legitimate security research and defensive use only. Use must comply with applicable laws, organizational policies, and ethical standards. Misuse for malicious purposes is prohibited.

**Community:** Improve driver security through responsible disclosure and collaborative offensive and defensive research.

## Disclaimer

This project is provided “as is” without warranty or guarantee. Maintainers are not responsible for the accuracy, completeness, or fitness of the data or platform. Users assume all risk when using the database and its information.
