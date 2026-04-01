# Referral Operations

NeuralShell referral attribution is local-first and exportable.

## In-App Flow

1. Open `Settings -> Referral Program`.
2. Set checkout base URL (defaults to Gumroad Pro listing).
3. Generate referral code/link.
4. Export local referral report JSON when needed.

## CLI Flow

```powershell
node scripts/referral_links.cjs --base=https://gumroad.com/l/neuralshell-operator
```

Optional file output:

```powershell
node scripts/referral_links.cjs --base=https://gumroad.com/l/neuralshell-operator --output=release/referrals/ref_001.json
```

## Attribution Notes

- Links append `ref` and UTM fields.
- Reports remain local until manually shared.
- No cloud tracker is required for baseline founder reporting.
