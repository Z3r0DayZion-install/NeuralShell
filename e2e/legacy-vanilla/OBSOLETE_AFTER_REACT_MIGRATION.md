# LEGACY PLAYWRIGHT SUITE

THIS FOLDER IS OBSOLETE. 

Do NOT attempt to run, revive, or patch these files to pass QA gates. 
The NeuralShell v2 architecture migrated to a Vite/React component model, invalidating the vanilla DOM selectors (`#statusLabel`, `#onboardingOverlay`, etc.) used in this historical test layer.

These files are preserved purely for reference on operator workflows, but the active E2E contract lives directly in the root `e2e/` folder mapped to structural `data-testid` attributes.
