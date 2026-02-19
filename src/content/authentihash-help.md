# What Are Authentihashes?

Authentihashes identify **code** rather than the whole file. They stay the same when a file is re-signed, so they are better for tracking variants and evading simple hash changes.

---

## Standard Hashes vs Authentihashes

### Standard Hashes (MD5, SHA1, SHA256)

- Include the **entire file** (all bytes, including digital signatures).
- **Change when re-signed** — Same code with a different signature gives different hashes.
- **Use:** Exact file matching.

### Authentihashes

- **Exclude signature data** — Only the executable code and relevant metadata are hashed.
- **Stable across re-signing** — Same code gives the same authentihash regardless of signature.
- **Use:** Identifying the same code across different signed builds.

## Security Applications

### Malware Detection

- **Variants** — Same malware with different signatures can share the same authentihash.
- **Evasion** — Re-signing does not change the authentihash.
- **Families** — Related samples often share authentihash patterns.

### Threat Intelligence

- **Tracking** — Follow malicious drivers across different signing campaigns.
- **Attribution** — Link samples to common code bases or tooling.
- **Timeline** — Study how a driver family evolves over time.

## Technical Implementation

### Calculation Process

The authentihash is computed by excluding signature-related data from the hash:

1. **Parse PE headers** — DOS header, PE signature, COFF and optional headers, section table, data directories (including Certificate Table).
2. **Checksum exclusion** — Mark the 4-byte PE checksum in the optional header so checksum changes do not affect the hash.
3. **Certificate table** — Read the Certificate Table data directory; exclude its full range from the hash.
4. **Sections** — Include all PE headers (up to the certificate reference), all section data (.text, .data, .rdata, etc.), and overlay data before the certificate table. Exclude the checksum field, the certificate directory entry, and the entire certificate table.
5. **Hash** — Build the hash (MD5, SHA1, or SHA256) over only the included bytes.

The checksum field in the optional header can be changed without altering the signature:

![Checksum field could be modified in optional header](cff.png)

**Reference tool:** [AuthHashCalc](https://github.com/hfiref0x/AuthHashCalc) — Open-source authentihash calculator for PE files.

**Microsoft docs:** [Authenticode](https://learn.microsoft.com/en-us/windows-hardware/drivers/install/authenticode).

### Use Cases in Analysis

- **Memory forensics** — Match loaded drivers regardless of on-disk signature.
- **Incident response** — Identify known threats across environments.
- **Threat hunting** — Search by code pattern instead of signing status.

## Limitations and Considerations

### When Authentihashes Change

- Code or resource changes.
- Different compiler or build options.
- Packing or obfuscation that changes the code.

### Best Practices

- **Combine** with standard hashes for a full picture.
- **Context** — Use both code similarity and signature information.
- **Over time** — Track changes for trend and campaign analysis.

## Why Authentihashes Matter Here

- **Identification** — Track vulnerable drivers across signature variants.
- **Research** — Correlate findings across sources using a stable identifier.
- **Detection** — Build better IOCs and rules with code-level identification.

**Practical uses:** Stronger indicators of compromise, rules based on code patterns, and more consistent sharing of threat intelligence.
