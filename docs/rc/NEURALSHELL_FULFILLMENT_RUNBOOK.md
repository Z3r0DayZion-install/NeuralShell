# NeuralShell Fulfillment Runbook v1.0

This runbook defines the manual operational path for the first 100 Operator tier sales. We favor manual operations over building scalable infrastructure right now to get to first revenue instantly.

## 1. The Trigger
- **Source**: Gumroad triggers a successful payment webhook or sends a new sale email notification.
- **Product**: NeuralShell Operator Tier ($99).

## 2. Discord Fulfillment
- **Automated**: Gumroad integration automatically emails the buyer an invite link to the Sovereign Discord.
- **Manual**: When the buyer joins the Discord Server and verifies their Gumroad email in the `#welcome` channel, the Admin assigns them the **Operator** role.

## 3. License Issuance (The Unlock)
- **Format**: `ns_op_[RandomBase62]` (e.g., `ns_op_9xA4bVy`).
- **Storage**: A local CSV file `docs/rc/neural_shell_licenses.csv` stored securely by the founder. Columns: `Date, Email, GumroadID, LicenseKey, Tier, Status`.
- **Generation**: Run a local node script `node generate-license.js --tier operator --email buyer@example.com` which spits out a valid base-62 key and updates the CSV.
- **Delivery**: The Founder manually replies to the Gumroad receipt email with the generated License Key and the Onboarding instructions.

## 4. Key Tier Mapping & Enforcement
- `ns_prv_` = Preview
- `ns_op_` = Operator
- `ns_fnd_` = Founder 
- *The app will initially do an offline substring check on first-boot. Later versions will enforce ECDSA signatures over the network.*

## 5. Revocations & Lost Keys
- **Lost Key**: If a buyer loses their key, they email support. The Founder checks the CSV based on their Gumroad email and resends the existing key.
- **Abused Key**: If a key is leaked (found on Github/pastebin), it is marked as `Revoked` in the CSV. In the next release patch, that specific substring is added to an internal offline blocklist.

## 6. Support Path
- **P0/P1**: Workflow-breaking platform bugs. Handled via the `#operator-support` private Discord channel.
- **P2/P3**: Feature requests and general troubleshooting. Handled via `#feedback-direct`.
- **Billing**: Handled purely over email replies.
