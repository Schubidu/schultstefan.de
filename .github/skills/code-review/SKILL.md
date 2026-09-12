# Code review

Review this repository by validating findings before recommending changes.

## Review method

- Treat the current repository and pull-request diff as authoritative.
- Verify every finding against the actual runtime, tool, or package contract before suggesting a fix.
- Distinguish product code, generated code, configuration, and vendored third-party code.
- Prefer concrete behavioral, security, accessibility, CI, or maintainability defects over speculative or stylistic observations.
- Do not recommend weakening lint, type, test, or security checks merely to make the pull request pass.
- Call out stale pull-request descriptions or documentation when they no longer match the actual diff.

## Vendored anti-slop boundary

`tools/oxlint/anti-slop/**` is an inspectable snapshot vendored from the commit documented in `tools/oxlint/anti-slop/UPSTREAM.md`.

- Findings in unchanged vendored implementation or vendored upstream tests are upstream/vendor findings, not automatically project defects.
- Do not require local patches to vendored implementation solely to address an upstream rule limitation.
- Local changes to the vendored implementation require an explicit project decision and must be documented as such.
- Review this project primarily for correct anti-slop integration: enabled rules, project-source coverage, deterministic project checks, and absence of silent rule disables.
- Vendored upstream tests are not part of the project quality gate unless this repository intentionally forks or modifies the corresponding upstream behavior.

## Before recommending re-review

Only recommend another review after the author has:

1. verified each prior finding;
2. fixed the findings that are valid for this repository;
3. documented why rejected findings are not applicable;
4. run the canonical `npm run check` gate; and
5. performed a final self-review with no remaining material finding.
