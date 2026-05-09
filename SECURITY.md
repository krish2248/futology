# Security Policy

## Supported Versions

The `main` branch is the only supported branch for security fixes. The
deployed [GitHub Pages site](https://krish2248.github.io/futology/) auto-builds
from `main` on every push, so accepted fixes ship to production within a few
minutes of merge.

| Version | Supported          |
| ------- | ------------------ |
| `main`  | :white_check_mark: |
| Older   | :x:                |

## Reporting a Vulnerability

If you believe you've found a security vulnerability in FUTOLOGY, please
report it privately so we can investigate before public disclosure.

**Email:** sonikrish2248@gmail.com

Please include:

1. A description of the issue and its potential impact.
2. Steps to reproduce — ideally a minimal proof-of-concept.
3. The affected URL, route, or commit hash.
4. Your name and any preferred attribution.

You should expect an acknowledgement within **72 hours** and a status update
within **7 days**. Critical issues affecting authentication, data exposure,
or remote code execution will be prioritised.

## Disclosure Policy

We follow coordinated disclosure: please give us a reasonable window to
investigate and ship a fix before publishing details. Once a fix has been
deployed, we are happy to credit reporters in the release notes if they wish.

## Out of Scope

- Issues in third-party services we depend on (Supabase, Vercel, RapidAPI,
  Resend, etc.) — please report those to the relevant vendor.
- Self-XSS, social engineering, and physical attacks on user devices.
- Reports requiring physical access to a victim's unlocked device.
- Best-practice nits without a demonstrable security impact (e.g. missing
  security headers that don't lead to a real attack chain).

## Demo-mode caveat

The app currently runs in **demo mode** — no real user data, no real
authentication, no third-party API calls. The data layer is entirely seeded
in-memory. Issues that only apply once the Supabase + RapidAPI cutover lands
are still welcome, but please flag them as forward-looking.
