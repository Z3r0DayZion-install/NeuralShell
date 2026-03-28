# Appliance Mode Artifacts

Generated appliance runtime profiles and sealed deployment metadata are emitted into `release/appliance-build/`.

Use:

```bash
node scripts/gen_appliance_build.cjs
```

The generated profile is local-first and operator-scoped.