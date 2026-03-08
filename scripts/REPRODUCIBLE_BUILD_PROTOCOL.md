# Reproducible Build Protocol

Minimum requirements:
- pinned Node version
- pinned lockfile
- canonical file ordering
- line ending normalization
- deterministic JSON serialization
- exclusion of volatile metadata

Suggested flow:
1. clone repo
2. npm ci
3. run deterministic build script
4. compute artifact SHA256
5. compare against release manifest
