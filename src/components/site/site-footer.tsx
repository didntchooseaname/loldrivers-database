import { GithubIcon } from '@/components/icons/github';
import { Logo } from './logo';

export function SiteFooter({ onTerms }: { onTerms: () => void }) {
  const link = 'text-foreground/80 underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground/60';
  return (
    <footer className="mt-24 border-t">
      <div className="mx-auto grid max-w-[90rem] gap-8 px-4 py-10 text-sm text-muted-foreground sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5 text-foreground">
            <Logo className="size-6" />
            <span className="font-semibold tracking-tight">LOLDrivers Database</span>
          </div>
          <p className="max-w-sm leading-relaxed">
            An independent search interface over the community-maintained LOLDrivers catalog, built for detection engineers and threat hunters.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-muted-foreground">Data</h2>
          <a className={link} href="https://loldrivers.io" target="_blank" rel="noopener noreferrer">LOLDrivers.io project</a>
          <a className={link} href="https://github.com/magicsword-io/LOLDrivers" target="_blank" rel="noopener noreferrer">magicsword-io/LOLDrivers</a>
          <a className={link} href="https://learn.microsoft.com/windows/security/application-security/application-control/app-control-for-business/design/microsoft-recommended-driver-block-rules" target="_blank" rel="noopener noreferrer">Microsoft driver blocklist</a>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-muted-foreground">Project</h2>
          <a className={`${link} inline-flex items-center gap-1.5`} href="https://github.com/didntchooseaname/loldrivers-database" target="_blank" rel="noopener noreferrer">
            <GithubIcon className="size-3.5" /> Source code
          </a>
          <button type="button" onClick={onTerms} className={`${link} w-fit text-left`}>Terms &amp; license</button>
        </div>
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-[90rem] px-4 py-4 text-xs text-muted-foreground sm:px-6">
          For educational and defensive research. Samples are live malware-grade drivers: handle them in an isolated lab.
        </p>
      </div>
    </footer>
  );
}
