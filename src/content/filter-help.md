# How Filters Work

This guide explains each filter and how to combine them for precise queries.

---

## Information Notice

This implementation was inspired by loldrivers.com’s Microsoft Vulnerable Drivers Blocklist check; their implementation was not accurate. Unlike the Trail of Bits script (which uses a local blocklist), we query **Microsoft’s direct vulnerable driver blocklist** for comparison.

- **Trail of Bits script:** https://raw.githubusercontent.com/trailofbits/HVCI-loldrivers-check/refs/heads/main/check_allowed_drivers.ps1  
- **Microsoft blocklist:** https://aka.ms/VulnerableDriverBlockList

## MVDB Passed Filter

- **What it does:** Shows only drivers that passed the Microsoft Vulnerable Driver Blocklist (MVDB) automated daily check.
- **How it works:** A GitHub Action fetches the blocklist from https://aka.ms/VulnerableDriverBlockList and cross-references it with this database.
- **Use case:** Find drivers that can run on systems with Microsoft Vulnerable Drivers Blocklist in effect (important for Windows 11 and enterprise security).

## Process Killer Filter

- **What it does:** Shows drivers that are known to be exploitable and have been used in real attacks, with the ability to terminate processes.
- **Technical:** Legitimate drivers with security flaws that attackers use for privilege escalation or other malicious actions.
- **Attack vector:** Often used in BYOVD (Bring Your Own Vulnerable Driver) attacks to load a vulnerable driver and bypass security.
- **Use case:** Identify potentially dangerous drivers in your environment for blocking or monitoring.

## Memory Manipulator Filter

- **What it does:** Finds drivers that can manipulate memory, allocate virtual memory, or map memory sections.
- **Detection:** Looks for functions such as `ZwProtectVirtualMemory`, `ZwAllocateVirtualMemory`, `ZwMapViewOfSection`, and related kernel APIs.
- **Security impact:** Can support code injection, privilege escalation, or bypass of memory protections.
- **Note:** Many legitimate drivers also use memory APIs; context and further analysis are important.

## Debug Bypass Filter

- **What it does:** Finds drivers that can bypass debugging protections or manipulate debug-related system information.
- **Detection:** Looks for functions such as `ZwSetInformationProcess`, `ZwQuerySystemInformation`, and debug-related kernel APIs.
- **Use:** Can hide processes from debuggers, disable debugging, or manipulate debug ports; often used by malware to evade analysis.

## Registry Manipulator Filter

- **What it does:** Finds drivers that can create, modify, or delete Windows registry keys and values.
- **Detection:** Registry-related functions such as `ZwCreateKey`, `ZwSetValueKey`, `ZwDeleteKey`, and similar APIs.
- **Use:** Often used for persistence, changing system configuration, or hiding malicious activity.

## File Manipulator Filter

- **What it does:** Finds drivers with file system capabilities: create, read, write, or delete files.
- **Detection:** File-related functions such as `ZwCreateFile`, `ZwReadFile`, `ZwWriteFile`, `ZwDeleteFile`, and I/O operations.
- **Security impact:** Can be used for data theft, log tampering, or deploying more malware.

## Certificate Manipulator Filter

- **What it does:** Finds drivers that can manipulate digital certificates and certificate stores.
- **Detection:** Certificate-related functions and validation APIs.
- **Security impact:** Can bypass code-signing checks, install malicious certificates, or undermine PKI.

## IoControlCode Filter

- **What it does:** Filters by `IoControlCode` (IOCTL) usage patterns.
- **Context:** IOCTL codes define how user-mode applications talk to kernel drivers via `DeviceIoControl`.
- **Use case:** Malicious drivers often implement custom IOCTL handlers; poorly validated handlers are a common privilege-escalation vector.

## Architecture Filters

Filter by target processor architecture. Only one can be active at a time.

- **x64 (AMD64)** — 64-bit x86; most common on modern Windows.
- **x32 (I386)** — 32-bit x86; legacy and compatibility.
- **arm64 (ARM64)** — ARM 64-bit; Windows on ARM devices.

Architecture is also shown on each driver card next to the name.

## Certificate Validation Filters

*Certificate-based filtering is currently disabled in the UI while the validation system is updated. Certificate status is still shown in driver details.*

- **Display:** Driver cards show certificate status (expired, valid, missing, revoked, suspicious) for assessment.
- **Risk:** Certificate data helps assess legitimacy; expired or suspicious certs can indicate outdated or risky signing.

## Recent Drivers Filter

- **What it does:** Shows drivers added to the database in the last 6 months.
- **Use:** Spot newly discovered malicious drivers or recently reported threats.
- **Logic:** Based on the “Created” date of the driver entry.

## Newest First / Oldest First

- **What it does:** Sorts all results by the date the driver was added to the database.
- **Newest first** — Recent discoveries at the top; good for emerging threats.
- **Oldest first** — Long-known drivers first; good for historical patterns.
- Only one sort direction can be active. Sorting applies after filtering.

## Using Filters Effectively

**Combining filters (except mutually exclusive ones) gives precise queries. Examples:**

- MVDB Passed + Process Killer — Microsoft Vulnerable Drivers Blocklist–compatible drivers with process-termination capability.
- MVDB Passed + Recent — Newly added drivers that are Microsoft Vulnerable Drivers Blocklist–compatible.
- Memory Manipulator + Process Killer — High-risk drivers with multiple capabilities.
- Registry + File Manipulator — Drivers with broad system manipulation.

**Apply vs Clear:** Changes are applied only when you click **Apply Filters**. Use **Clear Filters** to reset search and all filters.

**Behavioral filters** — Use capability filters (Memory, Debug Bypass, Registry, File, Process Killer) to understand what a driver can do and how it might be abused.

**Architecture** — Filter by architecture when you care about a specific platform (e.g. x64 for most current systems, ARM64 for Windows on ARM).
