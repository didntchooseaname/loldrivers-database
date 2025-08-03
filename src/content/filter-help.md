## Information Notice

**Information Notice:** This implementation was inspired by the work from loldrivers.com for the `HVCI` check functionality, but their implementation wasn&apos;t accurate. Unlike the Trail of Bits script that compares against a local version of the driver blocklist, our `HVCI` check uses Microsoft&apos;s direct link to the vulnerable driver blocklist for more precise comparison and testing.

**Reference:** Trail of Bits script: https://raw.githubusercontent.com/trailofbits/HVCI-loldrivers-check/refs/heads/main/check_allowed_drivers.ps1

**Microsoft Blocklist:** https://aka.ms/VulnerableDriverBlockList

## HVCI Compatible Filter

**What it does:** Shows only drivers that are compatible with `Hypervisor-protected Code Integrity (HVCI)` and are NOT present in Microsoft&apos;s vulnerable driver blocklist.

**Technical Details:** This filter uses a `GitHub Action` workflow that automatically fetches Microsoft&apos;s official vulnerable driver blocklist from https://aka.ms/VulnerableDriverBlockList and cross-references it with our driver database. The check runs on a scheduled basis to ensure up-to-date results.

**Use Case:** Identify drivers that can safely run on systems with `HVCI` enabled, which is crucial for `Windows 11` and enterprise security configurations.

**GitHub Workflow:** The automated process downloads the latest `XML` blocklist, parses the driver hashes, and marks drivers accordingly. This ensures real-time accuracy compared to static local lists.

## Process Killer Filter

**What it does:** Displays drivers that are known to be exploitable and have been used in real-world attacks, with specific capabilities to terminate processes.

**Technical Details:** These are legitimate drivers with security vulnerabilities that attackers exploit to gain elevated privileges or perform malicious actions. They&apos;re catalogued based on public threat intelligence and security research.

**Attack Vector:** Commonly used in `BYOVD (Bring Your Own Vulnerable Driver)` attacks where attackers load these legitimate-but-vulnerable drivers to bypass security controls and terminate security processes.

**Detection:** Security teams can use this filter to identify potentially dangerous drivers in their environment and prioritize them for blocking or monitoring.

## Memory Manipulator Filter

**What it does:** Identifies drivers with capabilities to manipulate memory, allocate virtual memory, or map memory sections.

**Function Analysis:** Detects functions like `ZwProtectVirtualMemory`, `ZwAllocateVirtualMemory`, `ZwMapViewOfSection`, and memory-related kernel APIs.

**Security Implications:** Memory manipulation capabilities can be used for code injection, privilege escalation, or bypassing memory protections.

**Legitimate Uses:** Many legitimate drivers also manipulate memory for normal operations, so context and additional analysis are important.

## Debug Bypass Filter

**What it does:** Finds drivers that can potentially bypass debugging protections or manipulate debug-related system information.

**Function Analysis:** Looks for functions like `ZwSetInformationProcess`, `ZwQuerySystemInformation`, and debug-related kernel APIs.

**Attack Techniques:** Can be used to hide processes from debuggers, disable debugging features, or manipulate debug ports.

**Anti-Analysis:** Commonly used by malware to evade detection and analysis by security researchers and sandboxes.

## Registry Manipulator Filter

**What it does:** Identifies drivers capable of creating, modifying, or deleting Windows registry keys and values.

**Function Analysis:** Detects registry-related functions like `ZwCreateKey`, `ZwSetValueKey`, `ZwDeleteKey`, and registry manipulation APIs.

**Persistence Mechanisms:** Registry manipulation is often used for establishing persistence, modifying system configurations, or hiding malicious activities.

**System Impact:** Can affect system startup, security settings, application behavior, and overall system stability.

## File Manipulator Filter

**What it does:** Shows drivers with file system manipulation capabilities including creating, reading, writing, or deleting files.

**Function Analysis:** Identifies file-related functions like `ZwCreateFile`, `ZwReadFile`, `ZwWriteFile`, `ZwDeleteFile`, and I/O operations.

**Data Exfiltration:** File manipulation capabilities can be used for data theft, log tampering, or deploying additional malicious payloads.

**System Modification:** Can modify critical system files, application binaries, or configuration files to maintain persistence.

## Certificate Manipulator Filter

**What it does:** Locates drivers that can manipulate digital certificates and certificate stores.

**Function Analysis:** Identifies certificate-related functions like `CertCreateCertificateStore`, `CertAddCertificateContextToStore`, and certificate validation APIs.

**Security Implications:** Certificate manipulation can bypass code signing verification, install malicious certificates, or compromise `PKI` infrastructure.

**Trust Chain Impact:** Can affect the entire certificate validation process and system trust mechanisms.

## IoControlCode Filter

**What it does:** Filters drivers based on their `IoControlCode` (`IOCTL`) usage patterns.

**Device Communication:** `IOCTL` codes define how user-mode applications communicate with kernel drivers through `DeviceIoControl` API.

**Custom Controls:** Malicious drivers often implement custom `IOCTL` handlers for unauthorized operations.

**Attack Surface:** Poorly validated `IOCTL` handlers represent significant attack vectors for privilege escalation.

## Architecture Filters

**What it does:** Filters drivers by their target processor architecture.

**x64 (AMD64):** 64-bit x86 architecture drivers (most common on modern Windows systems).

**x32 (I386):** 32-bit x86 architecture drivers (legacy systems and compatibility).

