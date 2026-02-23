const { verifyBootIntegrity } = require('./src/boot/verify.js');

console.log('Testing boot chain verification...');
const result = verifyBootIntegrity();
console.log('Result:', result);

if (result.ok) {
  console.log('✅ Boot chain verification PASSED');
  process.exit(0);
} else {
  console.log('❌ Boot chain verification FAILED:', result.reason);
  process.exit(1);
}
