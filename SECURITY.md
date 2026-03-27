# Security Policy

## Supported Versions

We actively provide security updates for the latest release of **Liquid Stats**.  
Previous releases are not supported.

> We recommend always using the latest code from the `main` branch.

---

## Reporting a Vulnerability

If you discover a security vulnerability in this Angular app, please report it responsibly:

- **Email (preferred):** `security@chrisfrome.com`  
- **Include in your report:**
  - Steps to reproduce the issue
  - Node.js version (`>=22.0.0`) and npm version (`>=9.0.0`)
  - Angular version (`21.1.x`) and other key dependencies
  - Browser and OS environment if applicable
  - Any relevant logs, screenshots, or code snippets

- **Response timeline:**
  - We will acknowledge receipt within 48 hours
  - Provide updates within 7 days
  - Security patches will be released in the next minor or patch release

> **Important:** Do not open a public GitHub issue with security details. Report issues privately.

---

## Scope

This policy covers security issues related to:

- Frontend vulnerabilities (e.g., XSS, CSRF, insecure HTTP requests)
- Dependency vulnerabilities in Angular (`@angular/*`), RxJS, Chart.js, Leaflet, and other npm packages
- Misconfigurations exposing sensitive environment variables or API keys
- Vulnerabilities in test tooling (e.g., Playwright, Jasmine) if they affect production code

---

## Dependency Monitoring

We monitor key dependencies via [GitHub Dependabot](https://docs.github.com/en/code-security/supply-chain-security/keeping-your-dependencies-updated-automatically/about-dependabot-security-updates). Users are encouraged to enable Dependabot notifications in their forks or clones.

---

## Acknowledgments

We appreciate responsible disclosure. Contributors who report verified vulnerabilities may be publicly acknowledged (with permission) after a fix is released.
