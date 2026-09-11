# Bounded review protocol

Review helpers are read-only by default. Fetching checks, comments, unresolved
threads, and the current PR head SHA is allowed. Triggering a review, posting or
editing comments, resolving threads, or changing a PR requires an explicit user
instruction.

When an instructed review loop runs:

1. Record the current head SHA and iteration limit.
2. Collect all review sources and separate actionable findings from information.
3. Ignore results for an older SHA and never treat an absent check as success.
4. Apply verified fixes locally, rerun Vite+ verification, and record the new SHA.
5. Stop at the iteration or time limit and report remaining findings and caveats.

A clean report requires green checks for the current SHA and zero unresolved
actionable findings. Confidence scores alone are insufficient.