**arm64 (ARM64):** ARM 64-bit architecture drivers (Windows on ARM devices).

**Mutual Exclusivity:** Only one architecture can be selected at a time since drivers are compiled for specific architectures.

**Display:** Architecture is also shown directly in driver cards next to the driver title for quick identification.

## Certificate Validation Filters

The certificate validation system provides comprehensive analysis of driver signing certificates through automated workflows that validate certificate status, expiration, and trust chains.

### Expired Certificates Filter

**What it does:** Displays drivers with certificates that have passed their validity period.

**Risk Assessment:** Expired certificates can indicate outdated drivers or potentially suspicious signing practices.

**Validation Logic:** Checks the `ValidTo` field against current date/time to determine expiration status.

**Security Note:** While not immediately malicious, expired certificates require additional scrutiny.

### Valid Certificates Filter

**What it does:** Shows drivers with properly validated certificates from trusted Certificate Authorities.

**Validation Criteria:** Current (not expired), not revoked, issued by recognized CA, and follows standard certificate practices.

**Trust Level:** Highest confidence level for certificate authenticity, though doesn't guarantee driver safety.

**Mutual Exclusivity:** Cannot be combined with expired or missing certificate filters due to logical conflicts.

### No Certificate Filter

**What it does:** Displays drivers that lack digital signatures or certificate information entirely.

**Security Assessment:** Unsigned drivers are automatically blocked by modern Windows security mechanisms and cannot load on systems with proper security configurations.

**Modern Windows:** Current Windows versions (Windows 10/11 with Secure Boot, HVCI, or Driver Signature Enforcement) will reject unsigned drivers, making them ineffective on secured systems.

**Historical Context:** These drivers may represent legacy threats from older Windows versions or systems with disabled security features.

## Recent Drivers Filter

**What it does:** Shows drivers that were added to the database within the last 6 months.

**Threat Hunting:** Useful for identifying newly discovered malicious drivers or recently reported threats.

**Date Logic:** Based on the "Created" field in the database, indicating when the driver entry was first added.

**Analysis Value:** Recent drivers combined with other filters help track emerging threats and active campaigns.

## Newest First and Oldest First

**What it does:** Sorts the entire result set by the date the driver was added to our database.

**Newest First:** Shows recently discovered or updated drivers at the top - useful for tracking emerging threats and latest additions.

**Oldest First:** Shows historically known drivers first - useful for studying long-term attack patterns and established threats.

**Mutual Exclusivity:** You can only sort in one direction at a time. These filters affect the entire result ordering, not just filtering.

**Performance Note:** Sorting is applied after filtering, so combining with other filters will sort only the filtered results.

## How to Use Filters Effectively

**Combination Strategy:** Filters can be combined (except mutually exclusive ones) to create precise queries. Examples:

- **HVCI Compatible + Valid Certificates + Process Killer:** HVCI-compatible and legitimately signed killer driver
- **HVCI Compatible + Recent Drivers:** Newly discovered drivers that are HVCI-compatible
- **Memory Manipulator + Process Killer:** Highly dangerous drivers with multiple attack capabilities
- **Debug Bypass + No Certificate:** Potential evasion tools without proper signing
- **Revoked Certificates + Process Killer:** Extremely high-risk drivers with compromised signing
- **Valid Certificates + File Manipulator:** Legitimately signed but potentially dangerous drivers

**Certificate Classification Logic:** The system uses automated workflows to analyze and classify driver certificates through comprehensive validation:

**Technical Analysis Process:**
- **Certificate Chain Validation:** Verifies the complete certificate chain from root CA to signing certificate
- **Temporal Validation:** Checks ValidFrom/ValidTo dates against current timestamp for expiration status
- **Revocation Checking:** Cross-references certificate serial numbers and thumbprints against known revocation databases
- **Authority Assessment:** Evaluates issuer against database of known legitimate and compromised Certificate Authorities

**Classification Categories:**
- **Valid:** Passes all validation checks - current validity period, trusted CA, not revoked, production certificate
- **Revoked:** Certificate found in revocation lists or known compromised certificate databases
- **Expired:** ValidTo date is earlier than current timestamp
- **Suspicious:** Self-signed, unusual patterns, or issued by questionable authorities
- **Missing:** No digital signature or certificate data present in driver binary

**Workflow Integration:** Certificate validation runs as part of the automated "Driver Tagging" GitHub workflow, processing the entire database and applying appropriate tags based on validation results.

**Behavioral Analysis Strategy:** Use behavioral filters to understand driver capabilities and potential attack vectors:

- **Memory Manipulator:** Drivers with memory allocation, mapping, or protection modification capabilities
- **Debug Bypass:** Drivers that can manipulate debugging features or hide processes from analysis tools  
- **Registry Manipulator:** Drivers capable of creating, modifying, or deleting Windows registry entries
- **File Manipulator:** Drivers with file system manipulation capabilities for reading, writing, or deleting files
- **Process Killer:** Drivers specifically capable of terminating processes, often used in security bypass attacks

**Architecture Targeting:** Filter by target processor architecture when analyzing platform-specific threats:

- **AMD64 (x64):** Most common on modern Windows systems, highest priority for current threat analysis
- **I386 (x32):** Legacy 32-bit systems, important for compatibility and historical threat research
- **ARM64:** Windows on ARM devices, growing importance with ARM-based Windows systems

**Apply vs Clear:** Changes are staged until you click &quot;Apply Filters&quot;. Use &quot;Clear Filters&quot; to reset both search terms and active filters.
