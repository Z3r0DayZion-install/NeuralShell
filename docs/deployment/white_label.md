# White-Label / OEM Build Flow

White-label builds are generated from signed branding profiles. Branding fields are applied without bypassing policy/proof guardrails.

## 1) Sign the branding profile
```bash
node scripts/sign_white_label_config.cjs --input config/white_label_profile.json --output config/white_label.json
```

## 2) Verify signer trust
```bash
node scripts/verify_white_label_config.cjs --config config/white_label.json --trusted config/white_label_trusted_publishers.json
```

## 3) Generate white-label build artifact
```bash
node scripts/gen_white_label_build.cjs --config config/white_label.json
```

## Output
`release/white-label/<profile>-<timestamp>/`
- `branding/signed_profile.json`
- `branding/runtime_profile.json`
- `config/white_label.runtime.json`
- `proof/branding_profile_proof.json`
- `manifest.json`

## Safety
- Branding changes are limited to display/runtime profile fields.
- Security controls (proof/policy/audit guardrails) remain enforced.
