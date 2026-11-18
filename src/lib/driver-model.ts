import type { Driver } from '@/types';

export type CertStatus = 'valid' | 'expired' | 'none';
export type MvdbStatus = 'passed' | 'blocked' | null;

export type Capability =
  | 'process-killer'
  | 'memory-manipulator'
  | 'debug-bypass'
  | 'registry-manipulator'
  | 'file-manipulator';

export const CAPABILITY_LABELS: Record<Capability, string> = {
  'process-killer': 'Process killer',
  'memory-manipulator': 'Memory',
  'debug-bypass': 'Debug bypass',
  'registry-manipulator': 'Registry',
  'file-manipulator': 'File system',
};

const CAPABILITY_MATCHERS: Array<[Capability, string[]]> = [
  ['process-killer', ['zwterminateprocess']],
  ['memory-manipulator', ['zwmap', 'zwallocate', 'mmmap', 'mmallocate', 'virtualalloc', 'virtualprotect', 'heap', 'pool']],
  ['debug-bypass', ['zwsetinformationprocess', 'zwsetinformationthread', 'zwquerysysteminformation', 'dbgkd', 'kddebugger', 'debugport']],
  ['registry-manipulator', ['zwcreatekey', 'zwopenkey', 'zwsetvaluekey', 'zwdeletekey', 'regcreate', 'regopen', 'regset', 'regdelete']],
  ['file-manipulator', ['zwcreatefile', 'zwopenfile', 'zwreadfile', 'zwwritefile', 'zwdeletefile', 'iocreate', 'ntread', 'ntwrite']],
];

export function getCapabilities(driver: Driver): Capability[] {
  if (Array.isArray(driver._capabilities)) return driver._capabilities as Capability[];
  const functions = driver.ImportedFunctions;
  if (!Array.isArray(functions) || functions.length === 0) return [];
  const lowered = functions.map((f) => f.toLowerCase());
  return CAPABILITY_MATCHERS
    .filter(([, needles]) => lowered.some((f) => needles.some((n) => f.includes(n))))
    .map(([capability]) => capability);
}

export function isProcessKiller(driver: Driver): boolean {
  return driver.ImportedFunctions?.some((f) => f.toLowerCase().includes('zwterminateprocess')) ?? false;
}

export function getMvdbStatus(driver: Driver): MvdbStatus {
  const status = (driver as Record<string, unknown>)._mvdbStatus;
  return status === 'passed' || status === 'blocked' ? status : null;
}

export function getCertStatus(driver: Driver): CertStatus {
  const precomputed = driver._certStatus;
  if (precomputed === 'valid' || precomputed === 'expired' || precomputed === 'none') return precomputed;
  const signatures = driver.Signatures;
  if (!Array.isArray(signatures) || signatures.length === 0) return 'none';
  const now = Date.now();
  let hasCerts = false;
  for (const signature of signatures) {
    if (!Array.isArray(signature.Certificates)) continue;
    for (const cert of signature.Certificates) {
      hasCerts = true;
      if (cert.ValidTo && new Date(cert.ValidTo).getTime() > now) return 'valid';
    }
  }
  return hasCerts ? 'expired' : 'none';
}

export interface SignerSummary {
  subject: string;
  issuer?: string;
  validTo?: string;
  expired: boolean;
}

