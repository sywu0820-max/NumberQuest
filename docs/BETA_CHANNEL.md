# Number Quest Beta Channel

## Purpose
`beta` is the fixed dogfood release channel for versions that have completed implementation, automated validation, browser validation, and ChatGPT PR review, but are not yet promoted to `main` production.

## Current release
- Product version: v0.5 Learning Loop
- Reviewed product head: `df9756aecb1da920fedc67d12a042062c86b8239`
- Source PR: #3
- Status: accepted for child dogfood

This documentation-only commit does not change gameplay assets or product behavior relative to the reviewed v0.5 head.

## Deployment channel
The Vercel `number-quest-beta` project tracks this `beta` branch as Production. This documentation touch intentionally triggers the first `beta` deployment after Branch Tracking was configured.

## Promotion contract
Feature branches must never publish directly to the public Beta URL.

Promotion path:
1. bounded feature branch
2. automated tests
3. browser / touch validation
4. Vercel protected preview
5. ChatGPT PR review
6. repair loop until accepted
7. child-dogfood approval when required
8. advance `beta`

`main` production remains independent and must not be changed as part of Beta promotion.
