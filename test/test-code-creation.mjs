
import { CoderAgent } from '../src/agents/coderAgent.js';
import { HardenedSandbox } from '../src/sandbox/hardenedSandbox.js';

// Mock HardenedSandbox to avoid Docker dependency in this simple test
class MockSandbox {
  async execute(code) {
    console.log('[MockSandbox] Executing code:', code.substring(0, 50) + '...');
    try {
      // Unsafe eval for testing logic flow ONLY
      // In real app, this runs in Docker
      const result = eval(code); 
      return {
        success: true,
        output: "Mock Output: " + result,
        result: String(result)
      };
    } catch (err) {
      return {
        success: false,
        error: err.message
      };
    }
  }
}

async function testCodeCreation() {
  console.log("--- Testing Code Creation Capability ---");

  // Initialize CoderAgent with MockSandbox
  const coder = new CoderAgent();
  coder.sandbox = new MockSandbox();

  console.log("1. Testing basic math generation...");
  const mathTask = "Calculate the factorial of 5";
  // The CoderAgent in the code we read earlier has a template for "factorial"
  // so this should trigger that template.
  const result1 = await coder.executeTask({ type: 'generate_code', data: { spec: mathTask } });
  
  if (result1.execution.success) {
    console.log("✅ Math Task Succeeded");
    console.log("   Code:", result1.code);
    console.log("   Output:", result1.execution.output);
  } else {
    console.log("❌ Math Task Failed:", result1.execution.error);
  }

  console.log("\n2. Testing date generation...");
  const dateTask = "Show current date";
  const result2 = await coder.executeTask({ type: 'generate_code', data: { spec: dateTask } });

  if (result2.execution.success) {
    console.log("✅ Date Task Succeeded");
    console.log("   Code:", result2.code);
  } else {
    console.log("❌ Date Task Failed");
  }

  console.log("--- Code Creation Test Completed ---");
}

testCodeCreation().catch(console.error);