export function getSigners(driver: Driver): SignerSummary[] {
  const signatures = driver.Signatures;
  if (!Array.isArray(signatures)) return [];
  const seen = new Set<string>();
  const signers: SignerSummary[] = [];
  for (const signature of signatures) {
    const certs = signature.Certificates as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(certs) || certs.length === 0) continue;
    const leaf = certs.find((c) => String(c.CertificateType ?? '').startsWith('Leaf') || c.IsCodeSigning === 'True') ?? certs[0];
    const signerInfo = (signature as Record<string, unknown>).Signer;
    const signerIssuer = Array.isArray(signerInfo) ? (signerInfo[0] as Record<string, unknown> | undefined)?.Issuer : undefined;
    const subject = readName(leaf.Subject) ?? 'Unknown signer';
    const validTo = typeof leaf.ValidTo === 'string' ? leaf.ValidTo : undefined;
    const key = `${subject}|${validTo}`;
    if (seen.has(key)) continue;
    seen.add(key);
    signers.push({
      subject,
      issuer: readName(leaf.Issuer) ?? readName(signerIssuer),
      validTo,
      expired: validTo ? new Date(validTo).getTime() < Date.now() : false,
    });
  }
  return signers;
}

function readName(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const field = (key: string) => value.match(new RegExp(`(?:^|,\\s*)${key}=("?)([^,"]+)\\1`))?.[2]?.trim();
  return field('CN') ?? field('O') ?? value.trim();
}

const UNKNOWN = new Set(['', 'unknown', 'no description available']);
const known = (value: unknown): value is string =>
  typeof value === 'string' && !UNKNOWN.has(value.trim().toLowerCase());

export function getDriverName(driver: Driver): string {
  for (const candidate of [driver.DisplayName, driver.OriginalFilename, driver.Filename]) {
    if (known(candidate)) return candidate;
  }
  const tag = driver.Tags?.find((t) => t?.trim());
  return tag ?? 'Unknown driver';
}

export function getDescription(driver: Driver): string | null {
  const own = known(driver.Description) ? driver.Description : '';
  const usage = known(driver.Commands?.Description) ? driver.Commands!.Description! : '';
  if (!own && !usage) return null;
  if (!own) return usage;
  if (!usage) return own;
  return usage.length > own.length * 1.2 ? usage : own;
}

export function getCompany(driver: Driver): string | null {
  return known(driver.Company) ? driver.Company : null;
}

export function formatArchitecture(machineType: unknown): string | null {
  if (typeof machineType !== 'string' || !machineType) return null;
  switch (machineType.toUpperCase()) {
    case 'AMD64': return 'x64';
    case 'I386': return 'x86';
    case 'ARM64': return 'ARM64';
    default: return machineType.toLowerCase();
  }
}

export interface HashEntry {
  label: string;
  value: string;
  kind: 'file' | 'authentihash';
}

export function getHashes(driver: Driver): HashEntry[] {
  const out: HashEntry[] = [];
  const push = (label: string, value: unknown, kind: HashEntry['kind']) => {
    if (typeof value === 'string' && value.trim()) out.push({ label, value: value.trim(), kind });
  };
  push('SHA256', driver.SHA256, 'file');
  push('SHA1', driver.SHA1, 'file');
  push('MD5', driver.MD5, 'file');
  push('SHA256', driver.Authentihash?.SHA256, 'authentihash');
  push('SHA1', driver.Authentihash?.SHA1, 'authentihash');
  push('MD5', driver.Authentihash?.MD5, 'authentihash');
  return out;
}

export function getPrimaryHash(driver: Driver): HashEntry | null {
  return getHashes(driver).find((h) => h.kind === 'file') ?? null;
}

export function getDownloadUrl(driver: Driver): string | null {
  if (typeof driver.DownloadUrl === 'string' && driver.DownloadUrl) return driver.DownloadUrl;
  if (driver.MD5) return `https://github.com/magicsword-io/LOLDrivers/raw/main/drivers/${driver.MD5}.bin`;
  return null;
}

export function getResources(driver: Driver): string[] {
  if (!Array.isArray(driver.Resources)) return [];
  return driver.Resources.filter((r) => {
    if (typeof r !== 'string' || !r.trim()) return false;
    const lower = r.toLowerCase();
    return !/internal[\s_-]research/.test(lower);
  });
}

export type FunctionGroup =
  | 'critical' | 'process' | 'memory' | 'file' | 'registry'
  | 'network' | 'security' | 'kernel' | 'other';

