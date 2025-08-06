## What are Authentihashes?

### Standard Hashes (MD5, SHA1, SHA256)
- **Include entire file content** - All bytes including digital signatures
- **Change when re-signed** - Same code with different signatures produces different hashes
- **File-level identification** - Useful for exact file matching

### Authentihashes
- **Exclude signature data** - Only hash the actual executable code and metadata
- **Consistent across re-signing** - Same code produces same authentihash regardless of signature
- **Code-level identification** - Useful for identifying malicious code variants

## Security Applications

### Malware Detection
- **Variant identification** - Same malware with different signatures shares authentihashes
- **Evasion detection** - Attackers cannot change authentihash by simply re-signing
- **Family clustering** - Related malware samples often share authentihash patterns

### Threat Intelligence
- **Consistent tracking** - Track malicious drivers across different signature campaigns
- **Attribution analysis** - Link samples to common code bases or development practices
- **Timeline analysis** - Understand evolution of malicious driver families

## Technical Implementation

### Calculation Process
The authentihash calculation follows a precise algorithm that excludes signature-related data from the hash computation:

1. **Parse PE Headers**
   - Read DOS header and locate PE signature
   - Parse COFF header and optional header
   - Extract section table information
   - Identify data directories (especially Certificate Table)

2. **Calculate Checksum Exclusion Range**
   - Locate the PE checksum field in optional header
   - Mark bytes at offset `OptionalHeader.CheckSum` (4 bytes) for exclusion
   - This ensures checksum changes don't affect authentihash

**Yes we can change a file hash without altering his signature:**

![Checksum field could be modified in optional header](cff.png)

3. **Identify Certificate Table**
   - Read Certificate Table data directory entry
   - Extract `VirtualAddress` and `Size` of certificate data
   - Mark this entire range for exclusion from hash calculation

4. **Process File Sections**
   - **Include**: All PE headers up to certificate table reference
   - **Include**: All section data (.text, .data, .rdata, etc.)
   - **Include**: Any overlay data before certificate table
   - **Exclude**: PE checksum field (4 bytes)
   - **Exclude**: Certificate table directory entry (8 bytes)
   - **Exclude**: Entire certificate table and signature data

5. **Hash Calculation**
   - Create hash context (MD5, SHA1, or SHA256)
   - Process file sequentially, skipping excluded ranges
   - Update hash with included byte ranges only
   - Finalize hash computation

**Reference Tool**: [**AuthHashCalc** - Authenticode Hash Calculator](https://github.com/hfiref0x/AuthHashCalc)  
*Open source tool for calculating PE file authentihashes*

**Reference**: [**Authicode Microsoft documentation** - Authenticode Hash Calculator](https://learn.microsoft.com/en-us/windows-hardware/drivers/install/authenticode)  
*Authenticode Microsoft documentation*

### Use Cases in Analysis
- **Memory forensics** - Match loaded drivers regardless of on-disk signatures
- **Incident response** - Identify known threats across different environments
- **Threat hunting** - Search for code patterns independent of signing status

## Limitations and Considerations

### When Authentihashes Change
- **Code modifications** - Any change to executable code or resources
- **Compiler differences** - Same source code compiled differently
- **Packing or obfuscation** - Code transformations affect authentihash

### Analysis Best Practices
- **Use in combination** - Combine with standard hashes for complete analysis
- **Consider context** - Evaluate both code similarity and signature legitimacy
- **Temporal analysis** - Track changes over time for trend identification

## Integration with LOLDrivers Database

### Why Authentihashes Matter Here
- **Comprehensive identification** - Track vulnerable drivers across signature variants
- **Research correlation** - Link findings across different security research
- **Detection coverage** - Improve security tool effectiveness with code-level identification

### Practical Applications
- **IOC development** - Create more robust indicators of compromise
- **Rule creation** - Develop detection rules based on code patterns
- **Intelligence sharing** - Share threat information using consistent identifiers
