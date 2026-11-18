# How Filters Work

Filters narrow the catalogue to exactly the drivers you care about. Every change applies instantly, and the search box runs live as you type, so you can refine both at once. Hover any filter to see what it means.

---

## Status

- **MVDB passed** - Drivers that are *not* on Microsoft's Vulnerable Driver Blocklist, so they can still load where the blocklist is enforced (Windows 11, most enterprise builds).
- **Added in last 12 months** - Entries added to the database in the last year.

**Sort** - The sort menu above the results orders them by the date the entry was added, newest or oldest first. Sorting is applied after filtering.

## Behavior filters

These infer what a driver can *do* from the Windows kernel functions it imports. Many legitimate drivers import the same APIs, so treat a match as a lead for investigation, not a verdict.

- **Process killer** - Can terminate processes (e.g. `ZwTerminateProcess`). A classic BYOVD primitive for disabling security tooling.
- **Memory manipulation** - Can allocate, map, or change the protection of memory (`ZwMapViewOfSection`, `ZwAllocateVirtualMemory`, `ZwProtectVirtualMemory`). Useful for code injection or bypassing memory protections.
- **Debug bypass** - Can read or alter debug-related system state (`ZwSetInformationProcess`, `ZwQuerySystemInformation`). Often used to hide from debuggers or evade analysis.
- **Registry access** - Can create, modify, or delete registry keys and values (`ZwCreateKey`, `ZwSetValueKey`, `ZwDeleteKey`). Common for persistence and configuration tampering.
- **File system access** - Can create, read, write, or delete files (`ZwCreateFile`, `ZwReadFile`, `ZwWriteFile`, `ZwDeleteFile`). Relevant to data theft, log tampering, and payload staging.

## Certificate filters

Refine by the state of a driver's code-signing certificate. Only one can be active at a time.

- **Valid** - A certificate that is present and currently within its validity period.
- **Expired** - A certificate that exists but has passed its expiry date.
- **No signature data** - The catalog has no certificate details for this sample. It does not necessarily mean the file is unsigned.

## VirusTotal filters

Each sample's SHA256 is looked up on VirusTotal by a daily job that spends the free API quota on new samples first, then refreshes results older than 30 days. Only one band can be active at a time.

- **More than 20 detections** - Widely flagged; typical of malicious drivers and well-known BYOVD tools.
- **6 to 20 detections** - A clear minority of engines flag the file.
- **1 to 5 detections** - A few engines flag it, often through generic signatures.
- **No detections** - No engine flags it. Common for signed vulnerable drivers, which is exactly why attackers like them.
- **Not scanned yet** - Waiting in the enrichment queue.

## Architecture filters

Filter by target processor architecture. Only one can be active at a time, and the architecture is also shown on each driver card.

- **x64** - 64-bit x86 (AMD64); the default on modern Windows.
- **x86** - 32-bit x86 (I386); legacy and compatibility scenarios.
- **ARM64** - 64-bit ARM (ARM64); Windows on ARM devices.

## Combining filters effectively

All non-exclusive filters stack, so you can build precise queries:

- **MVDB passed + Process killer** - Drivers that can still load *and* can kill processes - a high-value target list for BYOVD defense.
- **MVDB passed + Added in last 12 months** - New additions that aren't blocked yet.
- **Memory manipulation + Process killer** - Drivers with several abusable primitives at once.
- **Registry access + File system access** - Broad system-tampering capability.

**Removing filters** - Active filters appear as chips above the results. Remove one with its cross, or use **Clear all** to reset the search box and every filter. The two counters in the header (MVDB passed, Process killers) also toggle their filter.

## A note on the MVDB check

This implementation was inspired by an earlier blocklist check on loldrivers.com that was not fully accurate. Rather than relying on a bundled local list (as the Trail of Bits script does), a daily GitHub Action queries **Microsoft's live Vulnerable Driver Blocklist** and cross-references it with this database.

- Microsoft blocklist: https://aka.ms/VulnerableDriverBlockList
- Trail of Bits script: https://raw.githubusercontent.com/trailofbits/HVCI-loldrivers-check/refs/heads/main/check_allowed_drivers.ps1
