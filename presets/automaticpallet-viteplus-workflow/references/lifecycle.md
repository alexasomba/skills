# Software factory lifecycle

## Isolate

Run the doctor, fetch `origin/preview`, inspect active work and uncommitted
changes for overlapping files, then create a uniquely named detached worktree.
List shared ports, databases, credentials, and lockfiles. Stop for direction if
another active change overlaps materially.

## Build

Keep product policy in its owning flow. Extract only repeated mechanics behind
explicit inputs and structured results. Change one caller at a time and preserve
architecture and data-ownership boundaries during migrations.

## Prove

Capture the failing or previous behavior before implementation when practical.
Use deterministic public-interface tests for acceptance scenarios, failures,
retries, concurrency, and identity boundaries. Keep evidence local and redacted;
record the exact tested commit SHA. A claim without reproducible evidence is not
done.

## Ship

Run `vp run agent:verify`, squash through `vp run agent:land <name>`, and validate
the exact `preview` SHA remotely. Public apps need Cloudflare preview URLs and
data services need successful non-public preview versions. Promote only through
a `preview` to `main` PR with green required checks and a human merge.