export const FUNCTION_GROUP_LABELS: Record<FunctionGroup, string> = {
  critical: 'Critical',
  process: 'Process & thread',
  memory: 'Memory',
  file: 'File system',
  registry: 'Registry',
  network: 'Network',
  security: 'Security',
  kernel: 'Kernel & system',
  other: 'Other',
};

export function groupImportedFunctions(functions: string[] | undefined): Array<[FunctionGroup, string[]]> {
  const groups: Record<FunctionGroup, string[]> = {
    critical: [], process: [], memory: [], file: [], registry: [],
    network: [], security: [], kernel: [], other: [],
  };
  for (const fn of functions ?? []) {
    const f = fn.toLowerCase();
    const has = (...needles: string[]) => needles.some((n) => f.includes(n));
    if (has('zwterminateprocess')) groups.critical.push(fn);
    else if (has('process', 'thread', 'zwcreate', 'zwopen', 'pscreate', 'psget')) groups.process.push(fn);
    else if (has('memory', 'virtual', 'mmmap', 'mmallocate', 'zwmap', 'zwallocate', 'heap', 'pool')) groups.memory.push(fn);
    else if (has('file', 'directory', 'zwread', 'zwwrite', 'zwdelete', 'iocreate', 'ntread', 'ntwrite')) groups.file.push(fn);
    else if (has('registry', 'regopen', 'regcreate', 'regset', 'regquery')) groups.registry.push(fn);
    else if (has('socket', 'wsk', 'network', 'tcp', 'udp', 'tdi')) groups.network.push(fn);
    else if (has('security', 'token', 'privilege', 'seaccess', 'seaudit', 'sesingle')) groups.security.push(fn);
    else if (has('ke', 'hal', 'io', 'ob', 'ex', 'rtl', 'zwquery', 'zwset', 'ntquery', 'ntset')) groups.kernel.push(fn);
    else groups.other.push(fn);
  }
  return (Object.keys(groups) as FunctionGroup[])
    .filter((key) => groups[key].length > 0)
    .map((key) => [key, groups[key]]);
}

export function driverKey(driver: Driver): string {
  return String(driver.SHA256 || driver.SHA1 || driver.MD5 || driver.Id || getDriverName(driver));
}

export function truncateMiddle(value: string, head = 10, tail = 8): string {
  return value.length <= head + tail + 1 ? value : `${value.slice(0, head)}…${value.slice(-tail)}`;
}

const SUMMARY_FIELDS = [
  'Id', 'DisplayName', 'OriginalFilename', 'Filename', 'Company', 'Created', 'MachineType',
  'FeaturedKiller', 'DownloadUrl', 'MD5', 'SHA1', 'SHA256', '_mvdbStatus',
] as const;

/** Card-sized projection of a driver. The detail view fetches the full record. */
export function toSummary(driver: Driver): Driver {
  const out: Record<string, unknown> = {};
  for (const key of SUMMARY_FIELDS) {
    if (driver[key] !== undefined && driver[key] !== null && driver[key] !== '') out[key] = driver[key];
  }
  const tag = driver.Tags?.find((t) => t?.trim());
  if (tag) out.Tags = [tag];
  const description = getDescription(driver);
  if (description) out.Description = description;
  out._certStatus = getCertStatus(driver);
  out._capabilities = getCapabilities(driver);
  out._importCount = driver.ImportedFunctions?.length ?? 0;
  out._resourceCount = getResources(driver).length;
  out._summary = true;
  return out as Driver;
}

export function isSummary(driver: Driver): boolean {
  return driver._summary === true;
}

export function getImportCount(driver: Driver): number {
  return typeof driver._importCount === 'number' ? driver._importCount : driver.ImportedFunctions?.length ?? 0;
}

export function getResourceCount(driver: Driver): number {
  return typeof driver._resourceCount === 'number' ? driver._resourceCount : getResources(driver).length;
}
