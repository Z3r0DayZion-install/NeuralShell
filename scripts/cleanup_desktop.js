const fs = require('node:fs');
const path = require('node:path');

const desktopDir = 'C:\Users\KickA\Desktop';
const targets = [
  'Final_Architectural_Assessment.txt',
  'NeuralShell_Final_Resume_Report.txt',
  'NeuralShell_Final_Security_Audit_v2.1.txt',
  'NeuralShell_Hardening_Blueprint.txt',
  'NeuralShell_Hardening_Master_Status.txt',
  'NeuralShell_Hardening_Phase_Final.txt',
  'NeuralShell_Hardening_Ready.txt',
  'NeuralShell_Hardware_Trust_Blueprint.txt',
  'NeuralShell_NextSteps.txt',
  'NeuralShell_Phase0_Phase1_Proof.txt',
  'NeuralShell_Phase10_Proof.txt',
  'NeuralShell_Phase11_Proof.txt',
  'NeuralShell_Phase12_Proof.txt',
  'NeuralShell_Phase2_Proof.txt',
  'NeuralShell_Phase3_Proof.txt',
  'NeuralShell_Phase4_Proof.txt',
  'NeuralShell_Phase5_Proof.txt',
  'NeuralShell_Phase6_Proof.txt',
  'NeuralShell_Phase7_Proof.txt',
  'NeuralShell_Phase8_Proof.txt',
  'NeuralShell_Phase9_Proof.txt',
  'NeuralShell_Production_Hardening_Plan.txt',
  'NeuralShell_Release_Gate_Audit.txt',
  'NeuralShell_Release_Readiness_Certificate.txt',
  'NeuralShell_Security_Audit_Final.txt',
  'NeuralShell_Security_Audit_Report_v2.txt',
  'NeuralShell_Security_Audit_Report.txt',
  'NeuralShell_Security_Blueprint_v3.0.txt',
  'NeuralShell_Security_Blueprint_v4.0.txt',
  'NeuralShell_Security_Blueprint.txt',
  'NeuralShell_Security_Final_Validation.txt',
  'NeuralShell_Security_Finalization_Blueprint.txt',
  'NeuralShell_Security_Workbook.txt',
  'NeuralShell_ZeroTrust_Final_Report.txt'
];

targets.forEach(target => {
  const fullPath = path.join(desktopDir, target);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log(`Deleted: ${target}`);
    } catch (e) {
      console.error(`Error deleting ${target}: ${e.message}`);
    }
  }
});
