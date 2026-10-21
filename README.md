# minigoof

A minimal, intentionally vulnerable Node.js app for demoing automated dependency remediation.
A slimmed-down take on [nodejs-goof](https://github.com/nir-se-snyk/nodejs-goof): no databases, no
template engines, four vulnerable open source dependencies, each reachable from a route.
**Do not deploy.**

## Run

```sh
npm install
npm start        # http://localhost:3001
npm test         # smoke tests; must stay green after every upgrade
```

## Vulnerable dependencies

| Package | Vulnerable | Fixed | Vulnerability | Route | Upgrade notes |
|---|---|---|---|---|---|
| lodash | 4.17.4 | 4.18.1 | Prototype pollution (`_.merge`), command/code injection (`_.template`) | `POST /settings` | Drop-in |
| adm-zip | 0.4.7 | 0.6.1 | Zip slip, decompression bomb, SUID bits | `POST /import` | Drop-in for this usage |
| moment | 2.15.1 | 2.31.0 | ReDoS, locale path traversal | `GET /due?date=&lang=` | Drop-in |
| marked | 0.3.5 | 4.0.10+ | XSS / sanitize bypass, ReDoS | `GET /` | **Breaking**: `require('marked')` becomes `require('marked').marked` |

Express is pinned to a clean version so the vulnerability list stays short.

Note: `marked@0.3.19` (the same-major fix) still has open ReDoS advisories, so a remediation agent
has to take the major bump and adapt the import. The test suite catches it if it doesn't.

## Exploit scripts

With the app running:

```sh
./exploits/prototype-pollution.sh   # vulnerable: 403 -> 200 on /admin
./exploits/zip-slip.sh              # vulnerable: evil.txt written outside uploads/
rm -f evil.txt                      # clean up after the zip slip demo
```

## Expected result after remediation

`npm audit` reports 0 vulnerabilities, `npm test` passes 6/6, and both exploit scripts report safe.
