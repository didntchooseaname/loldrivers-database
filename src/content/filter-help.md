# How Filters Work

Filters narrow the catalogue to exactly the drivers you care about. Toggle any combination, then click **Apply filters** - the search box runs live as you type, so you can refine both at once.

---

## Quick filters

- **MVDB Passed** - Drivers that are *not* on Microsoft's Vulnerable Driver Blocklist, so they can still load where the blocklist is enforced (Windows 11, most enterprise builds).
- **Trusted Certificate** - Drivers whose signing certificate is still within its validity period.
- **Unknown Certificate** - Drivers whose certificate is expired or otherwise untrusted. Mutually exclusive with *Trusted Certificate*.
- **Recent Drivers** - Entries added to the database in the last 6 months.
- **Newest First / Oldest First** - Sort by the date the entry was added. Only one direction can be active; sorting is applied after filtering.

## Behavior filters

These infer what a driver can *do* from the Windows kernel functions it imports. Many legitimate drivers import the same APIs, so treat a match as a lead for investigation, not a verdict.

- **Process Killer** - Can terminate processes (e.g. `ZwTerminateProcess`). A classic BYOVD primitive for disabling security tooling.
- **Memory Manipulator** - Can allocate, map, or change the protection of memory (`ZwMapViewOfSection`, `ZwAllocateVirtualMemory`, `ZwProtectVirtualMemory`). Useful for code injection or bypassing memory protections.
- **Debug Bypass** - Can read or alter debug-related system state (`ZwSetInformationProcess`, `ZwQuerySystemInformation`). Often used to hide from debuggers or evade analysis.
- **Registry Manipulator** - Can create, modify, or delete registry keys and values (`ZwCreateKey`, `ZwSetValueKey`, `ZwDeleteKey`). Common for persistence and configuration tampering.
- **File Manipulator** - Can create, read, write, or delete files (`ZwCreateFile`, `ZwReadFile`, `ZwWriteFile`, `ZwDeleteFile`). Relevant to data theft, log tampering, and payload staging.

## Certificate filters

Refine by the state of a driver's code-signing certificate. Only one can be active at a time.

- **Valid** - A certificate that is present and currently within its validity period.
- **Expired** - A certificate that exists but has passed its expiry date.
- **No Cert** - No certificate information is available for the entry.

## Architecture filters

Filter by target processor architecture. Only one can be active at a time, and the architecture is also shown on each driver card.

- **x64** - 64-bit x86 (AMD64); the default on modern Windows.
- **x32** - 32-bit x86 (I386); legacy and compatibility scenarios.
- **arm64** - 64-bit ARM (ARM64); Windows on ARM devices.

## Combining filters effectively

All non-exclusive filters stack, so you can build precise queries:

- **MVDB Passed + Process Killer** - Drivers that can still load *and* can kill processes - a high-value target list for BYOVD defense.
- **MVDB Passed + Recent** - New additions that aren't blocked yet.
- **Memory Manipulator + Process Killer** - Drivers with several abusable primitives at once.
- **Registry Manipulator + File Manipulator** - Broad system-tampering capability.

**Apply vs. Clear** - Changes take effect only when you press **Apply filters**; the badge on that button shows how many filters are staged. Use **Clear filters** to reset both the search box and every active filter.

## A note on the MVDB check

This implementation was inspired by an earlier blocklist check on loldrivers.com that was not fully accurate. Rather than relying on a bundled local list (as the Trail of Bits script does), a daily GitHub Action queries **Microsoft's live Vulnerable Driver Blocklist** and cross-references it with this database.

- Microsoft blocklist: https://aka.ms/VulnerableDriverBlockList
- Trail of Bits script: https://raw.githubusercontent.com/trailofbits/HVCI-loldrivers-check/refs/heads/main/check_allowed_drivers.ps1
