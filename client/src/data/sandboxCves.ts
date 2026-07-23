// CVEs with a real, runnable exploit/patch pair in the sandbox.
// Kept in sync with server/app/services/sandbox_service.py POC_HANDLERS.
export const SUPPORTED_SANDBOX_CVES = [
  {
    cve: 'CVE-2021-41773',
    name: 'Apache 2.4.49 Traversal RCE',
    description: 'Fires a URL-encoded path traversal exploit to inspect /etc/passwd in an ephemeral Docker container.',
  },
  {
    cve: 'CVE-2021-28041',
    name: 'OpenSSH ssh-agent Double Free',
    description: 'Grabs the live SSH banner to confirm the server version is patched (>=8.5).',
  },
  {
    cve: 'CVE-2015-3306',
    name: 'ProFTPD mod_copy RCE',
    description: 'Grabs the live FTP banner and fires SITE CPFR/CPTO to confirm mod_copy is exploitable (ProFTPD <1.3.6).',
  },
];
