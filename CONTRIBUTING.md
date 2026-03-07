# Contributing to EduZambia

First off, thank you for considering contributing to EduZambia! It's people like you that make this platform robust for schools across Zambia.

## Branch Naming Convention

Please create your branches following this pattern:
`feat/issue-XXX-short-description`
`fix/issue-XXX-short-description`
`chore/issue-XXX-short-description`

## Pull Request Process

1. Ensure your code satisfies the **Definition of Done** from the sprint.
2. Run `npm run type-check` and `npm run lint` and guarantee 0 warnings/errors.
3. Every Convex function touching school data MUST integrate the `withSchoolScope` helper logic.
4. Pass all automated tests (`npm run test:ci`).

## Code Review Rules

- **No self-merges** on `main`.
- You must get at least **1 approval** from another core developer.
- Make sure JSDocs are written for any exported utilities.

## Commit Message Convention

Use Conventional Commits:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation updates
- `chore:` for tooling or dependencies

_Happy Coding!_
