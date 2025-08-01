# Filter Help Content

## Information Notice

**Information Notice:** This implementation was inspired by the work from loldrivers.com for the HVCI check functionality, but their implementation wasn&apos;t accurate. Unlike the Trail of Bits script that compares against a local version of the driver blocklist, our HVCI check uses Microsoft&apos;s direct link to the vulnerable driver blocklist for more precise comparison and testing.

**Reference:** Trail of Bits script: https://raw.githubusercontent.com/trailofbits/HVCI-loldrivers-check/refs/heads/main/check_allowed_drivers.ps1

**Microsoft Blocklist:** https://aka.ms/VulnerableDriverBlockList

## HVCI Compatible Filter

**What it does:** Shows only drivers that are compatible with Hypervisor-protected Code Integrity (HVCI) and are NOT present in Microsoft&apos;s vulnerable driver blocklist.

**Technical Details:** This filter uses a GitHub Action workflow that automatically fetches Microsoft&apos;s official vulnerable driver blocklist from https://aka.ms/VulnerableDriverBlockList and cross-references it with our driver database. The check runs on a scheduled basis to ensure up-to-date results.

**Use Case:** Identify drivers that can safely run on systems with HVCI enabled, which is crucial for Windows 11 and enterprise security configurations.

**GitHub Workflow:** The automated process downloads the latest XML blocklist, parses the driver hashes, and marks drivers accordingly. This ensures real-time accuracy compared to static local lists.

## Process Killer Filter

**What it does:** Displays drivers that are known to be exploitable and have been used in real-world attacks, with specific capabilities to terminate processes.

**Technical Details:** These are legitimate drivers with security vulnerabilities that attackers exploit to gain elevated privileges or perform malicious actions. They&apos;re catalogued based on public threat intelligence and security research.

**Attack Vector:** Commonly used in BYOVD (Bring Your Own Vulnerable Driver) attacks where attackers load these legitimate-but-vulnerable drivers to bypass security controls and terminate security processes.

**Detection:** Security teams can use this filter to identify potentially dangerous drivers in their environment and prioritize them for blocking or monitoring.

## Behavioral Analysis Filters

**Overview:** These filters analyze the imported functions of each driver to detect specific behavioral patterns that could indicate malicious capabilities.

### Memory Manipulator Filter

**What it does:** Identifies drivers with capabilities to manipulate memory, allocate virtual memory, or map memory sections.

**Function Analysis:** Detects functions like ZwProtectVirtualMemory, ZwAllocateVirtualMemory, ZwMapViewOfSection, and memory-related kernel APIs.

**Security Implications:** Memory manipulation capabilities can be used for code injection, privilege escalation, or bypassing memory protections.

**Legitimate Uses:** Many legitimate drivers also manipulate memory for normal operations, so context and additional analysis are important.

### Debug Bypass Filter

**What it does:** Finds drivers that can potentially bypass debugging protections or manipulate debug-related system information.

**Function Analysis:** Looks for functions like ZwSetInformationProcess, ZwQuerySystemInformation, and debug-related kernel APIs.

**Attack Techniques:** Can be used to hide processes from debuggers, disable debugging features, or manipulate debug ports.

**Anti-Analysis:** Commonly used by malware to evade detection and analysis by security researchers and sandboxes.

### Registry Manipulator Filter

**What it does:** Identifies drivers capable of creating, modifying, or deleting Windows registry keys and values.

**Function Analysis:** Detects registry-related functions like ZwCreateKey, ZwSetValueKey, ZwDeleteKey, and registry manipulation APIs.

**Persistence Mechanisms:** Registry manipulation is often used for establishing persistence, modifying system configurations, or hiding malicious activities.

**System Impact:** Can affect system startup, security settings, application behavior, and overall system stability.

### File Manipulator Filter

**What it does:** Shows drivers with file system manipulation capabilities including creating, reading, writing, or deleting files.

**Function Analysis:** Identifies file-related functions like ZwCreateFile, ZwReadFile, ZwWriteFile, ZwDeleteFile, and I/O operations.

**Data Exfiltration:** File manipulation capabilities can be used for data theft, log tampering, or deploying additional malicious payloads.

**System Modification:** Can modify critical system files, application binaries, or configuration files to maintain persistence.

## Metadata Filters

