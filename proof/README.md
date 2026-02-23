# Proof Tracking

This folder is a local, reproducible proof trail that stays readable even if `state/` is kept empty.

Run:

```text
cd C:\Users\KickA\NeuralShell
node proof/proof.js
```

Outputs:
- `proof/runs/<timestamp>/` — full run bundle (transcripts + copied proof artifacts)
- `proof/latest/` — pointers/copies for the most recent run
- `proof/ledger.jsonl` — append-only run ledger

By default `proof/proof.js` copies artifacts out of `state/` into `proof/`, then empties `state/`.

