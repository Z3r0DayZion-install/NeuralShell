const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const args = process.argv.slice(2);
const tierArgIndex = args.indexOf('--tier');
const emailArgIndex = args.indexOf('--email');

const tier = tierArgIndex !== -1 ? args[tierArgIndex + 1] : 'operator';
const email = emailArgIndex !== -1 ? args[emailArgIndex + 1] : 'pending@gumroad.com';

const tierPrefixMap = {
    'preview': 'prv',
    'operator': 'op',
    'founder': 'fnd'
};

const prefix = tierPrefixMap[tier.toLowerCase()] || 'op';
const randomBase62 = crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 7);
const licenseKey = `ns_${prefix}_${randomBase62}`;

const csvPath = path.join(__dirname, '..', 'release', 'neural_shell_licenses.csv');
const dateStr = new Date().toISOString();

const row = `${dateStr},${email},Pending,${licenseKey},${tier},Active\n`;

const dirPath = path.dirname(csvPath);
if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
}

if (!fs.existsSync(csvPath)) {
    fs.writeFileSync(csvPath, 'Date,Email,GumroadID,LicenseKey,Tier,Status\n');
}

fs.appendFileSync(csvPath, row);

console.log(`\n============================`);
console.log(`LICENSE GENERATED SUCCESSFULLY`);
console.log(`============================`);
console.log(`Tier:      ${tier.toUpperCase()}`);
console.log(`Email:     ${email}`);
console.log(`Key:       ${licenseKey}`);
console.log(`============================`);
console.log(`Appended to: ${csvPath}\n`);