**Overview:** These filters are based on driver metadata and verification status rather than behavioral analysis.

### Verified and Unverified Filters

**What it does:** Filters drivers based on their verification status in the original database.

**Verified Drivers:** Drivers that have been confirmed as legitimate through various verification processes.

**Unverified Drivers:** Drivers that lack proper verification or have questionable authenticity.

**Mutual Exclusivity:** These filters are mutually exclusive - a driver cannot be both verified and unverified.

### Architecture Filters

**What it does:** Filters drivers by their target processor architecture.

**x64 (AMD64):** 64-bit x86 architecture drivers (most common on modern Windows systems).

**x32 (I386):** 32-bit x86 architecture drivers (legacy systems and compatibility).

**arm64 (ARM64):** ARM 64-bit architecture drivers (Windows on ARM devices).

**Mutual Exclusivity:** Only one architecture can be selected at a time since drivers are compiled for specific architectures.

**Display:** Architecture is also shown directly in driver cards next to the driver title for quick identification.

## Certificate Filters

### Trusted Certificate Filter

**What it does:** Shows drivers signed by well-established Certificate Authorities like Microsoft, GlobalSign, DigiCert, VeriSign, and other recognized issuers.

**Certificate Validation:** The system analyzes the certificate chain and issuer information to determine if the signing authority is from a trusted root CA.

**Business Logic:** Mutually exclusive with &quot;Unknown Certificate&quot; filter - you can only select one at a time since a certificate cannot be both trusted and untrusted.

**Security Note:** While a trusted certificate indicates legitimate signing, it doesn&apos;t guarantee the driver is safe - legitimate certificates can sign vulnerable or malicious drivers.

### Unknown Certificate Filter

**What it does:** Displays drivers with certificates that are expired, self-signed, revoked, or issued by unrecognized Certificate Authorities.

**Risk Assessment:** These drivers require additional scrutiny as their certificate chain cannot be validated through standard trust mechanisms.

**Common Scenarios:** Self-signed certificates, expired certificates, certificates from compromised CAs, or test certificates that made it into production.

**Mutual Exclusivity:** Cannot be used simultaneously with &quot;Trusted Certificate&quot; filter due to conflicting logic.

## Time-based Filters

### Recent Drivers Filter

**What it does:** Shows drivers that were added to the database within the last 6 months.

**Threat Hunting:** Useful for identifying newly discovered malicious drivers or recently reported threats.

**Date Logic:** Based on the &quot;Created&quot; field in the database, indicating when the driver entry was first added.

**Analysis Value:** Recent drivers combined with other filters help track emerging threats and active campaigns.

### Newest First and Oldest First

**What it does:** Sorts the entire result set by the date the driver was added to our database.

**Newest First:** Shows recently discovered or updated drivers at the top - useful for tracking emerging threats and latest additions.

**Oldest First:** Shows historically known drivers first - useful for studying long-term attack patterns and established threats.

**Mutual Exclusivity:** You can only sort in one direction at a time. These filters affect the entire result ordering, not just filtering.

**Performance Note:** Sorting is applied after filtering, so combining with other filters will sort only the filtered results.

## How to Use Filters Effectively

**Combination Strategy:** Filters can be combined (except mutually exclusive ones) to create precise queries. Examples:

- **HVCI Compatible + Recent Drivers:** Newly discovered drivers that are HVCI-compatible
- **Memory Manipulator + Process Killer:** Highly dangerous drivers with multiple attack capabilities
- **Unverified + File Manipulator:** Suspicious drivers with file system access
- **Debug Bypass + Unknown Certificate:** Potential evasion tools with questionable authenticity

**Behavioral Analysis:** Use the behavioral filters (Memory Manipulator, Debug Bypass, Registry Manipulator, File Manipulator) to understand driver capabilities and potential attack vectors.

**Architecture Targeting:** Filter by architecture (AMD64, I386, ARM64) when analyzing threats specific to certain system types or compatibility requirements.

**Apply vs Clear:** Changes are staged until you click &quot;Apply Filters&quot;. Use &quot;Clear Filters&quot; to reset both search terms and active filters.

**URL Integration:** Filter states are preserved in the URL, so you can bookmark specific filter combinations or share them with colleagues.

**Performance:** Server-side filtering ensures fast results even with large datasets. Pagination maintains performance with extensive result sets.
