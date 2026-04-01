# Billing and Licensing

NeuralShell supports `Free`, `Pro`, and `Enterprise` plans with offline activation.

## Purchase Paths

- Pro checkout: Gumroad or Stripe (from `config/plans.json`)
- Enterprise: manual invoice/demo request via mailto link

Use this helper to generate current checkout docs:

```powershell
node scripts/checkout_links.cjs
```

## Offline Activation

1. Generate a signed license blob (internal/founder op flow):

```powershell
node scripts/generate_offline_license.cjs --plan=pro --customer=beta-user --seats=1 --output=release/licenses/pro_sample.json
```

2. In app: `Settings -> Billing & License`
3. Paste or import the JSON blob
4. Confirm status pill changes to `active` or `grace`

## Grace Behavior

- Expired licenses transition to `grace` if `graceDays > 0`.
- Grace is visible in-app and non-destructive.
- Expired + grace elapsed moves to free capability set.
