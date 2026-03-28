import React from 'react';
import { useShell } from './state/ShellContext';
import TopStatusBar from './components/TopStatusBar';
import ThreadRail from './components/ThreadRail';
import WorkspacePanel from './components/WorkspacePanel';
import WorkbenchRail from './components/WorkbenchRail';
import CommandPalette from './components/CommandPalette';
import SettingsDrawer from './components/SettingsDrawer';
import AnalyticsDrawer from './components/AnalyticsDrawer';
import ScratchpadTab from './components/ScratchpadTab';
import OnboardingWizard from './components/OnboardingWizard';
import IssueAssistModal from './components/IssueAssistModal';
import SuccessCaptureModal from './components/SuccessCaptureModal';
import EcosystemLauncher from './components/EcosystemLauncher';
import MissionControl from './components/MissionControl.jsx';
import NodeChainPanel from './components/NodeChainPanel.jsx';
import RuntimeAlertsDrawer from './components/RuntimeAlertsDrawer.jsx';
import FirstBootWizard from './components/FirstBootWizard.jsx';
import OnboardingProgressRail from './components/OnboardingProgressRail.jsx';
import SplitWorkspace from './components/SplitWorkspace.jsx';
import FleetControlPanel from './components/FleetControlPanel.jsx';
import RecoveryCenter from './components/RecoveryCenter.jsx';
import ApplianceConsole from './components/ApplianceConsole.jsx';
import ShiftConsole from './components/ShiftConsole.jsx';
import IncidentModePanel from './components/IncidentModePanel.jsx';
import PolicyRolloutConsole from './components/PolicyRolloutConsole.jsx';
import OfflineUpdateConsole from './components/OfflineUpdateConsole.jsx';
import MissionScheduler from './components/MissionScheduler.jsx';
import AirGapOperationsCenter from './components/AirGapOperationsCenter.jsx';
import TrustFabricConsole from './components/TrustFabricConsole.jsx';
import HardwareApplianceManager from './components/HardwareApplianceManager.jsx';
import CourierTransferCenter from './components/CourierTransferCenter.jsx';
import ContinuityDrillCenter from './components/ContinuityDrillCenter.jsx';
import ProcurementCommandCenter from './components/ProcurementCommandCenter.jsx';
import TamperSimulationCenter from './components/TamperSimulationCenter.jsx';
import InstitutionalCommandConsole from './components/InstitutionalCommandConsole.jsx';
import DemoFlowConsole from './components/DemoFlowConsole.jsx';
import DeploymentProgramCenter from './components/DeploymentProgramCenter.jsx';
import TrainingDeliveryCenter from './components/TrainingDeliveryCenter.jsx';
import SupportOpsConsole from './components/SupportOpsConsole.jsx';
import BuyerEvaluationCenter from './components/BuyerEvaluationCenter.jsx';
import PilotConversionConsole from './components/PilotConversionConsole.jsx';
import CommercialPackageConsole from './components/CommercialPackageConsole.jsx';
import FieldLaunchCommandCenter from './components/FieldLaunchCommandCenter.jsx';
import PartnerRolloutConsole from './components/PartnerRolloutConsole.jsx';
import BuyerOpsConsole from './components/BuyerOpsConsole.jsx';
import DemoToPilotConsole from './components/DemoToPilotConsole.jsx';
import PilotExpansionConsole from './components/PilotExpansionConsole.jsx';
import RenewalRiskConsole from './components/RenewalRiskConsole.jsx';
import LaunchWeekCommandCenter from './components/LaunchWeekCommandCenter.jsx';
import FollowupGenerator from './components/FollowupGenerator.jsx';
import FieldFeedbackConsole from './components/FieldFeedbackConsole.jsx';
import PartnerCertificationHub from './components/PartnerCertificationHub.jsx';
import ManagedServicesConsole from './components/ManagedServicesConsole.jsx';
import StrategicAccountConsole from './components/StrategicAccountConsole.jsx';
import PortfolioRolloutPlanner from './components/PortfolioRolloutPlanner.jsx';
import RevenueOpsConsole from './components/RevenueOpsConsole.jsx';
import ChannelExpansionPlanner from './components/ChannelExpansionPlanner.jsx';
import CrossAccountRenewalMatrix from './components/CrossAccountRenewalMatrix.jsx';
import ExecutiveScaleDashboard from './components/ExecutiveScaleDashboard.jsx';
import EcosystemPortfolioConsole from './components/EcosystemPortfolioConsole.jsx';
import ServiceLineConsole from './components/ServiceLineConsole.jsx';
import PartnerNetworkGovernance from './components/PartnerNetworkGovernance.jsx';
import GlobalPlanningConsole from './components/GlobalPlanningConsole.jsx';
import EcosystemRevenuePlanner from './components/EcosystemRevenuePlanner.jsx';
import BoardOperatingPackConsole from './components/BoardOperatingPackConsole.jsx';
import LicensedOperatorFramework from './components/LicensedOperatorFramework.jsx';
import EcosystemCommandCenter from './components/EcosystemCommandCenter.jsx';
import { useAccent } from './hooks/useAccent.ts';
import { useCollabRoom } from './hooks/useCollabRoom.ts';
import { useRuntimeState } from './hooks/useRuntimeState.ts';
import { useEventFeed } from './hooks/useEventFeed.ts';
import { useFirstBoot } from './hooks/useFirstBoot.ts';
import { useFleetState } from './hooks/useFleetState.ts';
import { getRoleCapabilities } from './runtime/roles/roleCapabilities.ts';
import { NodeChainEngine } from './runtime/nodechain/engine.ts';
import starterNodeChainRules from './config/nodechain_starter_rules.json';
import { appendRuntimeEvent, onRuntimeEvent } from './runtime/runtimeEventBus.ts';
import { RuntimeWatchdogSupervisor } from './runtime/watchdog/supervisor.ts';

const QUICKSTART_SESSION = 'NeuralShell_QuickStart';
const AUDIT_ALLOWED_COMMANDS = new Set(['/help', '/proof', '/roi', '/status', '/workflows', '/guard', '/clear']);
const PRO_UPGRADE_URL = 'https://gumroad.com/l/neuralshell-operator';
const FEEDBACK_URL = 'https://github.com/Z3r0DayZion-install/NeuralShell/issues/new?template=bug_report.md&title=Feedback%3A+';
const ONBOARDING_PROGRESS_KEY = 'neuralshell_onboarding_progress_v1';
const ONBOARDING_WIZARD_DISMISSED_KEY = 'neuralshell_onboarding_dismissed_v1';
const DEFAULT_VIEWPORT_WIDTH = 1440;
const EXPANDED_LAYOUT_MIN = 1280;
const BALANCED_LAYOUT_MIN = 1080;
const RAIL_LAYOUT_PREFS_KEY = 'neuralshell_rail_layout_prefs_v1';
const RAIL_COLLAPSE_PREFS_KEY = 'neuralshell_rail_collapse_prefs_v1';
const RAIL_RESIZE_HINT_DISMISSED_KEY = 'neuralshell_rail_resize_hint_dismissed_v1';
const APPLIANCE_MODE_KEY = 'neuralshell_appliance_mode_v1';
const AIRGAP_MODE_KEY = 'neuralshell_airgap_mode_v1';
const DEMO_MODE_KEY = 'neuralshell_demo_mode_v1';
const RUNTIME_ROLE_KEY = 'neuralshell_runtime_role_v1';
const INCIDENTS_STORAGE_KEY = 'neuralshell_incidents_v1';
const POLICY_ROLLOUT_HISTORY_KEY = 'neuralshell_policy_rollout_history_v1';
const DEFAULT_THREAD_RAIL_WIDTH = 288;
const DEFAULT_WORKBENCH_RAIL_WIDTH = 288;
const THREAD_RAIL_MIN_WIDTH = 236;
const WORKBENCH_RAIL_MIN_WIDTH = 236;
const THREAD_RAIL_MAX_WIDTH = 480;
const WORKBENCH_RAIL_MAX_WIDTH = 500;
const OVERLAY_RAIL_MARGIN = 24;
const KEYBOARD_RAIL_NUDGE_STEP = 16;
const NODECHAIN_RULES_STORAGE_KEY = 'neuralshell_nodechain_rules_v1';
const NODECHAIN_ALLOWLIST = ['releaseHealth:check', 'audit:verify', 'verification:run'];

const DEFAULT_RAIL_COLLAPSE_PREFS = Object.freeze({
    expanded: Object.freeze({ thread: false, workbench: false }),
    balanced: Object.freeze({ thread: false, workbench: false }),
    focused: Object.freeze({ thread: false, workbench: false }),
});

function buildDefaultSessionName() {
    return `Workflow_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function countOnboardingCompletedSteps() {
    if (typeof window === 'undefined' || !window.localStorage) return 0;
    try {
        const raw = JSON.parse(window.localStorage.getItem(ONBOARDING_PROGRESS_KEY) || '{}');
        const data = raw && typeof raw === 'object' ? raw : {};
        return Object.values(data).filter(Boolean).length;
    } catch {
        return 0;
    }
}

function clampRailWidth(value, min, max) {
    const safeMax = Number.isFinite(Number(max)) ? Math.max(180, Math.round(Number(max))) : Math.max(180, Math.round(Number(min) || 180));
    const safeMin = Number.isFinite(Number(min))
        ? Math.min(Math.max(180, Math.round(Number(min))), safeMax)
        : Math.min(220, safeMax);
    const numericValue = Number.isFinite(Number(value)) ? Number(value) : safeMin;
    return Math.round(Math.min(Math.max(numericValue, safeMin), safeMax));
}

function readRailLayoutPrefs() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return {
            thread: DEFAULT_THREAD_RAIL_WIDTH,
            workbench: DEFAULT_WORKBENCH_RAIL_WIDTH,
        };
    }
    try {
        const parsed = JSON.parse(window.localStorage.getItem(RAIL_LAYOUT_PREFS_KEY) || '{}');
        return {
            thread: clampRailWidth(
                parsed && typeof parsed === 'object' ? parsed.thread : DEFAULT_THREAD_RAIL_WIDTH,
                THREAD_RAIL_MIN_WIDTH,
                THREAD_RAIL_MAX_WIDTH,
            ),
            workbench: clampRailWidth(
                parsed && typeof parsed === 'object' ? parsed.workbench : DEFAULT_WORKBENCH_RAIL_WIDTH,
                WORKBENCH_RAIL_MIN_WIDTH,
                WORKBENCH_RAIL_MAX_WIDTH,
            ),
        };
    } catch {
        return {
            thread: DEFAULT_THREAD_RAIL_WIDTH,
            workbench: DEFAULT_WORKBENCH_RAIL_WIDTH,
        };
    }
}

function readRailCollapsePrefs() {
    const base = {
        expanded: { thread: false, workbench: false },
        balanced: { thread: false, workbench: false },
        focused: { thread: false, workbench: false },
    };
    if (typeof window === 'undefined' || !window.localStorage) {
        return base;
    }
    try {
        const parsed = JSON.parse(window.localStorage.getItem(RAIL_COLLAPSE_PREFS_KEY) || '{}');
        const data = parsed && typeof parsed === 'object' ? parsed : {};
        return {
            expanded: {
                thread: Boolean(data.expanded && data.expanded.thread),
                workbench: Boolean(data.expanded && data.expanded.workbench),
            },
            balanced: {
                thread: Boolean(data.balanced && data.balanced.thread),
                workbench: Boolean(data.balanced && data.balanced.workbench),
            },
            focused: {
                thread: Boolean(data.focused && data.focused.thread),
                workbench: Boolean(data.focused && data.focused.workbench),
            },
        };
    } catch {
        return base;
    }
}

function loadNodeChainRules() {
    if (typeof window === 'undefined' || !window.localStorage) return starterNodeChainRules;
    try {
        const parsed = JSON.parse(window.localStorage.getItem(NODECHAIN_RULES_STORAGE_KEY) || '[]');
        if (!Array.isArray(parsed) || !parsed.length) return starterNodeChainRules;
        return parsed;
    } catch {
        return starterNodeChainRules;
    }
}

const RAIL_SIZE_PRESETS = {
    compact: {
        thread: 252,
        workbench: 252,
    },
    balanced: {
        thread: DEFAULT_THREAD_RAIL_WIDTH,
        workbench: DEFAULT_WORKBENCH_RAIL_WIDTH,
    },
    wide: {
        thread: 340,
        workbench: 340,
    },
};

function App() {
    useAccent();

    const {
        // Domain
        model,
        setModel,
        workflowId,
        xpState,
        sessions,
        chatLog,
        appendChat,
        setChatLog,
        createSession,
        unlockSession,
        selectSession,
        lockSession,
        saveActiveSession,
        isSessionUnlocked,
        sessionHydrationStatus,
        sessionError,
        saveStatus,
        autoLockOnBlur,
        setAutoLockOnBlur,
        // System
        stats,
        // UI
        showPalette,
        togglePalette,
        closePalette,
        showSettings,
        openPalette,
        openSettings,
        closeSettings,
    } = useShell();

    const [prompt, setPrompt] = React.useState('');
    const [sessionDialog, setSessionDialog] = React.useState({
        open: false,
        mode: 'create',
        targetSession: '',
    });
    const [runtimeTier, setRuntimeTier] = React.useState('PREVIEW');
    const [runtimeCapabilityPayload, setRuntimeCapabilityPayload] = React.useState({
        tierId: 'free',
        tierLabel: 'Audit-Only',
        capabilities: [],
    });
    const [runtimeContextLoaded, setRuntimeContextLoaded] = React.useState(false);
    const [connectionInfo, setConnectionInfo] = React.useState({
        provider: 'ollama',
        baseUrl: '',
        model: 'llama3',
        allowRemoteBridge: false,
        health: 'unknown',
        reason: '',
    });
    const [isThinking, setIsThinking] = React.useState(false);
    const [accelStatus, setAccelStatus] = React.useState({ enabled: false, backend: 'cpu', device: '' });
    const [showAnalytics, setShowAnalytics] = React.useState(false);
    const [showEcosystem, setShowEcosystem] = React.useState(false);
    const [showMissionControl, setShowMissionControl] = React.useState(false);
    const [showFleetControl, setShowFleetControl] = React.useState(false);
    const [showRecoveryCenter, setShowRecoveryCenter] = React.useState(false);
    const [showApplianceConsole, setShowApplianceConsole] = React.useState(false);
    const [showAirGapOperations, setShowAirGapOperations] = React.useState(false);
    const [showTrustFabric, setShowTrustFabric] = React.useState(false);
    const [showHardwareAppliance, setShowHardwareAppliance] = React.useState(false);
    const [showCourierTransfer, setShowCourierTransfer] = React.useState(false);
    const [showContinuityDrills, setShowContinuityDrills] = React.useState(false);
    const [showProcurementCommand, setShowProcurementCommand] = React.useState(false);
    const [showTamperSimulation, setShowTamperSimulation] = React.useState(false);
    const [showInstitutionalCommand, setShowInstitutionalCommand] = React.useState(false);
    const [showShiftConsole, setShowShiftConsole] = React.useState(false);
    const [showIncidentMode, setShowIncidentMode] = React.useState(false);
    const [showPolicyRollout, setShowPolicyRollout] = React.useState(false);
    const [showOfflineUpdateConsole, setShowOfflineUpdateConsole] = React.useState(false);
    const [showMissionScheduler, setShowMissionScheduler] = React.useState(false);
    const [showDemoFlow, setShowDemoFlow] = React.useState(false);
    const [showDeploymentProgram, setShowDeploymentProgram] = React.useState(false);
    const [showTrainingDelivery, setShowTrainingDelivery] = React.useState(false);
    const [showSupportOps, setShowSupportOps] = React.useState(false);
    const [showBuyerJourney, setShowBuyerJourney] = React.useState(false);
    const [showPilotConversion, setShowPilotConversion] = React.useState(false);
    const [showCommercialPackages, setShowCommercialPackages] = React.useState(false);
    const [showFieldLaunch, setShowFieldLaunch] = React.useState(false);
    const [showPartnerRollout, setShowPartnerRollout] = React.useState(false);
    const [showBuyerOps, setShowBuyerOps] = React.useState(false);
    const [showDemoToPilot, setShowDemoToPilot] = React.useState(false);
    const [showPilotExpansion, setShowPilotExpansion] = React.useState(false);
    const [showRenewalRisk, setShowRenewalRisk] = React.useState(false);
    const [showLaunchWeek, setShowLaunchWeek] = React.useState(false);
    const [showFollowupGenerator, setShowFollowupGenerator] = React.useState(false);
    const [showFieldFeedback, setShowFieldFeedback] = React.useState(false);
    const [showPartnerCertification, setShowPartnerCertification] = React.useState(false);
    const [showManagedServices, setShowManagedServices] = React.useState(false);
    const [showStrategicAccount, setShowStrategicAccount] = React.useState(false);
    const [showPortfolioRollout, setShowPortfolioRollout] = React.useState(false);
    const [showRevenueOps, setShowRevenueOps] = React.useState(false);
    const [showChannelExpansion, setShowChannelExpansion] = React.useState(false);
    const [showCrossAccountRenewal, setShowCrossAccountRenewal] = React.useState(false);
    const [showExecutiveScale, setShowExecutiveScale] = React.useState(false);
    const [showEcosystemPortfolio, setShowEcosystemPortfolio] = React.useState(false);
    const [showServiceLine, setShowServiceLine] = React.useState(false);
    const [showPartnerNetworkGovernance, setShowPartnerNetworkGovernance] = React.useState(false);
    const [showGlobalPlanning, setShowGlobalPlanning] = React.useState(false);
    const [showEcosystemRevenue, setShowEcosystemRevenue] = React.useState(false);
    const [showBoardOperatingPack, setShowBoardOperatingPack] = React.useState(false);
    const [showLicensedOperator, setShowLicensedOperator] = React.useState(false);
    const [showEcosystemCommand, setShowEcosystemCommand] = React.useState(false);
    const [applianceModeEnabled, setApplianceModeEnabled] = React.useState(() => {
        if (typeof window === 'undefined' || !window.localStorage) return false;
        return window.localStorage.getItem(APPLIANCE_MODE_KEY) === '1';
    });
    const [airGapLocked, setAirGapLocked] = React.useState(() => {
        if (typeof window === 'undefined' || !window.localStorage) return false;
        return window.localStorage.getItem(AIRGAP_MODE_KEY) === '1';
    });
    const [demoModeEnabled, setDemoModeEnabled] = React.useState(() => {
        if (typeof window === 'undefined' || !window.localStorage) return false;
        return window.localStorage.getItem(DEMO_MODE_KEY) === '1';
    });
    const [activeRuntimeRole, setActiveRuntimeRole] = React.useState(() => {
        if (typeof window === 'undefined' || !window.localStorage) return 'operator';
        const stored = String(window.localStorage.getItem(RUNTIME_ROLE_KEY) || 'operator').trim().toLowerCase();
        if (stored === 'founder' || stored === 'operator' || stored === 'support' || stored === 'security' || stored === 'sales') {
            return stored;
        }
        return 'operator';
    });
    const [incidents, setIncidents] = React.useState(() => {
        if (typeof window === 'undefined' || !window.localStorage) return [];
        try {
            const parsed = JSON.parse(window.localStorage.getItem(INCIDENTS_STORAGE_KEY) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });
    const [policyRolloutHistory, setPolicyRolloutHistory] = React.useState(() => {
        if (typeof window === 'undefined' || !window.localStorage) return [];
        try {
            const parsed = JSON.parse(window.localStorage.getItem(POLICY_ROLLOUT_HISTORY_KEY) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });
    const roleCapabilities = React.useMemo(() => getRoleCapabilities(activeRuntimeRole), [activeRuntimeRole]);
    const [showNodeChainPanel, setShowNodeChainPanel] = React.useState(false);
    const [showRuntimeAlerts, setShowRuntimeAlerts] = React.useState(false);
    const [showFirstBootWizard, setShowFirstBootWizard] = React.useState(false);
    const [showSplitWorkspace, setShowSplitWorkspace] = React.useState(false);
    const [watchdogAlerts, setWatchdogAlerts] = React.useState([]);
    const [showScratchpad, setShowScratchpad] = React.useState(() => (
        typeof window !== 'undefined'
        && (window.location.pathname === '/scratchpad' || window.location.hash === '#/scratchpad')
    ));
    const [viewportWidth, setViewportWidth] = React.useState(() => (
        typeof window !== 'undefined' && Number.isFinite(window.innerWidth)
            ? window.innerWidth
            : DEFAULT_VIEWPORT_WIDTH
    ));
    const [showLeftRailOverlay, setShowLeftRailOverlay] = React.useState(false);
    const [showRightRailOverlay, setShowRightRailOverlay] = React.useState(false);
    const [railWidths, setRailWidths] = React.useState(() => readRailLayoutPrefs());
    const [railCollapsePrefs, setRailCollapsePrefs] = React.useState(() => readRailCollapsePrefs());
    const [showRailResizeHint, setShowRailResizeHint] = React.useState(() => {
        if (typeof window === 'undefined' || !window.localStorage) return false;
        return window.localStorage.getItem(RAIL_RESIZE_HINT_DISMISSED_KEY) !== '1';
    });
    const [lastFreeformPrompt, setLastFreeformPrompt] = React.useState('');
    const [sessionNameDraft, setSessionNameDraft] = React.useState(buildDefaultSessionName());
    const [sessionPassphraseDraft, setSessionPassphraseDraft] = React.useState('');
    const [sessionDialogError, setSessionDialogError] = React.useState('');
    const [showIssueAssist, setShowIssueAssist] = React.useState(false);
    const [showSuccessCapture, setShowSuccessCapture] = React.useState(false);
    const [supportBundleMeta, setSupportBundleMeta] = React.useState({
        outputPath: '',
        sha256: '',
    });
    const [showOnboarding, setShowOnboarding] = React.useState(() => {
        if (typeof window === 'undefined' || !window.localStorage) return false;
        const dismissed = window.localStorage.getItem(ONBOARDING_WIZARD_DISMISSED_KEY) === '1';
        return !dismissed && countOnboardingCompletedSteps() < 4;
    });
    const sessionNameInputRef = React.useRef(null);
    const sessionPassInputRef = React.useRef(null);
    const sessionCancelButtonRef = React.useRef(null);
    const sessionSubmitButtonRef = React.useRef(null);
    const lastFocusedElementRef = React.useRef(null);
    const sessionDialogTitleId = React.useId();
    const sessionDialogDescriptionId = React.useId();
    const messageSequenceRef = React.useRef(0);
    const proofSessionToMessageRef = React.useRef(new Map());
    const proofSessionMetaRef = React.useRef(new Map());
    const railResizeStateRef = React.useRef(null);
    const nodeChainEngineRef = React.useRef(null);
    const nodeChainRulesHashRef = React.useRef('');
    const watchdogSupervisorRef = React.useRef(null);
    const lastUpdateSignatureRef = React.useRef('');
    const lastIncidentEventIdRef = React.useRef('');
    const auditOnly = String(runtimeTier || '').toUpperCase() === 'AUDITOR';
    const capabilities = Array.isArray(runtimeCapabilityPayload.capabilities) ? runtimeCapabilityPayload.capabilities : [];
    const canUseOnboardingWizard = capabilities.includes('onboarding_wizard') || String(runtimeCapabilityPayload.tierId || '') === 'enterprise';
    const canUseIssueAssist = capabilities.includes('issue_assist');
    const tokensRemaining = React.useMemo(() => {
        const budget = 128000;
        const usedTokens = (Array.isArray(chatLog) ? chatLog : []).reduce((sum, entry) => {
            const content = String(entry && entry.content ? entry.content : '');
            return sum + Math.ceil(content.length / 4);
        }, 0);
        return Math.max(0, budget - usedTokens);
    }, [chatLog]);
    const collab = useCollabRoom(String(workflowId || 'default'));
    const collabPeerCount = React.useMemo(() => Object.keys(collab.remoteCursors || {}).length, [collab.remoteCursors]);
    const { runtimeState, refreshRuntimeState } = useRuntimeState({
        connectionInfo,
        workflowId: String(workflowId || ''),
        runtimeTier: String(runtimeTier || ''),
        sessionHydrationStatus: String(sessionHydrationStatus || ''),
        collabConnected: Boolean(collab.connected),
        collabRoomId: String(collab.roomId || 'default'),
        collabPeerCount,
    });
    const { events: runtimeEvents } = useEventFeed();
    const firstBoot = useFirstBoot();
    const fleet = useFleetState();
    const {
        steps: firstBootSteps,
        progress: firstBootProgress,
        open: firstBootOpen,
        busyStepId: firstBootBusyStepId,
        allDone: firstBootAllDone,
        completeStep: completeFirstBootStep,
        markSkipped: markFirstBootSkipped,
        runStep: runFirstBootCoreStep,
        dismiss: dismissFirstBoot,
        reopen: reopenFirstBoot,
        reset: resetFirstBoot,
    } = firstBoot;
    const unacknowledgedWatchdogAlerts = React.useMemo(() => (
        (Array.isArray(watchdogAlerts) ? watchdogAlerts : []).filter((entry) => !entry.acknowledged)
    ), [watchdogAlerts]);
    const watchdogStatus = React.useMemo(() => {
        if (!unacknowledgedWatchdogAlerts.length) {
            return String((runtimeState && runtimeState.watchdog && runtimeState.watchdog.status) || 'running');
        }
        if (unacknowledgedWatchdogAlerts.some((alert) => String(alert.severity || '') === 'critical')) {
            return 'fatal';
        }
        if (unacknowledgedWatchdogAlerts.some((alert) => (
            String(alert.severity || '') === 'degraded' || String(alert.severity || '') === 'warning'
        ))) {
            return 'degraded';
        }
        return 'running';
    }, [runtimeState, unacknowledgedWatchdogAlerts]);
    const latestProofStdout = React.useMemo(() => {
        const proofMessage = [...(Array.isArray(chatLog) ? chatLog : [])]
            .reverse()
            .find((entry) => Array.isArray(entry && entry.stdoutLines) && entry.stdoutLines.length);
        if (!proofMessage) return '';
        return proofMessage.stdoutLines.slice(-120).join('\n');
    }, [chatLog]);
    const previousCollabPeerCountRef = React.useRef(collabPeerCount);
    const layoutMode = React.useMemo(() => {
        if (viewportWidth >= EXPANDED_LAYOUT_MIN) return 'expanded';
        if (viewportWidth >= BALANCED_LAYOUT_MIN) return 'balanced';
        return 'focused';
    }, [viewportWidth]);
    const showInlineThreadRail = layoutMode !== 'focused';
    const showInlineWorkbenchRail = layoutMode === 'expanded';
    const canOpenThreadRailOverlay = layoutMode === 'focused';
    const canOpenWorkbenchRailOverlay = layoutMode !== 'expanded';
    const layoutModeLabel = layoutMode === 'focused'
        ? 'Focused Layout'
        : layoutMode === 'balanced'
            ? 'Balanced Layout'
            : 'Expanded Layout';
    const railCollapseForMode = railCollapsePrefs[layoutMode] || DEFAULT_RAIL_COLLAPSE_PREFS[layoutMode] || DEFAULT_RAIL_COLLAPSE_PREFS.expanded;
    const threadRailCollapsed = showInlineThreadRail && Boolean(railCollapseForMode.thread);
    const workbenchRailCollapsed = showInlineWorkbenchRail && Boolean(railCollapseForMode.workbench);
    const showInlineThreadRailPanel = showInlineThreadRail && !threadRailCollapsed;
    const showInlineWorkbenchRailPanel = showInlineWorkbenchRail && !workbenchRailCollapsed;
    const showThreadRailResizeHint = showRailResizeHint && showInlineThreadRailPanel;
    const activeRailPresetId = React.useMemo(() => {
        const matchingPreset = Object.entries(RAIL_SIZE_PRESETS).find(([, preset]) => {
            const presetThread = clampRailWidth(preset.thread, THREAD_RAIL_MIN_WIDTH, THREAD_RAIL_MAX_WIDTH);
            const presetWorkbench = clampRailWidth(preset.workbench, WORKBENCH_RAIL_MIN_WIDTH, WORKBENCH_RAIL_MAX_WIDTH);
            return presetThread === railWidths.thread && presetWorkbench === railWidths.workbench;
        });
        return matchingPreset ? matchingPreset[0] : '';
    }, [railWidths.thread, railWidths.workbench]);
    const inlineThreadRailMaxWidth = React.useMemo(() => {
        const viewportCap = Math.floor(viewportWidth * (layoutMode === 'expanded' ? 0.34 : 0.42));
        return clampRailWidth(viewportCap, THREAD_RAIL_MIN_WIDTH, THREAD_RAIL_MAX_WIDTH);
    }, [layoutMode, viewportWidth]);
    const inlineWorkbenchRailMaxWidth = React.useMemo(() => {
        const viewportCap = Math.floor(viewportWidth * 0.34);
        return clampRailWidth(viewportCap, WORKBENCH_RAIL_MIN_WIDTH, WORKBENCH_RAIL_MAX_WIDTH);
    }, [viewportWidth]);
    const overlayThreadRailWidth = React.useMemo(() => (
        clampRailWidth(
            railWidths.thread,
            THREAD_RAIL_MIN_WIDTH,
            Math.min(THREAD_RAIL_MAX_WIDTH, viewportWidth - OVERLAY_RAIL_MARGIN),
        )
    ), [railWidths.thread, viewportWidth]);
    const overlayWorkbenchRailWidth = React.useMemo(() => (
        clampRailWidth(
            railWidths.workbench,
            WORKBENCH_RAIL_MIN_WIDTH,
            Math.min(WORKBENCH_RAIL_MAX_WIDTH, viewportWidth - OVERLAY_RAIL_MARGIN),
        )
    ), [railWidths.workbench, viewportWidth]);
    const inlineThreadRailWidth = React.useMemo(() => (
        clampRailWidth(
            railWidths.thread,
            THREAD_RAIL_MIN_WIDTH,
            inlineThreadRailMaxWidth,
        )
    ), [inlineThreadRailMaxWidth, railWidths.thread]);
    const inlineWorkbenchRailWidth = React.useMemo(() => (
        clampRailWidth(
            railWidths.workbench,
            WORKBENCH_RAIL_MIN_WIDTH,
            inlineWorkbenchRailMaxWidth,
        )
    ), [inlineWorkbenchRailMaxWidth, railWidths.workbench]);

    React.useEffect(() => {
        const handleResize = () => {
            const nextWidth = Number.isFinite(window.innerWidth)
                ? window.innerWidth
                : DEFAULT_VIEWPORT_WIDTH;
            setViewportWidth(nextWidth);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    React.useEffect(() => {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.setItem(APPLIANCE_MODE_KEY, applianceModeEnabled ? '1' : '0');
    }, [applianceModeEnabled]);

    React.useEffect(() => {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.setItem(AIRGAP_MODE_KEY, airGapLocked ? '1' : '0');
    }, [airGapLocked]);

    React.useEffect(() => {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.setItem(DEMO_MODE_KEY, demoModeEnabled ? '1' : '0');
    }, [demoModeEnabled]);

    React.useEffect(() => {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.setItem(RUNTIME_ROLE_KEY, String(activeRuntimeRole || 'operator'));
    }, [activeRuntimeRole]);

    React.useEffect(() => {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(Array.isArray(incidents) ? incidents : []));
    }, [incidents]);

    React.useEffect(() => {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.setItem(POLICY_ROLLOUT_HISTORY_KEY, JSON.stringify(Array.isArray(policyRolloutHistory) ? policyRolloutHistory : []));
    }, [policyRolloutHistory]);

    React.useEffect(() => {
        if (layoutMode !== 'focused' && showLeftRailOverlay) {
            setShowLeftRailOverlay(false);
        }
        if (layoutMode === 'expanded' && showRightRailOverlay) {
            setShowRightRailOverlay(false);
        }
    }, [layoutMode, showLeftRailOverlay, showRightRailOverlay]);

    React.useEffect(() => {
        if (typeof window === 'undefined' || !window.localStorage) return;
        try {
            window.localStorage.setItem(RAIL_LAYOUT_PREFS_KEY, JSON.stringify({
                thread: clampRailWidth(
                    railWidths.thread,
                    THREAD_RAIL_MIN_WIDTH,
                    THREAD_RAIL_MAX_WIDTH,
                ),
                workbench: clampRailWidth(
                    railWidths.workbench,
                    WORKBENCH_RAIL_MIN_WIDTH,
                    WORKBENCH_RAIL_MAX_WIDTH,
                ),
            }));
        } catch {
            // ignore storage failures for non-critical layout preference writes
        }
    }, [railWidths.thread, railWidths.workbench]);

    React.useEffect(() => {
        if (typeof window === 'undefined' || !window.localStorage) return;
        try {
            window.localStorage.setItem(RAIL_COLLAPSE_PREFS_KEY, JSON.stringify({
                expanded: {
                    thread: Boolean(railCollapsePrefs.expanded && railCollapsePrefs.expanded.thread),
                    workbench: Boolean(railCollapsePrefs.expanded && railCollapsePrefs.expanded.workbench),
                },
                balanced: {
                    thread: Boolean(railCollapsePrefs.balanced && railCollapsePrefs.balanced.thread),
                    workbench: Boolean(railCollapsePrefs.balanced && railCollapsePrefs.balanced.workbench),
                },
                focused: {
                    thread: Boolean(railCollapsePrefs.focused && railCollapsePrefs.focused.thread),
                    workbench: Boolean(railCollapsePrefs.focused && railCollapsePrefs.focused.workbench),
                },
            }));
        } catch {
            // ignore storage failures for non-critical collapse preference writes
        }
    }, [railCollapsePrefs]);

    const nextMessageId = React.useCallback(() => {
        messageSequenceRef.current += 1;
        return `msg-${Date.now()}-${messageSequenceRef.current}`;
    }, []);

    const appendKernelMessage = React.useCallback((content, extra = {}) => {
        const id = nextMessageId();
        appendChat({
            id,
            role: 'kernel',
            content: String(content || ''),
            ...extra,
        });
        return id;
    }, [appendChat, nextMessageId]);

    const updateMessageStdout = React.useCallback((messageId, patch) => {
        const safeId = String(messageId || '').trim();
        if (!safeId) return;
        const payload = patch && typeof patch === 'object' ? patch : {};
        setChatLog((prev) => (Array.isArray(prev) ? prev.map((entry) => {
            if (String(entry && entry.id ? entry.id : '') !== safeId) return entry;
            const lines = Array.isArray(entry.stdoutLines) ? [...entry.stdoutLines] : [];
            const nextLine = String(payload.line || '').trim();
            if (nextLine) {
                lines.push(nextLine);
            }
            return {
                ...entry,
                stdoutLines: lines.slice(-240),
                stdoutDone: Boolean(payload.done) || Boolean(entry.stdoutDone),
            };
        }) : prev));
    }, [setChatLog]);

    const launchStdoutStream = React.useCallback(async (command, messageId) => {
        if (!(window.api && window.api.proof && typeof window.api.proof.exec === 'function')) {
            return;
        }
        try {
            const response = await window.api.proof.exec({ command });
            const sessionId = String(response && response.sessionId ? response.sessionId : '').trim();
            if (!sessionId) return;
            proofSessionToMessageRef.current.set(sessionId, String(messageId || '').trim());
            proofSessionMetaRef.current.set(sessionId, {
                command: String(command || '').trim().toLowerCase(),
                messageId: String(messageId || '').trim(),
            });
        } catch (err) {
            updateMessageStdout(messageId, {
                line: `[${command}] stream failed: ${err && err.message ? err.message : String(err)}`,
                done: true,
            });
        }
    }, [updateMessageStdout]);

    const refreshRuntimeContext = React.useCallback(async () => {
        let loaded = false;
        try {
            const [settings, stateSnapshot, health] = await Promise.all([
                window.api?.settings?.get ? window.api.settings.get() : Promise.resolve({}),
                window.api?.state?.get ? window.api.state.get() : Promise.resolve({}),
                window.api?.llm?.health ? window.api.llm.health().catch(() => null) : Promise.resolve(null),
            ]);
            loaded = true;
            setRuntimeTier(String((settings && settings.tier) || 'PREVIEW').toUpperCase());
            setRuntimeCapabilityPayload({
                tierId: String((settings && settings.tierId) || 'free'),
                tierLabel: String((settings && settings.tierLabel) || 'Audit-Only'),
                capabilities: Array.isArray(settings && settings.capabilities) ? settings.capabilities : [],
            });
            setConnectionInfo({
                provider: String((settings && settings.provider) || (health && health.provider) || 'ollama'),
                baseUrl: String((settings && settings.ollamaBaseUrl) || (health && health.baseUrl) || ''),
                model: String((stateSnapshot && stateSnapshot.model) || (health && health.model) || model || 'llama3'),
                allowRemoteBridge: Boolean(settings && settings.allowRemoteBridge),
                health: health && health.ok ? 'online' : health ? 'offline' : 'unknown',
                reason: health && !health.ok ? String(health.reason || 'Bridge unavailable') : '',
            });
        } catch {
            // keep existing runtime context on transient failures
        } finally {
            if (loaded) {
                setRuntimeContextLoaded(true);
            }
        }
    }, [model]);

    React.useEffect(() => {
        refreshRuntimeContext();
    }, [refreshRuntimeContext]);

    React.useEffect(() => {
        let mounted = true;
        const refreshAccel = async () => {
            try {
                if (!(window.api && window.api.accel && typeof window.api.accel.status === 'function')) return;
                const status = await window.api.accel.status();
                if (!mounted) return;
                setAccelStatus(status && typeof status === 'object'
                    ? {
                        enabled: Boolean(status.enabled),
                        backend: String(status.backend || 'cpu'),
                        device: String(status.device || ''),
                    }
                    : { enabled: false, backend: 'cpu', device: '' });
            } catch {
                // ignore transient status probes
            }
        };
        refreshAccel();
        const timer = window.setInterval(refreshAccel, 20000);
        return () => {
            mounted = false;
            window.clearInterval(timer);
        };
    }, []);

    React.useEffect(() => {
        const interval = window.setInterval(() => {
            refreshRuntimeContext();
        }, 12000);
        return () => {
            window.clearInterval(interval);
        };
    }, [refreshRuntimeContext]);

    React.useEffect(() => {
        if (!runtimeContextLoaded) return;
        if (canUseOnboardingWizard) return;
        if (showOnboarding) {
            setShowOnboarding(false);
        }
    }, [canUseOnboardingWizard, runtimeContextLoaded, showOnboarding]);

    React.useEffect(() => {
        if (!(window.api && window.api.proof && typeof window.api.proof.onStdout === 'function')) {
            return undefined;
        }
        return window.api.proof.onStdout((payload) => {
            const data = payload && typeof payload === 'object' ? payload : {};
            const sessionId = String(data.sessionId || '').trim();
            if (!sessionId) return;
            const messageId = proofSessionToMessageRef.current.get(sessionId);
            const meta = proofSessionMetaRef.current.get(sessionId);
            if (!messageId) return;
            updateMessageStdout(messageId, {
                line: String(data.line || ''),
                done: Boolean(data.done),
            });
            if (data.done) {
                proofSessionToMessageRef.current.delete(sessionId);
                proofSessionMetaRef.current.delete(sessionId);
                if (meta && String(meta.command || '') === 'proof') {
                    appendRuntimeEvent('proof.passed', {
                        messageId: String(meta.messageId || ''),
                        sessionId,
                    }, { source: 'proof', severity: 'info' });
                    if (typeof window !== 'undefined' && window.localStorage) {
                        window.localStorage.setItem('neuralshell_proof_last_status_v1', 'passed');
                        window.localStorage.setItem('neuralshell_proof_stage_v1', 'complete');
                    }
                }
            }
        });
    }, [updateMessageStdout]);

    React.useEffect(() => {
        const onSupportBundleExported = (event) => {
            const detail = event && event.detail && typeof event.detail === 'object' ? event.detail : {};
            setSupportBundleMeta({
                outputPath: String(detail.outputPath || ''),
                sha256: String(detail.sha256 || ''),
            });
        };
        window.addEventListener('neuralshell:support-bundle-exported', onSupportBundleExported);
        return () => {
            window.removeEventListener('neuralshell:support-bundle-exported', onSupportBundleExported);
        };
    }, []);

    React.useEffect(() => {
        if (!runtimeContextLoaded || !firstBootOpen) return;
        if (typeof window === 'undefined' || !window.localStorage) return;
        if (window.localStorage.getItem(ONBOARDING_WIZARD_DISMISSED_KEY) === '1') {
            dismissFirstBoot();
        }
    }, [dismissFirstBoot, firstBootOpen, runtimeContextLoaded]);

    React.useEffect(() => {
        const previous = Number(previousCollabPeerCountRef.current || 0);
        const next = Number(collabPeerCount || 0);
        if (next > previous) {
            appendRuntimeEvent('collab.peer.joined', {
                roomId: String(collab.roomId || 'default'),
                peerCount: next,
            }, { source: 'collab', severity: 'info' });
        } else if (next < previous) {
            appendRuntimeEvent('collab.peer.left', {
                roomId: String(collab.roomId || 'default'),
                peerCount: next,
            }, { source: 'collab', severity: 'warning' });
        }
        previousCollabPeerCountRef.current = next;
    }, [collab.roomId, collabPeerCount]);

    React.useEffect(() => {
        if (!(runtimeState && runtimeState.updateLane)) return;
        const signatureState = String(runtimeState.updateLane.signatureState || '').toLowerCase();
        if (signatureState === lastUpdateSignatureRef.current) return;
        lastUpdateSignatureRef.current = signatureState;
        if (signatureState === 'verified' || signatureState === 'unknown') return;
        appendRuntimeEvent('update.verification.failed', {
            signatureState,
            stagedUpdateAvailable: Boolean(runtimeState.updateLane.stagedUpdateAvailable),
        }, { source: 'update-lane', severity: 'critical' });
    }, [runtimeState]);

    React.useEffect(() => {
        const latest = Array.isArray(runtimeEvents) && runtimeEvents.length ? runtimeEvents[runtimeEvents.length - 1] : null;
        if (!latest || !latest.id) return;
        if (String(lastIncidentEventIdRef.current || '') === String(latest.id)) return;
        lastIncidentEventIdRef.current = String(latest.id);
        setIncidents((prev) => {
            const safe = Array.isArray(prev) ? prev : [];
            return safe.map((incident) => {
                if (String(incident && incident.status ? incident.status : '') !== 'open') return incident;
                const timeline = Array.isArray(incident.timeline) ? incident.timeline : [];
                return {
                    ...incident,
                    timeline: [...timeline, {
                        at: String(latest.at || new Date().toISOString()),
                        type: String(latest.type || 'runtime.event'),
                        source: String(latest.source || 'runtime'),
                        detail: latest.payload && typeof latest.payload === 'object' ? latest.payload : {},
                    }].slice(-400),
                };
            });
        });
    }, [runtimeEvents]);

    const openRuntimePanelById = React.useCallback((panelId) => {
        const safePanel = String(panelId || '').trim().toLowerCase();
        if (safePanel === 'mission' || safePanel === 'mission-control') {
            setShowMissionControl(true);
            return;
        }
        if (safePanel === 'demo' || safePanel === 'demo-flow' || safePanel === 'demo_flow') {
            setShowDemoFlow(true);
            return;
        }
        if (safePanel === 'fleet' || safePanel === 'fleet-control') {
            if (!roleCapabilities.canManageFleet) {
                appendRuntimeEvent('role.access.denied', { panel: safePanel, role: activeRuntimeRole }, { source: 'roles', severity: 'warning' });
                return;
            }
            setShowFleetControl(true);
            return;
        }
        if (safePanel === 'recovery' || safePanel === 'recovery-center') {
            if (!roleCapabilities.canRunRecovery) {
                appendRuntimeEvent('role.access.denied', { panel: safePanel, role: activeRuntimeRole }, { source: 'roles', severity: 'warning' });
                return;
            }
            setShowRecoveryCenter(true);
            return;
        }
        if (safePanel === 'appliance' || safePanel === 'appliance-console') {
            if (!roleCapabilities.canManageAppliance) {
                appendRuntimeEvent('role.access.denied', { panel: safePanel, role: activeRuntimeRole }, { source: 'roles', severity: 'warning' });
                return;
            }
            setShowApplianceConsole(true);
            return;
        }
        if (safePanel === 'airgap' || safePanel === 'air-gap' || safePanel === 'airgap-operations') {
            setShowAirGapOperations(true);
            return;
        }
        if (safePanel === 'trust' || safePanel === 'trust-fabric' || safePanel === 'pki') {
            setShowTrustFabric(true);
            return;
        }
        if (safePanel === 'hardware' || safePanel === 'hardware-appliance') {
            setShowHardwareAppliance(true);
            return;
        }
        if (safePanel === 'courier' || safePanel === 'courier-transfer') {
            setShowCourierTransfer(true);
            return;
        }
        if (safePanel === 'continuity' || safePanel === 'continuity-drills') {
            setShowContinuityDrills(true);
            return;
        }
        if (safePanel === 'procurement' || safePanel === 'procurement-command') {
            setShowProcurementCommand(true);
            return;
        }
        if (safePanel === 'tamper' || safePanel === 'tamper-simulation') {
            setShowTamperSimulation(true);
            return;
        }
        if (safePanel === 'institutional' || safePanel === 'institutional-command') {
            setShowInstitutionalCommand(true);
            return;
        }
        if (safePanel === 'deployment' || safePanel === 'deployment-program' || safePanel === 'deployment_program') {
            setShowDeploymentProgram(true);
            return;
        }
        if (safePanel === 'training' || safePanel === 'training-delivery' || safePanel === 'training_delivery') {
            setShowTrainingDelivery(true);
            return;
        }
        if (safePanel === 'support' || safePanel === 'support-ops' || safePanel === 'support_ops') {
            setShowSupportOps(true);
            return;
        }
        if (safePanel === 'buyer' || safePanel === 'buyer-journey' || safePanel === 'buyer_journey') {
            setShowBuyerJourney(true);
            return;
        }
        if (safePanel === 'pilot' || safePanel === 'pilot-conversion' || safePanel === 'pilot_conversion') {
            setShowPilotConversion(true);
            return;
        }
        if (safePanel === 'commercial' || safePanel === 'commercial-packages' || safePanel === 'commercial_packages') {
            setShowCommercialPackages(true);
            return;
        }
        if (safePanel === 'launch' || safePanel === 'field-launch' || safePanel === 'field_launch') {
            setShowFieldLaunch(true);
            return;
        }
        if (safePanel === 'partner' || safePanel === 'partner-rollout' || safePanel === 'partner_rollout') {
            setShowPartnerRollout(true);
            return;
        }
        if (safePanel === 'buyerops' || safePanel === 'buyer-ops' || safePanel === 'buyer_ops') {
            setShowBuyerOps(true);
            return;
        }
        if (safePanel === 'demotopilot' || safePanel === 'demo-to-pilot' || safePanel === 'demo_to_pilot') {
            setShowDemoToPilot(true);
            return;
        }
        if (safePanel === 'expansion' || safePanel === 'pilot-expansion' || safePanel === 'pilot_expansion') {
            setShowPilotExpansion(true);
            return;
        }
        if (safePanel === 'renewal' || safePanel === 'renewal-risk' || safePanel === 'renewal_risk') {
            setShowRenewalRisk(true);
            return;
        }
        if (safePanel === 'launchweek' || safePanel === 'launch-week' || safePanel === 'launch_week') {
            setShowLaunchWeek(true);
            return;
        }
        if (safePanel === 'followup' || safePanel === 'followup-generator' || safePanel === 'followup_generator') {
            setShowFollowupGenerator(true);
            return;
        }
        if (safePanel === 'feedback' || safePanel === 'field-feedback' || safePanel === 'field_feedback') {
            setShowFieldFeedback(true);
            return;
        }
        if (safePanel === 'partner-certification' || safePanel === 'partner_certification') {
            setShowPartnerCertification(true);
            return;
        }
        if (safePanel === 'managed-services' || safePanel === 'managed_services') {
            setShowManagedServices(true);
            return;
        }
        if (safePanel === 'strategic-account' || safePanel === 'strategic_account') {
            setShowStrategicAccount(true);
            return;
        }
        if (safePanel === 'portfolio-rollout' || safePanel === 'portfolio_rollout') {
            setShowPortfolioRollout(true);
            return;
        }
        if (safePanel === 'revenue-ops' || safePanel === 'revenue_ops') {
            setShowRevenueOps(true);
            return;
        }
        if (safePanel === 'channel-expansion' || safePanel === 'channel_expansion') {
            setShowChannelExpansion(true);
            return;
        }
        if (safePanel === 'cross-account-renewal' || safePanel === 'cross_account_renewal') {
            setShowCrossAccountRenewal(true);
            return;
        }
        if (safePanel === 'executive-scale' || safePanel === 'executive_scale') {
            setShowExecutiveScale(true);
            return;
        }
        if (safePanel === 'ecosystem-portfolio' || safePanel === 'ecosystem_portfolio') {
            setShowEcosystemPortfolio(true);
            return;
        }
        if (safePanel === 'service-line' || safePanel === 'service_line') {
            setShowServiceLine(true);
            return;
        }
        if (safePanel === 'partner-network-governance' || safePanel === 'partner_network_governance') {
            setShowPartnerNetworkGovernance(true);
            return;
        }
        if (safePanel === 'global-planning' || safePanel === 'global_planning') {
            setShowGlobalPlanning(true);
            return;
        }
        if (safePanel === 'ecosystem-revenue' || safePanel === 'ecosystem_revenue') {
            setShowEcosystemRevenue(true);
            return;
        }
        if (safePanel === 'board-operating-pack' || safePanel === 'board_operating_pack') {
            setShowBoardOperatingPack(true);
            return;
        }
        if (safePanel === 'licensed-operator' || safePanel === 'licensed_operator') {
            setShowLicensedOperator(true);
            return;
        }
        if (safePanel === 'ecosystem-command' || safePanel === 'ecosystem_command') {
            setShowEcosystemCommand(true);
            return;
        }
        if (safePanel === 'shift' || safePanel === 'shift-console') {
            setShowShiftConsole(true);
            return;
        }
        if (safePanel === 'incident' || safePanel === 'incident-mode') {
            if (!roleCapabilities.canDeclareIncidents) {
                appendRuntimeEvent('role.access.denied', { panel: safePanel, role: activeRuntimeRole }, { source: 'roles', severity: 'warning' });
                return;
            }
            setShowIncidentMode(true);
            return;
        }
        if (safePanel === 'policy-rollout' || safePanel === 'rollout') {
            if (!roleCapabilities.canRunPolicyRollouts) {
                appendRuntimeEvent('role.access.denied', { panel: safePanel, role: activeRuntimeRole }, { source: 'roles', severity: 'warning' });
                return;
            }
            setShowPolicyRollout(true);
            return;
        }
        if (safePanel === 'update-packs' || safePanel === 'offline-updates') {
            setShowOfflineUpdateConsole(true);
            return;
        }
        if (safePanel === 'missions' || safePanel === 'mission-scheduler') {
            setShowMissionScheduler(true);
            return;
        }
        if (safePanel === 'watchdog') {
            setShowRuntimeAlerts(true);
            return;
        }
        if (safePanel === 'nodechain') {
            setShowNodeChainPanel(true);
            return;
        }
        if (safePanel === 'firstboot' || safePanel === 'first-boot') {
            reopenFirstBoot();
            setShowFirstBootWizard(true);
            return;
        }
        if (safePanel === 'split' || safePanel === 'split-workspace') {
            setShowSplitWorkspace(true);
            return;
        }
        if (safePanel === 'settings') {
            openSettings();
        }
    }, [activeRuntimeRole, openSettings, reopenFirstBoot, roleCapabilities]);

    const triggerNodeChainSnapshot = React.useCallback(async () => {
        appendRuntimeEvent('runtime.snapshot.requested', {
            source: 'nodechain',
        }, { source: 'snapshots', severity: 'info' });
    }, []);

    const nodeChainHandlers = React.useMemo(() => ({
        showAlert: async (payload) => {
            const safePayload = payload && typeof payload === 'object' ? payload : {};
            appendRuntimeEvent('runtime.watchdog.alert', safePayload, {
                source: 'nodechain',
                severity: String(safePayload.severity || 'warning').toLowerCase(),
            });
        },
        openPanel: async (payload) => {
            const panel = String(payload && payload.panel ? payload.panel : '');
            openRuntimePanelById(panel);
        },
        shareProofBadge: async () => {
            if (!(window.api && window.api.system && typeof window.api.system.openExternal === 'function')) return;
            await window.api.system.openExternal('https://raw.githubusercontent.com/Z3r0DayZion-install/NeuralShell/main/assets/proof_badge.svg');
        },
        snapshotState: async () => {
            await triggerNodeChainSnapshot();
        },
        disableRelay: async () => {
            if (!(window.api && window.api.settings && typeof window.api.settings.get === 'function')) return;
            const current = await window.api.settings.get();
            await window.api.settings.update({
                ...(current || {}),
                proofRelayEnabled: false,
            });
            appendRuntimeEvent('relay.failed', { reason: 'NodeChain disabled relay path after failures.' }, { source: 'relay', severity: 'degraded' });
            await refreshRuntimeContext();
            await refreshRuntimeState();
        },
        blockUpdateApply: async () => {
            if (window.api && window.api.autoUpdate && typeof window.api.autoUpdate.setPolicy === 'function') {
                await window.api.autoUpdate.setPolicy({ autoApply: false, blockedBy: 'nodechain' });
            }
        },
        promptVaultSave: async () => {
            window.dispatchEvent(new window.CustomEvent('neuralshell:prompt-vault-save'));
        },
        writeAuditLog: async (payload) => {
            if (window.api && window.api.logger && typeof window.api.logger.log === 'function') {
                await window.api.logger.log('info', 'nodechain-action', payload || {});
            }
        },
        switchSafePolicy: async () => {
            if (!(window.api && window.api.settings && typeof window.api.settings.get === 'function')) return;
            const current = await window.api.settings.get();
            await window.api.settings.update({
                ...(current || {}),
                offlineOnlyEnforced: true,
                allowRemoteBridge: false,
                autoUpdateChannel: 'frozen',
            });
            await refreshRuntimeContext();
            await refreshRuntimeState();
        },
        runLocalScript: async (payload) => {
            if (!(window.api && window.api.command && typeof window.api.command.run === 'function')) return;
            const commandId = String(payload && payload.commandId ? payload.commandId : '').trim();
            const args = Array.isArray(payload && payload.args) ? payload.args : [];
            await window.api.command.run(commandId, args);
        },
    }), [openRuntimePanelById, refreshRuntimeContext, refreshRuntimeState, triggerNodeChainSnapshot]);

    React.useEffect(() => {
        const rules = loadNodeChainRules();
        const rulesHash = JSON.stringify(rules || []);
        const engine = new NodeChainEngine(rules, nodeChainHandlers, NODECHAIN_ALLOWLIST);
        nodeChainEngineRef.current = engine;
        nodeChainRulesHashRef.current = rulesHash;
        engine.start();
        const unsubscribe = onRuntimeEvent((event) => {
            const latestRules = loadNodeChainRules();
            const latestHash = JSON.stringify(latestRules || []);
            if (latestHash !== nodeChainRulesHashRef.current) {
                nodeChainRulesHashRef.current = latestHash;
                engine.setRules(latestRules);
            }
            engine.dispatch({
                type: String(event && event.type ? event.type : ''),
                at: String(event && event.at ? event.at : new Date().toISOString()),
                payload: event && event.payload && typeof event.payload === 'object' ? event.payload : {},
            }, false).then((logs) => {
                if (!Array.isArray(logs) || !logs.length) return;
                const failed = logs.some((entry) => String(entry.status || '') === 'failed');
                appendRuntimeEvent('nodechain.rule.executed', {
                    eventType: String(event && event.type ? event.type : ''),
                    runs: logs.length,
                    failed,
                }, { source: 'nodechain', severity: failed ? 'warning' : 'info' });
            }).catch(() => undefined);
        });
        return () => {
            unsubscribe();
            engine.stop();
            nodeChainEngineRef.current = null;
            nodeChainRulesHashRef.current = '';
        };
    }, [nodeChainHandlers]);

    React.useEffect(() => {
        if (!watchdogSupervisorRef.current) {
            watchdogSupervisorRef.current = new RuntimeWatchdogSupervisor({
                retryProviderProbe: async () => {
                    await refreshRuntimeContext();
                    await refreshRuntimeState();
                },
                disableRelayPath: async () => {
                    if (!(window.api && window.api.settings && typeof window.api.settings.get === 'function')) return;
                    const current = await window.api.settings.get();
                    await window.api.settings.update({
                        ...(current || {}),
                        proofRelayEnabled: false,
                    });
                    await refreshRuntimeContext();
                    await refreshRuntimeState();
                },
                freezeUpdateLane: async () => {
                    if (window.api && window.api.autoUpdate && typeof window.api.autoUpdate.setPolicy === 'function') {
                        await window.api.autoUpdate.setPolicy({ autoApply: false, frozenBy: 'watchdog' });
                    }
                },
                switchSafePolicy: async () => {
                    if (!(window.api && window.api.settings && typeof window.api.settings.get === 'function')) return;
                    const current = await window.api.settings.get();
                    await window.api.settings.update({
                        ...(current || {}),
                        allowRemoteBridge: false,
                        offlineOnlyEnforced: true,
                        autoUpdateChannel: 'frozen',
                    });
                    await refreshRuntimeContext();
                    await refreshRuntimeState();
                },
                onAlert: (alert) => {
                    appendRuntimeEvent('runtime.watchdog.alert', {
                        source: alert.source,
                        message: alert.message,
                        suggestedAction: alert.suggestedAction,
                    }, { source: 'watchdog', severity: alert.severity });
                },
            });
        }
        const supervisor = watchdogSupervisorRef.current;
        if (!supervisor || !(runtimeState && runtimeState.providerHealth)) return;
        supervisor.evaluate({
            providerHealth: {
                online: Boolean(runtimeState.providerHealth.online),
                activeProvider: String(runtimeState.providerHealth.activeProvider || 'ollama'),
                model: String(runtimeState.providerHealth.model || 'llama3'),
            },
            relayState: {
                enabled: Boolean(runtimeState.relayState && runtimeState.relayState.enabled),
                relayError: String(runtimeState.relayState && runtimeState.relayState.relayError ? runtimeState.relayState.relayError : ''),
            },
            updateLane: {
                signatureState: String(runtimeState.updateLane && runtimeState.updateLane.signatureState ? runtimeState.updateLane.signatureState : 'unknown'),
                stagedUpdateAvailable: Boolean(runtimeState.updateLane && runtimeState.updateLane.stagedUpdateAvailable),
            },
            vaultState: {
                locked: Boolean(runtimeState.vaultState && runtimeState.vaultState.locked),
                exportImportStatus: String(runtimeState.vaultState && runtimeState.vaultState.exportImportStatus ? runtimeState.vaultState.exportImportStatus : 'idle'),
            },
        }).then((alerts) => {
            setWatchdogAlerts(Array.isArray(alerts) ? alerts : []);
        }).catch(() => undefined);
    }, [refreshRuntimeContext, refreshRuntimeState, runtimeState]);

    React.useEffect(() => {
        const onPromptVaultSave = () => {
            appendChat({
                id: nextMessageId(),
                role: 'kernel',
                content: 'NodeChain prompted a vault save. Open Settings > Vault to seal the current runtime state.',
            });
        };
        window.addEventListener('neuralshell:prompt-vault-save', onPromptVaultSave);
        return () => {
            window.removeEventListener('neuralshell:prompt-vault-save', onPromptVaultSave);
        };
    }, [appendChat, nextMessageId]);

    const openCreateDialog = React.useCallback(() => {
        if (auditOnly) {
            appendChat({
                role: 'kernel',
                content: 'Audit-only mode is active. Session creation is disabled in this runtime.',
            });
            return;
        }
        setSessionDialog({
            open: true,
            mode: 'create',
            targetSession: '',
        });
        setSessionNameDraft(buildDefaultSessionName());
        setSessionPassphraseDraft('');
        setSessionDialogError('');
    }, [appendChat, auditOnly]);

    const openUnlockDialog = React.useCallback((sessionName) => {
        setSessionDialog({
            open: true,
            mode: 'unlock',
            targetSession: String(sessionName || ''),
        });
        setSessionPassphraseDraft('');
        setSessionDialogError('');
    }, []);

    const closeSessionDialog = React.useCallback(() => {
        setSessionDialog({
            open: false,
            mode: 'create',
            targetSession: '',
        });
        setSessionDialogError('');
    }, []);

    React.useEffect(() => {
        if (!sessionDialog.open) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        if (document.activeElement && typeof document.activeElement.focus === 'function') {
            lastFocusedElementRef.current = document.activeElement;
        }

        const focusTarget = sessionDialog.mode === 'create'
            ? sessionNameInputRef.current
            : sessionPassInputRef.current;
        if (focusTarget && typeof focusTarget.focus === 'function') {
            focusTarget.focus();
        }

        const trapFocus = (event) => {
            if (event.key !== 'Tab') return;

            const focusable = [
                sessionNameInputRef.current,
                sessionPassInputRef.current,
                sessionCancelButtonRef.current,
                sessionSubmitButtonRef.current,
            ].filter((node) => node && !node.disabled);

            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement;

            if (event.shiftKey) {
                if (active === first || !focusable.includes(active)) {
                    event.preventDefault();
                    last.focus();
                }
                return;
            }

            if (active === last || !focusable.includes(active)) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', trapFocus);
        return () => {
            document.removeEventListener('keydown', trapFocus);
            document.body.style.overflow = previousOverflow;
            const previous = lastFocusedElementRef.current;
            if (previous && typeof previous.focus === 'function') {
                previous.focus();
            }
            lastFocusedElementRef.current = null;
        };
    }, [sessionDialog.open, sessionDialog.mode]);

    // Keyboard handler
    React.useEffect(() => {
        const handleKey = (e) => {
            const active = document.activeElement;
            const activeTag = active && active.tagName ? String(active.tagName).toLowerCase() : '';
            const isTypingTarget = Boolean(
                active
                && (
                    activeTag === 'input'
                    || activeTag === 'textarea'
                    || active.isContentEditable
                    || (active.dataset && (active.dataset.testid === 'chat-input' || active.dataset.testid === 'slash-palette-input'))
                )
            );

            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                if (isTypingTarget) {
                    return;
                }
                e.preventDefault();
                togglePalette();
            }

            const isRailResizeHotkey = e.altKey && (e.code === 'BracketLeft' || e.code === 'BracketRight');
            if (isRailResizeHotkey && !isTypingTarget) {
                const step = e.code === 'BracketLeft' ? -KEYBOARD_RAIL_NUDGE_STEP : KEYBOARD_RAIL_NUDGE_STEP;
                const targetRail = e.shiftKey ? 'workbench' : 'thread';
                const railIsAvailable = targetRail === 'workbench'
                    ? (showInlineWorkbenchRail || canOpenWorkbenchRailOverlay)
                    : (showInlineThreadRail || canOpenThreadRailOverlay);
                if (railIsAvailable) {
                    e.preventDefault();
                    setRailWidths((prev) => {
                        const minWidth = targetRail === 'workbench' ? WORKBENCH_RAIL_MIN_WIDTH : THREAD_RAIL_MIN_WIDTH;
                        const maxWidth = targetRail === 'workbench' ? WORKBENCH_RAIL_MAX_WIDTH : THREAD_RAIL_MAX_WIDTH;
                        const currentWidth = Number.isFinite(Number(prev[targetRail]))
                            ? Number(prev[targetRail])
                            : (targetRail === 'workbench' ? DEFAULT_WORKBENCH_RAIL_WIDTH : DEFAULT_THREAD_RAIL_WIDTH);
                        const nextWidth = clampRailWidth(currentWidth + step, minWidth, maxWidth);
                        if (nextWidth === prev[targetRail]) return prev;
                        return {
                            ...prev,
                            [targetRail]: nextWidth,
                        };
                    });
                }
            }

            if (e.key === 'Escape') {
                closePalette();
                closeSettings();
                if (showEcosystem) {
                    setShowEcosystem(false);
                }
                if (showMissionControl) {
                    setShowMissionControl(false);
                }
                if (showFleetControl) {
                    setShowFleetControl(false);
                }
                if (showRecoveryCenter) {
                    setShowRecoveryCenter(false);
                }
                if (showApplianceConsole) {
                    setShowApplianceConsole(false);
                }
                if (showAirGapOperations) {
                    setShowAirGapOperations(false);
                }
                if (showTrustFabric) {
                    setShowTrustFabric(false);
                }
                if (showHardwareAppliance) {
                    setShowHardwareAppliance(false);
                }
                if (showCourierTransfer) {
                    setShowCourierTransfer(false);
                }
                if (showContinuityDrills) {
                    setShowContinuityDrills(false);
                }
                if (showProcurementCommand) {
                    setShowProcurementCommand(false);
                }
                if (showTamperSimulation) {
                    setShowTamperSimulation(false);
                }
                if (showInstitutionalCommand) {
                    setShowInstitutionalCommand(false);
                }
                if (showDemoFlow) {
                    setShowDemoFlow(false);
                }
                if (showDeploymentProgram) {
                    setShowDeploymentProgram(false);
                }
                if (showTrainingDelivery) {
                    setShowTrainingDelivery(false);
                }
                if (showSupportOps) {
                    setShowSupportOps(false);
                }
                if (showBuyerJourney) {
                    setShowBuyerJourney(false);
                }
                if (showPilotConversion) {
                    setShowPilotConversion(false);
                }
                if (showCommercialPackages) {
                    setShowCommercialPackages(false);
                }
                if (showFieldLaunch) {
                    setShowFieldLaunch(false);
                }
                if (showPartnerRollout) {
                    setShowPartnerRollout(false);
                }
                if (showBuyerOps) {
                    setShowBuyerOps(false);
                }
                if (showDemoToPilot) {
                    setShowDemoToPilot(false);
                }
                if (showPilotExpansion) {
                    setShowPilotExpansion(false);
                }
                if (showRenewalRisk) {
                    setShowRenewalRisk(false);
                }
                if (showLaunchWeek) {
                    setShowLaunchWeek(false);
                }
                if (showFollowupGenerator) {
                    setShowFollowupGenerator(false);
                }
                if (showFieldFeedback) {
                    setShowFieldFeedback(false);
                }
                if (showPartnerCertification) {
                    setShowPartnerCertification(false);
                }
                if (showManagedServices) {
                    setShowManagedServices(false);
                }
                if (showStrategicAccount) {
                    setShowStrategicAccount(false);
                }
                if (showPortfolioRollout) {
                    setShowPortfolioRollout(false);
                }
                if (showRevenueOps) {
                    setShowRevenueOps(false);
                }
                if (showChannelExpansion) {
                    setShowChannelExpansion(false);
                }
                if (showCrossAccountRenewal) {
                    setShowCrossAccountRenewal(false);
                }
                if (showExecutiveScale) {
                    setShowExecutiveScale(false);
                }
                if (showEcosystemPortfolio) {
                    setShowEcosystemPortfolio(false);
                }
                if (showServiceLine) {
                    setShowServiceLine(false);
                }
                if (showPartnerNetworkGovernance) {
                    setShowPartnerNetworkGovernance(false);
                }
                if (showGlobalPlanning) {
                    setShowGlobalPlanning(false);
                }
                if (showEcosystemRevenue) {
                    setShowEcosystemRevenue(false);
                }
                if (showBoardOperatingPack) {
                    setShowBoardOperatingPack(false);
                }
                if (showLicensedOperator) {
                    setShowLicensedOperator(false);
                }
                if (showEcosystemCommand) {
                    setShowEcosystemCommand(false);
                }
                if (showShiftConsole) {
                    setShowShiftConsole(false);
                }
                if (showIncidentMode) {
                    setShowIncidentMode(false);
                }
                if (showPolicyRollout) {
                    setShowPolicyRollout(false);
                }
                if (showOfflineUpdateConsole) {
                    setShowOfflineUpdateConsole(false);
                }
                if (showMissionScheduler) {
                    setShowMissionScheduler(false);
                }
                if (showNodeChainPanel) {
                    setShowNodeChainPanel(false);
                }
                if (showRuntimeAlerts) {
                    setShowRuntimeAlerts(false);
                }
                if (showFirstBootWizard) {
                    setShowFirstBootWizard(false);
                }
                if (showSplitWorkspace) {
                    setShowSplitWorkspace(false);
                }
                if (sessionDialog.open) {
                    closeSessionDialog();
                }
                if (showLeftRailOverlay) {
                    setShowLeftRailOverlay(false);
                }
                if (showRightRailOverlay) {
                    setShowRightRailOverlay(false);
                }
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [
        togglePalette,
        closePalette,
        closeSettings,
        showEcosystem,
        showMissionControl,
        showFleetControl,
        showRecoveryCenter,
        showApplianceConsole,
        showAirGapOperations,
        showTrustFabric,
        showHardwareAppliance,
        showCourierTransfer,
        showContinuityDrills,
        showProcurementCommand,
        showTamperSimulation,
        showInstitutionalCommand,
        showDemoFlow,
        showDeploymentProgram,
        showTrainingDelivery,
        showSupportOps,
        showBuyerJourney,
        showPilotConversion,
        showCommercialPackages,
        showFieldLaunch,
        showPartnerRollout,
        showBuyerOps,
        showDemoToPilot,
        showPilotExpansion,
        showRenewalRisk,
        showLaunchWeek,
        showFollowupGenerator,
        showFieldFeedback,
        showPartnerCertification,
        showManagedServices,
        showStrategicAccount,
        showPortfolioRollout,
        showRevenueOps,
        showChannelExpansion,
        showCrossAccountRenewal,
        showExecutiveScale,
        showEcosystemPortfolio,
        showServiceLine,
        showPartnerNetworkGovernance,
        showGlobalPlanning,
        showEcosystemRevenue,
        showBoardOperatingPack,
        showLicensedOperator,
        showEcosystemCommand,
        showShiftConsole,
        showIncidentMode,
        showPolicyRollout,
        showOfflineUpdateConsole,
        showMissionScheduler,
        showNodeChainPanel,
        showRuntimeAlerts,
        showFirstBootWizard,
        showSplitWorkspace,
        sessionDialog.open,
        closeSessionDialog,
        showInlineThreadRail,
        showInlineWorkbenchRail,
        canOpenThreadRailOverlay,
        canOpenWorkbenchRailOverlay,
        showLeftRailOverlay,
        showRightRailOverlay,
    ]);

    const handleSessionSelect = React.useCallback((sessionName) => {
        const safeName = String(sessionName || '').trim();
        if (!safeName) return;
        if (safeName === QUICKSTART_SESSION || isSessionUnlocked(safeName)) {
            selectSession(safeName);
            return;
        }
        openUnlockDialog(safeName);
    }, [isSessionUnlocked, openUnlockDialog, selectSession]);

    const handleSessionDialogSubmit = React.useCallback(async (event) => {
        event.preventDefault();
        setSessionDialogError('');

        if (sessionDialog.mode === 'create') {
            if (auditOnly) {
                setSessionDialogError('Audit-only mode is active. Session creation is disabled.');
                return;
            }
            const result = await createSession({
                name: sessionNameDraft,
                passphrase: sessionPassphraseDraft,
            });
            if (!result.ok) {
                setSessionDialogError(result.error || 'Failed to create session.');
                return;
            }
            closeSessionDialog();
            return;
        }

        const result = await unlockSession(
            sessionDialog.targetSession,
            sessionPassphraseDraft,
        );
        if (!result.ok) {
            setSessionDialogError(result.error || 'Failed to unlock session.');
            return;
        }
        closeSessionDialog();
    }, [
        sessionDialog.mode,
        sessionDialog.targetSession,
        sessionNameDraft,
        sessionPassphraseDraft,
        createSession,
        unlockSession,
        closeSessionDialog,
        auditOnly,
    ]);

    const handleSaveActiveSession = React.useCallback(async () => {
        if (auditOnly) {
            appendChat({ role: 'kernel', content: 'Audit-only mode is active. Session saving is disabled.' });
            return;
        }
        const result = await saveActiveSession('manual');
        if (!result.ok && workflowId && workflowId !== QUICKSTART_SESSION) {
            openUnlockDialog(workflowId);
        }
    }, [saveActiveSession, workflowId, openUnlockDialog, auditOnly, appendChat]);

    const handleRetrySave = React.useCallback(async () => {
        if (auditOnly) {
            appendChat({ role: 'kernel', content: 'Audit-only mode is active. Retry save is disabled.' });
            return;
        }
        const result = await saveActiveSession('retry');
        if (!result.ok && workflowId && workflowId !== QUICKSTART_SESSION) {
            openUnlockDialog(workflowId);
        }
    }, [saveActiveSession, workflowId, openUnlockDialog, auditOnly, appendChat]);

    const handleLockActiveSession = React.useCallback(() => {
        if (auditOnly) {
            appendChat({ role: 'kernel', content: 'Audit-only mode is active. Lock action is disabled.' });
            return;
        }
        if (!workflowId || workflowId === QUICKSTART_SESSION) return;
        lockSession(workflowId);
    }, [workflowId, lockSession, auditOnly, appendChat]);

    const executeSignal = async (signal) => {
        const input = signal || prompt;
        if (!input.trim()) return;

        appendChat({ id: nextMessageId(), role: 'user', content: input });
        setPrompt('');

        const command = input.trim().toLowerCase();
        const rootCommand = command.startsWith('/') ? command.split(/\s+/)[0] : '';

        if (auditOnly) {
            if (!command.startsWith('/')) {
                setIsThinking(false);
                appendChat({
                    role: 'kernel',
                    content: 'Audit-only mode accepts proof/status commands only. Use /proof, /roi, /status, /guard, /help, /workflows, or /clear.',
                });
                return;
            }
            if (!AUDIT_ALLOWED_COMMANDS.has(rootCommand)) {
                setIsThinking(false);
                appendChat({
                    role: 'kernel',
                    content: `Audit-only mode blocked command: ${rootCommand}`,
                });
                return;
            }
        }

        if (command.startsWith('/')) {
            setIsThinking(false);
            if (command === '/clear' || command === '/purge' || command === '/reset') {
                setChatLog([]);
                return;
            }

            setTimeout(() => {
                if (command === '/help') {
                    appendChat({
                        role: 'kernel',
                        content: '### NeuralShell Operator Guide\n\n- `/help` : Show this guide\n- `/status` : Check node telemetry\n- `/clear` : Wipe current thread\n- `/workflows` : List active sessions\n- `/guard` : Audit security status\n- `/proof` : Run a 90-second value proof\n- `/roi` : Show operator ROI snapshot\n- `/ecosystem` : Open ecosystem launcher\n- `/mission` : Open Mission Control cockpit\n- `/fleet` : Open Fleet Control panel\n- `/recovery` : Open Recovery Center\n- `/appliance` : Open Appliance Console\n- `/airgap` : Open Air-Gapped Operations Center\n- `/trustfabric` : Open PKI Trust Fabric\n- `/hardware` : Open Hardware Appliance Program\n- `/courier` : Open Offline Evidence Courier\n- `/drills` : Open Continuity Drill Center\n- `/procurement` : Open Procurement Command Center\n- `/simulate` : Open Tamper Simulation Center\n- `/institutional` : Open Institutional Command Console\n- `/demoflow` : Open Demo Flow Console\n- `/deployment` : Open Deployment Program Pack\n- `/training` : Open Training Delivery Center\n- `/support` : Open Support Ops Console\n- `/buyer` : Open Buyer Evaluation Journey\n- `/pilot` : Open Pilot Conversion Console\n- `/commercial` : Open Commercial Package Console\n- `/launch` : Open Field Launch Command Center\n- `/partner` : Open Partner Rollout Console\n- `/buyerops` : Open Buyer Ops Automation\n- `/demotopilot` : Open Demo-to-Pilot Engine\n- `/expansion` : Open Pilot Expansion Command\n- `/renewal` : Open Renewal Risk Console\n- `/launchweek` : Open Launch Week Command Center\n- `/followup` : Open Follow-Up Generator\n- `/feedback` : Open Field Feedback Console\n- `/shift` : Open Shift Console\n- `/incident` : Open Incident Mode\n- `/rollout` : Open Policy Rollout Console\n- `/updates` : Open Offline Update Console\n- `/missions` : Open Mission Scheduler\n- `/nodechain` : Open NodeChain runtime panel\n- `/watchdog` : Open watchdog alerts drawer\n- `/firstboot` : Open first-boot authority funnel\n- `/split` : Open split workspace\n- `Ctrl+P` : Open Command Palette',
                    });
                } else if (command === '/status') {
                    appendChat({
                        role: 'kernel',
                        content: `Node Status: OPERATIONAL\nIntegrity: SEALED\nCPU: ${stats.cpuPercent}%\nMemory: ${stats.memoryMb}MB`,
                    });
                } else if (command === '/guard') {
                    appendChat({
                        role: 'kernel',
                        content: 'Security Guard: ACTIVE\nPolicy: AIRGAP_ENFORCED\nIntegrity: SEALED (Hardware Bound)',
                    });
                } else if (command === '/workflows') {
                    appendChat({
                        role: 'kernel',
                        content: `Active Workflows:\n${sessions.join('\n')}`,
                    });
                } else if (command === '/resume') {
                    appendChat({
                        role: 'kernel',
                        content: 'Restoring previous session context... Done. All workstation metrics verified.',
                    });
                } else if (command === '/ecosystem') {
                    setShowEcosystem(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Ecosystem Launcher.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'ecosystem' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/mission') {
                    setShowMissionControl(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Mission Control cockpit.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'mission-control' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/fleet') {
                    setShowFleetControl(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Fleet Control panel.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'fleet-control' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/recovery') {
                    setShowRecoveryCenter(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Recovery Center.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'recovery-center' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/appliance') {
                    setShowApplianceConsole(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Appliance Console.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'appliance-console' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/airgap') {
                    setShowAirGapOperations(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Air-Gapped Operations Center.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'airgap-operations' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/trustfabric' || command === '/trust') {
                    setShowTrustFabric(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening PKI Trust Fabric.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'trust-fabric' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/hardware') {
                    setShowHardwareAppliance(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Hardware Appliance Program.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'hardware-appliance' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/courier') {
                    setShowCourierTransfer(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Offline Evidence Courier.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'courier-transfer' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/drills' || command === '/continuity') {
                    setShowContinuityDrills(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Continuity Drill Center.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'continuity-drills' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/procurement') {
                    setShowProcurementCommand(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Procurement Command Center.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'procurement-command' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/simulate' || command === '/tamper') {
                    setShowTamperSimulation(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Tamper Simulation Center.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'tamper-simulation' }, { source: 'runtime', severity: 'warning' });
                } else if (command === '/institutional') {
                    setShowInstitutionalCommand(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Institutional Command Console.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'institutional-command' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/demoflow') {
                    setShowDemoFlow(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Demo Flow Console.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'demo-flow' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/deployment') {
                    setShowDeploymentProgram(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Deployment Program Pack.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'deployment-program' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/training') {
                    setShowTrainingDelivery(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Training Delivery Center.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'training-delivery' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/support') {
                    setShowSupportOps(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Support Ops Console.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'support-ops' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/buyer') {
                    setShowBuyerJourney(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Buyer Evaluation Journey.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'buyer-journey' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/pilot') {
                    setShowPilotConversion(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Pilot Conversion Console.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'pilot-conversion' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/commercial') {
                    setShowCommercialPackages(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Commercial Package Console.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'commercial-packages' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/launch' || command === '/fieldlaunch') {
                    setShowFieldLaunch(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Field Launch Command Center.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'field-launch' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/partner' || command === '/partnerrollout') {
                    setShowPartnerRollout(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Partner Rollout Console.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'partner-rollout' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/buyerops') {
                    setShowBuyerOps(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Buyer Ops Automation.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'buyer-ops' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/demotopilot') {
                    setShowDemoToPilot(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Demo-to-Pilot Conversion Engine.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'demo-to-pilot' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/expansion') {
                    setShowPilotExpansion(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Pilot Expansion Command.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'pilot-expansion' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/renewal') {
                    setShowRenewalRisk(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Renewal Risk Console.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'renewal-risk' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/launchweek') {
                    setShowLaunchWeek(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Launch Week Command Center.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'launch-week' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/followup') {
                    setShowFollowupGenerator(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Proof-Backed Follow-Up Generator.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'followup-generator' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/feedback' || command === '/fieldfeedback') {
                    setShowFieldFeedback(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Field Feedback Console.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'field-feedback' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/shift') {
                    setShowShiftConsole(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Shift Console.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'shift-console' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/incident') {
                    setShowIncidentMode(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Incident Mode.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'incident-mode' }, { source: 'runtime', severity: 'warning' });
                } else if (command === '/rollout') {
                    setShowPolicyRollout(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Policy Rollout Console.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'policy-rollout' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/updates') {
                    setShowOfflineUpdateConsole(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Offline Update Console.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'offline-update-console' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/missions') {
                    setShowMissionScheduler(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening Mission Scheduler.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'mission-scheduler' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/nodechain') {
                    setShowNodeChainPanel(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening NodeChain runtime engine panel.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'nodechain' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/watchdog') {
                    setShowRuntimeAlerts(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening runtime watchdog alerts drawer.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'watchdog' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/firstboot') {
                    reopenFirstBoot();
                    setShowFirstBootWizard(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening first-boot authority funnel.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'first-boot' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/split') {
                    setShowSplitWorkspace(true);
                    appendChat({
                        role: 'kernel',
                        content: 'Opening live split workspace.',
                    });
                    appendRuntimeEvent('runtime.panel.opened', { panel: 'split-workspace' }, { source: 'runtime', severity: 'info' });
                } else if (command === '/proof' || command === '/demo') {
                    appendRuntimeEvent('proof.started', {
                        workflowId: String(workflowId || 'default'),
                    }, { source: 'proof', severity: 'info' });
                    if (typeof window !== 'undefined' && window.localStorage) {
                        window.localStorage.setItem('neuralshell_proof_last_status_v1', 'running');
                        window.localStorage.setItem('neuralshell_proof_stage_v1', 'executing');
                    }
                    const messageId = appendKernelMessage([
                            '### 90-Second Value Proof',
                            '',
                            '1. **Trust + Locality**',
                            '- Security policy reports `AIRGAP_ENFORCED` and `SEALED` integrity in this runtime.',
                            '',
                            '2. **Execution Safety**',
                            '- Workspace edits stay operator-controlled with explicit apply/preview gates.',
                            '',
                            '3. **Session Reliability**',
                            `- Active workflows available right now: ${sessions.length}`,
                            '- Session state can be saved, locked, and restored with passphrase control.',
                            '',
                            '4. **Release Evidence Path**',
                            '- Built-in release gate + packaged smoke checks produce verifiable proof artifacts.',
                            '',
                            'Next steps:',
                            '- Create a workflow in the left rail',
                            '- Run `/guard` and `/status`',
                            '- Save, lock, unlock, and verify restore in under 2 minutes',
                        ].join('\n'), {
                        stdoutLines: [],
                        stdoutDone: false,
                    });
                    launchStdoutStream('proof', messageId);
                    setShowSuccessCapture(true);
                } else if (command === '/unit-test') {
                    const messageId = appendKernelMessage([
                        '### Unit Test Probe',
                        '',
                        '- Triggered local test routine from inline command lane.',
                        '- Streaming stdout is attached below for live verification output.',
                    ].join('\n'), {
                        stdoutLines: [],
                        stdoutDone: false,
                    });
                    launchStdoutStream('unit-test', messageId);
                } else if (command === '/roi' || command === '/pitch') {
                    const savedMinutesPerDay = 45;
                    const loadedCostPerHour = 120;
                    const workingDaysPerYear = 220;
                    const annualHours = Math.round((savedMinutesPerDay * workingDaysPerYear) / 60);
                    const annualValue = annualHours * loadedCostPerHour;
                    appendChat({
                        role: 'kernel',
                        content: [
                            '### NeuralShell ROI Snapshot',
                            '',
                            `- Time reclaimed target: ~${savedMinutesPerDay} minutes/day/operator`,
                            `- Annual recovered capacity: ~${annualHours} hours/operator`,
                            `- Value at $${loadedCostPerHour}/hour: ~$${annualValue.toLocaleString()} per operator/year`,
                            '',
                            'Where the gain comes from:',
                            '- Faster triage with one command and evidence lane',
                            '- Fewer release regressions via strict guardrails',
                            '- Less context switching between tooling surfaces',
                            '',
                            'Fast close path:',
                            '- Run `/proof` now',
                            '- Save and lock one workflow',
                            '- Export release artifacts from the same console',
                        ].join('\n'),
                    });
                } else {
                    appendChat({ role: 'kernel', content: `Unknown command: ${command}` });
                }
            }, 400);
            return;
        }

        setLastFreeformPrompt(input);
        setIsThinking(true);
        try {
            const history = [...chatLog, { role: 'user', content: input }];
            const response = await window.api.llm.chat(history);
            const content = response && response.message && typeof response.message.content === 'string'
                ? response.message.content
                : (response && typeof response.content === 'string' ? response.content : '');
            appendChat({ id: nextMessageId(), role: 'kernel', content: content || 'System: Empty response from kernel.' });
        } catch (err) {
            appendChat({ id: nextMessageId(), role: 'kernel', content: `Kernel Error: ${err.message}` });
        } finally {
            setIsThinking(false);
        }
    };

    const handleRegenerate = () => {
        if (!lastFreeformPrompt.trim()) return;
        executeSignal(lastFreeformPrompt);
    };

    const handleOfflineKillSwitch = React.useCallback(async () => {
        if (auditOnly) {
            appendChat({ role: 'kernel', content: 'Audit-only mode is active. Offline kill switch changes are disabled.' });
            return;
        }
        try {
            const current = await window.api.settings.get();
            const next = {
                ...(current || {}),
                provider: 'ollama',
                apiKey: '',
                ollamaBaseUrl: 'http://127.0.0.1:11434',
                allowRemoteBridge: false,
                connectOnStartup: false,
            };
            await window.api.llm.cancelStream().catch(() => false);
            await window.api.settings.update(next);
            appendChat({
                role: 'kernel',
                content: 'Offline kill switch engaged. Hosted providers disabled and bridge stream cancelled.',
            });
            await refreshRuntimeContext();
        } catch (err) {
            appendChat({
                role: 'kernel',
                content: `Offline kill switch failed: ${err && err.message ? err.message : String(err)}`,
            });
        }
    }, [appendChat, auditOnly, refreshRuntimeContext]);

    const handleUpgradeToPro = React.useCallback(async () => {
        const opener = window.api && window.api.system && typeof window.api.system.openExternal === 'function'
            ? window.api.system.openExternal
            : null;
        if (!opener) {
            appendChat({
                role: 'kernel',
                content: `Upgrade link: ${PRO_UPGRADE_URL}`,
            });
            return;
        }
        try {
            await opener(PRO_UPGRADE_URL);
            appendChat({
                role: 'kernel',
                content: 'Opening Pro upgrade page in your browser.',
            });
        } catch (err) {
            appendChat({
                role: 'kernel',
                content: `Unable to open upgrade page automatically. Use: ${PRO_UPGRADE_URL}`,
            });
            if (window.api && window.api.logger && typeof window.api.logger.log === 'function') {
                window.api.logger.log('warn', 'upgrade-link-open-failed', {
                    reason: err && err.message ? err.message : String(err),
                }).catch(() => undefined);
            }
        }
    }, [appendChat]);

    const handleSend = () => executeSignal();
    const showLockBanner = workflowId
        && workflowId !== QUICKSTART_SESSION
        && sessionHydrationStatus === 'locked';

    const handleInsertPrompt = React.useCallback((value) => {
        const next = String(value || '').trim();
        if (!next) return;
        setPrompt(next);
        window.dispatchEvent(new window.CustomEvent('neuralshell:focus-composer'));
    }, []);

    const handleCloseOnboarding = React.useCallback(() => {
        setShowOnboarding(false);
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(ONBOARDING_WIZARD_DISMISSED_KEY, '1');
        }
    }, []);

    const runFirstBootStep = React.useCallback(async (stepId) => {
        await runFirstBootCoreStep(stepId, async () => {
            const safeStepId = String(stepId || '');
            if (safeStepId === 'welcome_intro') {
                appendChat({
                    id: nextMessageId(),
                    role: 'kernel',
                    content: 'Welcome to NeuralShell runtime authority mode. You are configuring a local-first, proof-aware workstation.',
                });
                return;
            }
            if (safeStepId === 'provider_sweep') {
                await refreshRuntimeContext();
                await refreshRuntimeState();
                appendChat({
                    id: nextMessageId(),
                    role: 'kernel',
                    content: 'Provider sweep completed. Runtime connectivity baseline refreshed.',
                });
                return;
            }
            if (safeStepId === 'vault_setup') {
                openSettings();
                window.dispatchEvent(new window.CustomEvent('neuralshell:prompt-vault-save'));
                return;
            }
            if (safeStepId === 'policy_profile_selection') {
                if (window.api && window.api.settings && typeof window.api.settings.get === 'function') {
                    const current = await window.api.settings.get();
                    await window.api.settings.update({
                        ...(current || {}),
                        offlineOnlyEnforced: Boolean(current && current.offlineOnlyEnforced),
                    });
                }
                await refreshRuntimeContext();
                await refreshRuntimeState();
                return;
            }
            if (safeStepId === 'update_ring_selection') {
                if (window.api && window.api.settings && typeof window.api.settings.get === 'function') {
                    const current = await window.api.settings.get();
                    await window.api.settings.update({
                        ...(current || {}),
                        autoUpdateChannel: String((current && current.autoUpdateChannel) || 'stable'),
                    });
                }
                await refreshRuntimeContext();
                await refreshRuntimeState();
                return;
            }
            if (safeStepId === 'run_proof') {
                await executeSignal('/proof');
                return;
            }
            if (safeStepId === 'license_import') {
                openSettings();
                return;
            }
            if (safeStepId === 'share_badge') {
                if (window.api && window.api.system && typeof window.api.system.openExternal === 'function') {
                    await window.api.system.openExternal('https://raw.githubusercontent.com/Z3r0DayZion-install/NeuralShell/main/assets/proof_badge.svg');
                }
                return;
            }
            if (safeStepId === 'open_mission_control') {
                setShowMissionControl(true);
            }
        });
    }, [appendChat, nextMessageId, openSettings, refreshRuntimeContext, refreshRuntimeState, runFirstBootCoreStep]);

    const skipFirstBootStep = React.useCallback((stepId) => {
        markFirstBootSkipped(stepId);
        completeFirstBootStep(stepId);
    }, [completeFirstBootStep, markFirstBootSkipped]);

    const handleFinishFirstBoot = React.useCallback(() => {
        if (firstBootAllDone) {
            setShowMissionControl(true);
        }
        dismissFirstBoot();
        setShowFirstBootWizard(false);
    }, [dismissFirstBoot, firstBootAllDone]);

    const acknowledgeWatchdogAlert = React.useCallback((alertId) => {
        const supervisor = watchdogSupervisorRef.current;
        if (supervisor && typeof supervisor.acknowledgeAlert === 'function') {
            supervisor.acknowledgeAlert(alertId);
            setWatchdogAlerts(supervisor.getAlerts());
        }
    }, []);

    const importLocalRuntimeNode = React.useCallback(() => {
        return fleet.importRuntimeNode(runtimeState, {
            nodeId: 'local-runtime',
            displayName: 'Local Runtime',
        });
    }, [fleet, runtimeState]);

    const restoreSnapshotPayload = React.useCallback((payload) => {
        const state = payload && typeof payload === 'object' ? payload : {};
        appendChat({
            id: nextMessageId(),
            role: 'kernel',
            content: `Snapshot restore applied: provider=${String(state.provider || 'n/a')}, model=${String(state.model || 'n/a')}, policy=${String(state.policyProfile || 'n/a')}.`,
        });
        if (state.activePanels && Array.isArray(state.activePanels) && state.activePanels.includes('mission-control')) {
            setShowMissionControl(true);
        }
    }, [appendChat, nextMessageId]);

    const dismissRailResizeHint = React.useCallback(() => {
        setShowRailResizeHint(false);
        if (typeof window === 'undefined' || !window.localStorage) return;
        try {
            window.localStorage.setItem(RAIL_RESIZE_HINT_DISMISSED_KEY, '1');
        } catch {
            // ignore storage failures for non-critical hint preference writes
        }
    }, []);

    const setRailCollapsedForCurrentMode = React.useCallback((rail, collapsed) => {
        const railKey = rail === 'workbench' ? 'workbench' : 'thread';
        const modeKey = layoutMode === 'focused' ? 'focused' : layoutMode === 'balanced' ? 'balanced' : 'expanded';
        const nextCollapsed = Boolean(collapsed);
        setRailCollapsePrefs((prev) => {
            const currentMode = prev[modeKey] || DEFAULT_RAIL_COLLAPSE_PREFS[modeKey];
            if (Boolean(currentMode && currentMode[railKey]) === nextCollapsed) {
                return prev;
            }
            return {
                ...prev,
                [modeKey]: {
                    thread: railKey === 'thread' ? nextCollapsed : Boolean(currentMode && currentMode.thread),
                    workbench: railKey === 'workbench' ? nextCollapsed : Boolean(currentMode && currentMode.workbench),
                },
            };
        });
    }, [layoutMode]);

    const toggleThreadRailCollapse = React.useCallback(() => {
        setRailCollapsedForCurrentMode('thread', !threadRailCollapsed);
    }, [setRailCollapsedForCurrentMode, threadRailCollapsed]);

    const toggleWorkbenchRailCollapse = React.useCallback(() => {
        setRailCollapsedForCurrentMode('workbench', !workbenchRailCollapsed);
    }, [setRailCollapsedForCurrentMode, workbenchRailCollapsed]);

    const updateRailWidth = React.useCallback((rail, width) => {
        const key = rail === 'workbench' ? 'workbench' : 'thread';
        const minWidth = key === 'workbench' ? WORKBENCH_RAIL_MIN_WIDTH : THREAD_RAIL_MIN_WIDTH;
        const maxWidth = key === 'workbench' ? WORKBENCH_RAIL_MAX_WIDTH : THREAD_RAIL_MAX_WIDTH;
        const nextWidth = clampRailWidth(width, minWidth, maxWidth);
        setRailWidths((prev) => {
            if (prev[key] === nextWidth) return prev;
            return {
                ...prev,
                [key]: nextWidth,
            };
        });
    }, []);

    const applyRailSizePreset = React.useCallback((presetId) => {
        const safePresetId = String(presetId || '').trim().toLowerCase();
        const preset = RAIL_SIZE_PRESETS[safePresetId];
        if (!preset) return;
        setRailWidths({
            thread: clampRailWidth(preset.thread, THREAD_RAIL_MIN_WIDTH, THREAD_RAIL_MAX_WIDTH),
            workbench: clampRailWidth(preset.workbench, WORKBENCH_RAIL_MIN_WIDTH, WORKBENCH_RAIL_MAX_WIDTH),
        });
    }, []);

    const resetThreadRailWidth = React.useCallback(() => {
        updateRailWidth('thread', DEFAULT_THREAD_RAIL_WIDTH);
    }, [updateRailWidth]);

    const resetWorkbenchRailWidth = React.useCallback(() => {
        updateRailWidth('workbench', DEFAULT_WORKBENCH_RAIL_WIDTH);
    }, [updateRailWidth]);

    const beginThreadRailResize = React.useCallback((event) => {
        if (event.button !== 0 || !showInlineThreadRailPanel) return;
        event.preventDefault();
        dismissRailResizeHint();
        railResizeStateRef.current = {
            rail: 'thread',
            startX: Number(event.clientX || 0),
            startWidth: inlineThreadRailWidth,
            minWidth: THREAD_RAIL_MIN_WIDTH,
            maxWidth: inlineThreadRailMaxWidth,
        };
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
    }, [
        dismissRailResizeHint,
        inlineThreadRailMaxWidth,
        inlineThreadRailWidth,
        showInlineThreadRailPanel,
    ]);

    const beginWorkbenchRailResize = React.useCallback((event) => {
        if (event.button !== 0 || !showInlineWorkbenchRailPanel) return;
        event.preventDefault();
        dismissRailResizeHint();
        railResizeStateRef.current = {
            rail: 'workbench',
            startX: Number(event.clientX || 0),
            startWidth: inlineWorkbenchRailWidth,
            minWidth: WORKBENCH_RAIL_MIN_WIDTH,
            maxWidth: inlineWorkbenchRailMaxWidth,
        };
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
    }, [
        dismissRailResizeHint,
        inlineWorkbenchRailMaxWidth,
        inlineWorkbenchRailWidth,
        showInlineWorkbenchRailPanel,
    ]);

    const beginOverlayThreadRailResize = React.useCallback((event) => {
        if (event.button !== 0 || !showLeftRailOverlay) return;
        event.preventDefault();
        railResizeStateRef.current = {
            rail: 'thread',
            startX: Number(event.clientX || 0),
            startWidth: overlayThreadRailWidth,
            minWidth: THREAD_RAIL_MIN_WIDTH,
            maxWidth: Math.min(THREAD_RAIL_MAX_WIDTH, Math.max(THREAD_RAIL_MIN_WIDTH, viewportWidth - OVERLAY_RAIL_MARGIN)),
        };
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
    }, [
        overlayThreadRailWidth,
        showLeftRailOverlay,
        viewportWidth,
    ]);

    const beginOverlayWorkbenchRailResize = React.useCallback((event) => {
        if (event.button !== 0 || !showRightRailOverlay) return;
        event.preventDefault();
        railResizeStateRef.current = {
            rail: 'workbench',
            startX: Number(event.clientX || 0),
            startWidth: overlayWorkbenchRailWidth,
            minWidth: WORKBENCH_RAIL_MIN_WIDTH,
            maxWidth: Math.min(WORKBENCH_RAIL_MAX_WIDTH, Math.max(WORKBENCH_RAIL_MIN_WIDTH, viewportWidth - OVERLAY_RAIL_MARGIN)),
        };
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
    }, [
        overlayWorkbenchRailWidth,
        showRightRailOverlay,
        viewportWidth,
    ]);

    React.useEffect(() => {
        const completeResize = () => {
            if (!railResizeStateRef.current) return;
            railResizeStateRef.current = null;
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        };

        const handlePointerMove = (event) => {
            const activeResize = railResizeStateRef.current;
            if (!activeResize) return;
            const pointerX = Number(event.clientX || 0);
            if (!Number.isFinite(pointerX)) return;
            const delta = activeResize.rail === 'thread'
                ? pointerX - activeResize.startX
                : activeResize.startX - pointerX;
            const nextWidth = clampRailWidth(
                activeResize.startWidth + delta,
                activeResize.minWidth,
                activeResize.maxWidth,
            );
            updateRailWidth(
                activeResize.rail,
                nextWidth,
            );
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', completeResize);
        window.addEventListener('pointercancel', completeResize);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', completeResize);
            window.removeEventListener('pointercancel', completeResize);
            completeResize();
        };
    }, [updateRailWidth]);

    React.useEffect(() => {
        if (!showRailResizeHint) return undefined;
        if (!showInlineThreadRailPanel && !showInlineWorkbenchRailPanel) return undefined;
        const timer = window.setTimeout(() => {
            dismissRailResizeHint();
        }, 9000);
        return () => {
            window.clearTimeout(timer);
        };
    }, [
        dismissRailResizeHint,
        showInlineThreadRailPanel,
        showInlineWorkbenchRailPanel,
        showRailResizeHint,
    ]);

    const toggleLeftRailOverlay = React.useCallback(() => {
        setShowRightRailOverlay(false);
        setShowLeftRailOverlay((prev) => !prev);
    }, []);

    const toggleRightRailOverlay = React.useCallback(() => {
        setShowLeftRailOverlay(false);
        setShowRightRailOverlay((prev) => !prev);
    }, []);

    return (
        <div className="h-screen w-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden font-sans selection:bg-cyan-500/30">
            <TopStatusBar
                model={model}
                setModel={setModel}
                stats={stats}
                xpState={xpState}
                workflowId={workflowId}
                onOpenPalette={openPalette}
                onOpenSettings={openSettings}
                onOpenAnalytics={() => setShowAnalytics(true)}
                onOpenEcosystem={() => setShowEcosystem(true)}
                onOpenMissionControl={() => setShowMissionControl(true)}
                onOpenFleetControl={() => setShowFleetControl(true)}
                onOpenApplianceConsole={() => setShowApplianceConsole(true)}
                onOpenAirGapOperations={() => setShowAirGapOperations(true)}
                onOpenInstitutionalCommand={() => setShowInstitutionalCommand(true)}
                onOpenDemoFlow={() => setShowDemoFlow(true)}
                onOpenFieldLaunch={() => setShowFieldLaunch(true)}
                onToggleScratchpad={() => setShowScratchpad((prev) => !prev)}
                watchdogStatus={watchdogStatus}
                watchdogAlertCount={unacknowledgedWatchdogAlerts.length}
                onOpenRuntimeAlerts={() => setShowRuntimeAlerts(true)}
                runtimeTier={runtimeTier}
                connectionInfo={connectionInfo}
                tokensRemaining={tokensRemaining}
                collabConnected={collab.connected}
                collabRoomId={collab.roomId}
                collabPeerCount={collabPeerCount}
                accelStatus={accelStatus}
                applianceModeEnabled={applianceModeEnabled}
                airGapLocked={airGapLocked}
                demoModeEnabled={demoModeEnabled}
                feedbackDisabled={!connectionInfo.allowRemoteBridge}
                feedbackUrl={FEEDBACK_URL}
                onOpenIssueAssist={canUseIssueAssist ? () => setShowIssueAssist(true) : undefined}
                tierId={runtimeCapabilityPayload.tierId}
                tierLabel={runtimeCapabilityPayload.tierLabel}
            />

            {showLockBanner && (
                <div
                    data-testid="session-lock-banner"
                    className="px-5 py-2 border-b border-amber-400/20 bg-amber-400/10 text-[11px] font-mono text-amber-100 flex items-center justify-between gap-3"
                >
                    <span>{sessionError || `Session "${workflowId}" is locked.`}</span>
                    <button
                        data-testid="session-lock-unlock-btn"
                        onClick={() => openUnlockDialog(workflowId)}
                        className="px-3 py-1 rounded border border-amber-300/40 text-[10px] uppercase tracking-wider font-bold hover:bg-amber-300/20"
                    >
                        Unlock Session
                    </button>
                </div>
            )}

            <div
                data-testid="layout-control-bar"
                className="px-4 py-2 border-b border-white/5 bg-black/20 flex flex-wrap items-center justify-between gap-2"
            >
                <div className="flex flex-col">
                    <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">
                        {layoutModeLabel} · {Math.round(viewportWidth)}px
                    </div>
                    <div className="text-[9px] font-mono text-slate-600">
                        Alt+[ ] workflow · Alt+Shift+[ ] workbench
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                        <button
                            type="button"
                            data-testid="layout-preset-compact-btn"
                            onClick={() => applyRailSizePreset('compact')}
                            className={`px-2 py-1.5 text-[10px] font-mono uppercase tracking-[0.12em] transition-colors ${
                                activeRailPresetId === 'compact'
                                    ? 'bg-cyan-500/20 text-cyan-100'
                                    : 'text-slate-300 hover:bg-white/10'
                            }`}
                        >
                            Compact
                        </button>
                        <button
                            type="button"
                            data-testid="layout-preset-balanced-btn"
                            onClick={() => applyRailSizePreset('balanced')}
                            className={`px-2 py-1.5 text-[10px] font-mono uppercase tracking-[0.12em] transition-colors border-l border-white/10 ${
                                activeRailPresetId === 'balanced'
                                    ? 'bg-cyan-500/20 text-cyan-100'
                                    : 'text-slate-300 hover:bg-white/10'
                            }`}
                        >
                            Balanced
                        </button>
                        <button
                            type="button"
                            data-testid="layout-preset-wide-btn"
                            onClick={() => applyRailSizePreset('wide')}
                            className={`px-2 py-1.5 text-[10px] font-mono uppercase tracking-[0.12em] transition-colors border-l border-white/10 ${
                                activeRailPresetId === 'wide'
                                    ? 'bg-cyan-500/20 text-cyan-100'
                                    : 'text-slate-300 hover:bg-white/10'
                            }`}
                        >
                            Wide
                        </button>
                    </div>
                    <button
                        type="button"
                        data-testid="layout-reset-panels-btn"
                        onClick={() => {
                            resetThreadRailWidth();
                            resetWorkbenchRailWidth();
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-[10px] font-mono uppercase tracking-[0.12em] text-slate-300 hover:bg-white/10"
                    >
                        Reset Panels
                    </button>
                    {showInlineThreadRail && (
                        <button
                            type="button"
                            data-testid="layout-toggle-thread-inline-btn"
                            onClick={toggleThreadRailCollapse}
                            className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-mono uppercase tracking-[0.14em] ${
                                threadRailCollapsed
                                    ? 'border-cyan-300/30 bg-cyan-500/10 text-cyan-100'
                                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                            }`}
                        >
                            {threadRailCollapsed ? 'Show Workflows' : 'Hide Workflows'}
                        </button>
                    )}
                    {showInlineWorkbenchRail && (
                        <button
                            type="button"
                            data-testid="layout-toggle-workbench-inline-btn"
                            onClick={toggleWorkbenchRailCollapse}
                            className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-mono uppercase tracking-[0.14em] ${
                                workbenchRailCollapsed
                                    ? 'border-cyan-300/30 bg-cyan-500/10 text-cyan-100'
                                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                            }`}
                        >
                            {workbenchRailCollapsed ? 'Show Workbench' : 'Hide Workbench'}
                        </button>
                    )}
                    {canOpenThreadRailOverlay && (
                        <button
                            type="button"
                            data-testid="layout-toggle-workflows-btn"
                            onClick={toggleLeftRailOverlay}
                            className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-mono uppercase tracking-[0.14em] ${
                                showLeftRailOverlay
                                    ? 'border-cyan-300/40 bg-cyan-500/20 text-cyan-100'
                                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                            }`}
                        >
                            {showLeftRailOverlay ? 'Close Workflows' : 'Workflows'}
                        </button>
                    )}
                    {canOpenWorkbenchRailOverlay && (
                        <button
                            type="button"
                            data-testid="layout-toggle-workbench-btn"
                            onClick={toggleRightRailOverlay}
                            className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-mono uppercase tracking-[0.14em] ${
                                showRightRailOverlay
                                    ? 'border-cyan-300/40 bg-cyan-500/20 text-cyan-100'
                                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                            }`}
                        >
                            {showRightRailOverlay ? 'Close Workbench' : 'Workbench'}
                        </button>
                    )}
                </div>
            </div>
            <div className="px-4 py-2 border-b border-white/5 bg-black/15">
                <OnboardingProgressRail
                    steps={firstBootSteps}
                    progress={firstBootProgress}
                    onReopen={() => {
                        reopenFirstBoot();
                        setShowFirstBootWizard(true);
                    }}
                    onReset={() => {
                        resetFirstBoot();
                        setShowFirstBootWizard(true);
                    }}
                />
            </div>

            <div className="flex-1 flex min-h-0 overflow-hidden relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/[0.03] blur-[120px] pointer-events-none" />

                {showInlineThreadRailPanel && (
                    <ThreadRail
                        sessions={sessions}
                        workflowId={workflowId}
                        onSelectSession={handleSessionSelect}
                        onCreateSession={openCreateDialog}
                        onSaveSession={handleSaveActiveSession}
                        onRetrySave={handleRetrySave}
                        onLockSession={handleLockActiveSession}
                        saveStatus={saveStatus}
                        isSessionUnlocked={isSessionUnlocked}
                        sessionHydrationStatus={sessionHydrationStatus}
                        autoLockOnBlur={Boolean(autoLockOnBlur)}
                        onToggleAutoLock={setAutoLockOnBlur}
                        auditOnly={auditOnly}
                        onUpgradeToPro={handleUpgradeToPro}
                        widthPx={inlineThreadRailWidth}
                    />
                )}
                {showInlineThreadRailPanel && (
                    <button
                        type="button"
                        role="separator"
                        aria-label="Resize workflow rail"
                        aria-orientation="vertical"
                        data-testid="thread-rail-resize-handle"
                        onPointerDown={beginThreadRailResize}
                        onDoubleClick={resetThreadRailWidth}
                        title="Drag to resize. Double-click to reset."
                        className="relative group z-20 w-2 -mx-1 cursor-col-resize touch-none select-none flex items-stretch"
                    >
                        <span className="mx-auto my-2 w-px bg-white/10 transition-colors group-hover:bg-cyan-400/80" />
                        {showThreadRailResizeHint && (
                            <span
                                role="status"
                                className="absolute top-3 left-3 whitespace-nowrap px-2 py-1 rounded-lg border border-cyan-300/30 bg-slate-950/95 text-[9px] font-mono uppercase tracking-[0.1em] text-cyan-100 shadow-[0_6px_24px_rgba(0,0,0,0.5)]"
                            >
                                Drag to resize · double-click to reset
                            </span>
                        )}
                    </button>
                )}
                {showInlineThreadRail && threadRailCollapsed && (
                    <button
                        type="button"
                        data-testid="thread-rail-mini-expand-btn"
                        onClick={toggleThreadRailCollapse}
                        className="shrink-0 w-12 border-r border-white/10 bg-slate-950/75 hover:bg-slate-900/90 text-cyan-100 transition-colors flex flex-col items-center justify-center gap-1"
                        title="Expand workflows rail"
                    >
                        <span className="text-[9px] font-mono uppercase tracking-[0.14em]">WF</span>
                        <span className="text-[8px] text-slate-400 font-mono uppercase tracking-[0.12em]">Open</span>
                    </button>
                )}

                <WorkspacePanel
                    chatLog={chatLog}
                    workflowId={workflowId}
                    prompt={prompt}
                    setPrompt={setPrompt}
                    onSend={handleSend}
                    onExecute={executeSignal}
                    auditOnly={auditOnly}
                    isThinking={isThinking}
                    onRegenerate={handleRegenerate}
                    hasRegenerate={Boolean(lastFreeformPrompt.trim())}
                    connectionInfo={connectionInfo}
                    sessionHydrationStatus={sessionHydrationStatus}
                    onOfflineKill={handleOfflineKillSwitch}
                    onUpgradeToPro={handleUpgradeToPro}
                    collab={collab}
                />

                {showInlineWorkbenchRailPanel && (
                    <>
                        <button
                            type="button"
                            role="separator"
                            aria-label="Resize workbench rail"
                            aria-orientation="vertical"
                            data-testid="workbench-rail-resize-handle"
                            onPointerDown={beginWorkbenchRailResize}
                            onDoubleClick={resetWorkbenchRailWidth}
                            title="Drag to resize. Double-click to reset."
                            className="group z-20 w-2 -mx-1 cursor-col-resize touch-none select-none flex items-stretch"
                        >
                            <span className="mx-auto my-2 w-px bg-white/10 transition-colors group-hover:bg-cyan-400/80" />
                        </button>
                        <WorkbenchRail
                            stats={stats}
                            workflowId={workflowId}
                            onExecute={executeSignal}
                            onInsertPrompt={handleInsertPrompt}
                            auditOnly={auditOnly}
                            widthPx={inlineWorkbenchRailWidth}
                            connectionInfo={connectionInfo}
                        />
                    </>
                )}
                {showInlineWorkbenchRail && workbenchRailCollapsed && (
                    <button
                        type="button"
                        data-testid="workbench-rail-mini-expand-btn"
                        onClick={toggleWorkbenchRailCollapse}
                        className="shrink-0 w-12 border-l border-white/10 bg-slate-950/75 hover:bg-slate-900/90 text-cyan-100 transition-colors flex flex-col items-center justify-center gap-1"
                        title="Expand workbench rail"
                    >
                        <span className="text-[9px] font-mono uppercase tracking-[0.14em]">WB</span>
                        <span className="text-[8px] text-slate-400 font-mono uppercase tracking-[0.12em]">Open</span>
                    </button>
                )}
                <ScratchpadTab
                    open={showScratchpad}
                    onClose={() => setShowScratchpad(false)}
                />
            </div>

            {canOpenThreadRailOverlay && showLeftRailOverlay && (
                <>
                    <div
                        className="fixed inset-0 z-[72] bg-black/55"
                        onClick={() => setShowLeftRailOverlay(false)}
                    />
                    <div className="fixed left-0 top-14 bottom-0 z-[73] flex items-stretch">
                        <ThreadRail
                            sessions={sessions}
                            workflowId={workflowId}
                            onSelectSession={handleSessionSelect}
                            onCreateSession={openCreateDialog}
                            onSaveSession={handleSaveActiveSession}
                            onRetrySave={handleRetrySave}
                            onLockSession={handleLockActiveSession}
                            saveStatus={saveStatus}
                            isSessionUnlocked={isSessionUnlocked}
                            sessionHydrationStatus={sessionHydrationStatus}
                            autoLockOnBlur={Boolean(autoLockOnBlur)}
                            onToggleAutoLock={setAutoLockOnBlur}
                            auditOnly={auditOnly}
                            onUpgradeToPro={handleUpgradeToPro}
                            widthPx={overlayThreadRailWidth}
                        />
                        <button
                            type="button"
                            role="separator"
                            aria-label="Resize overlay workflow rail"
                            aria-orientation="vertical"
                            data-testid="thread-rail-overlay-resize-handle"
                            onPointerDown={beginOverlayThreadRailResize}
                            onDoubleClick={resetThreadRailWidth}
                            title="Drag to resize overlay. Double-click to reset."
                            className="group z-20 w-2 -mx-1 cursor-col-resize touch-none select-none flex items-stretch"
                        >
                            <span className="mx-auto my-2 w-px bg-white/30 transition-colors group-hover:bg-cyan-300/90" />
                        </button>
                    </div>
                </>
            )}

            {canOpenWorkbenchRailOverlay && showRightRailOverlay && (
                <>
                    <div
                        className="fixed inset-0 z-[72] bg-black/55"
                        onClick={() => setShowRightRailOverlay(false)}
                    />
                    <div className="fixed right-0 top-14 bottom-0 z-[73] flex items-stretch">
                        <button
                            type="button"
                            role="separator"
                            aria-label="Resize overlay workbench rail"
                            aria-orientation="vertical"
                            data-testid="workbench-rail-overlay-resize-handle"
                            onPointerDown={beginOverlayWorkbenchRailResize}
                            onDoubleClick={resetWorkbenchRailWidth}
                            title="Drag to resize overlay. Double-click to reset."
                            className="group z-20 w-2 -mx-1 cursor-col-resize touch-none select-none flex items-stretch"
                        >
                            <span className="mx-auto my-2 w-px bg-white/30 transition-colors group-hover:bg-cyan-300/90" />
                        </button>
                        <WorkbenchRail
                            stats={stats}
                            workflowId={workflowId}
                            onExecute={executeSignal}
                            onInsertPrompt={handleInsertPrompt}
                            auditOnly={auditOnly}
                            widthPx={overlayWorkbenchRailWidth}
                            connectionInfo={connectionInfo}
                        />
                    </div>
                </>
            )}

            {showPalette && (
                <CommandPalette onClose={closePalette} />
            )}
            {showSettings && <SettingsDrawer />}
            {showAnalytics && (
                <AnalyticsDrawer
                    onClose={() => setShowAnalytics(false)}
                    capabilities={runtimeCapabilityPayload.capabilities}
                />
            )}
            <EcosystemLauncher
                open={showEcosystem}
                onClose={() => setShowEcosystem(false)}
                capabilities={runtimeCapabilityPayload.capabilities}
                tierId={runtimeCapabilityPayload.tierId}
                onOpenMissionControl={() => {
                    setShowEcosystem(false);
                    setShowMissionControl(true);
                }}
                onOpenFleetControl={() => {
                    setShowEcosystem(false);
                    setShowFleetControl(true);
                }}
                onOpenRecoveryCenter={() => {
                    setShowEcosystem(false);
                    setShowRecoveryCenter(true);
                }}
                onOpenApplianceConsole={() => {
                    setShowEcosystem(false);
                    setShowApplianceConsole(true);
                }}
                onOpenAirGapOperations={() => {
                    setShowEcosystem(false);
                    setShowAirGapOperations(true);
                }}
                onOpenTrustFabric={() => {
                    setShowEcosystem(false);
                    setShowTrustFabric(true);
                }}
                onOpenHardwareAppliance={() => {
                    setShowEcosystem(false);
                    setShowHardwareAppliance(true);
                }}
                onOpenCourierTransfer={() => {
                    setShowEcosystem(false);
                    setShowCourierTransfer(true);
                }}
                onOpenContinuityDrills={() => {
                    setShowEcosystem(false);
                    setShowContinuityDrills(true);
                }}
                onOpenProcurementCommand={() => {
                    setShowEcosystem(false);
                    setShowProcurementCommand(true);
                }}
                onOpenTamperSimulation={() => {
                    setShowEcosystem(false);
                    setShowTamperSimulation(true);
                }}
                onOpenInstitutionalCommand={() => {
                    setShowEcosystem(false);
                    setShowInstitutionalCommand(true);
                }}
                onOpenDemoFlow={() => {
                    setShowEcosystem(false);
                    setShowDemoFlow(true);
                }}
                onOpenDeploymentProgram={() => {
                    setShowEcosystem(false);
                    setShowDeploymentProgram(true);
                }}
                onOpenTrainingDelivery={() => {
                    setShowEcosystem(false);
                    setShowTrainingDelivery(true);
                }}
                onOpenSupportOps={() => {
                    setShowEcosystem(false);
                    setShowSupportOps(true);
                }}
                onOpenBuyerJourney={() => {
                    setShowEcosystem(false);
                    setShowBuyerJourney(true);
                }}
                onOpenPilotConversion={() => {
                    setShowEcosystem(false);
                    setShowPilotConversion(true);
                }}
                onOpenCommercialPackages={() => {
                    setShowEcosystem(false);
                    setShowCommercialPackages(true);
                }}
                onOpenFieldLaunch={() => {
                    setShowEcosystem(false);
                    setShowFieldLaunch(true);
                }}
                onOpenPartnerRollout={() => {
                    setShowEcosystem(false);
                    setShowPartnerRollout(true);
                }}
                onOpenBuyerOps={() => {
                    setShowEcosystem(false);
                    setShowBuyerOps(true);
                }}
                onOpenDemoToPilot={() => {
                    setShowEcosystem(false);
                    setShowDemoToPilot(true);
                }}
                onOpenPilotExpansion={() => {
                    setShowEcosystem(false);
                    setShowPilotExpansion(true);
                }}
                onOpenRenewalRisk={() => {
                    setShowEcosystem(false);
                    setShowRenewalRisk(true);
                }}
                onOpenLaunchWeek={() => {
                    setShowEcosystem(false);
                    setShowLaunchWeek(true);
                }}
                onOpenFollowupGenerator={() => {
                    setShowEcosystem(false);
                    setShowFollowupGenerator(true);
                }}
                onOpenFieldFeedback={() => {
                    setShowEcosystem(false);
                    setShowFieldFeedback(true);
                }}
                onOpenPartnerCertification={() => {
                    setShowEcosystem(false);
                    setShowPartnerCertification(true);
                }}
                onOpenManagedServices={() => {
                    setShowEcosystem(false);
                    setShowManagedServices(true);
                }}
                onOpenStrategicAccount={() => {
                    setShowEcosystem(false);
                    setShowStrategicAccount(true);
                }}
                onOpenPortfolioRollout={() => {
                    setShowEcosystem(false);
                    setShowPortfolioRollout(true);
                }}
                onOpenRevenueOps={() => {
                    setShowEcosystem(false);
                    setShowRevenueOps(true);
                }}
                onOpenChannelExpansion={() => {
                    setShowEcosystem(false);
                    setShowChannelExpansion(true);
                }}
                onOpenCrossAccountRenewal={() => {
                    setShowEcosystem(false);
                    setShowCrossAccountRenewal(true);
                }}
                onOpenExecutiveScale={() => {
                    setShowEcosystem(false);
                    setShowExecutiveScale(true);
                }}
                onOpenEcosystemPortfolio={() => {
                    setShowEcosystem(false);
                    setShowEcosystemPortfolio(true);
                }}
                onOpenServiceLine={() => {
                    setShowEcosystem(false);
                    setShowServiceLine(true);
                }}
                onOpenPartnerNetworkGovernance={() => {
                    setShowEcosystem(false);
                    setShowPartnerNetworkGovernance(true);
                }}
                onOpenGlobalPlanning={() => {
                    setShowEcosystem(false);
                    setShowGlobalPlanning(true);
                }}
                onOpenEcosystemRevenue={() => {
                    setShowEcosystem(false);
                    setShowEcosystemRevenue(true);
                }}
                onOpenBoardOperatingPack={() => {
                    setShowEcosystem(false);
                    setShowBoardOperatingPack(true);
                }}
                onOpenLicensedOperator={() => {
                    setShowEcosystem(false);
                    setShowLicensedOperator(true);
                }}
                onOpenEcosystemCommand={() => {
                    setShowEcosystem(false);
                    setShowEcosystemCommand(true);
                }}
                onOpenShiftConsole={() => {
                    setShowEcosystem(false);
                    setShowShiftConsole(true);
                }}
                onOpenIncidentMode={() => {
                    setShowEcosystem(false);
                    setShowIncidentMode(true);
                }}
                onOpenPolicyRollout={() => {
                    setShowEcosystem(false);
                    setShowPolicyRollout(true);
                }}
                onOpenOfflineUpdates={() => {
                    setShowEcosystem(false);
                    setShowOfflineUpdateConsole(true);
                }}
                onOpenMissionScheduler={() => {
                    setShowEcosystem(false);
                    setShowMissionScheduler(true);
                }}
                applianceModeEnabled={applianceModeEnabled}
            />
            <MissionControl
                open={showMissionControl}
                onClose={() => setShowMissionControl(false)}
                runtimeState={runtimeState}
                events={runtimeEvents}
                onOpenSettings={openSettings}
                onOpenFleet={() => setShowFleetControl(true)}
                onOpenRecovery={() => setShowRecoveryCenter(true)}
                onOpenAppliance={() => setShowApplianceConsole(true)}
                onOpenAirGap={() => setShowAirGapOperations(true)}
                onOpenTrustFabric={() => setShowTrustFabric(true)}
                onOpenHardwareAppliance={() => setShowHardwareAppliance(true)}
                onOpenCourierTransfer={() => setShowCourierTransfer(true)}
                onOpenContinuityDrills={() => setShowContinuityDrills(true)}
                onOpenProcurementCommand={() => setShowProcurementCommand(true)}
                onOpenTamperSimulation={() => setShowTamperSimulation(true)}
                onOpenInstitutionalCommand={() => setShowInstitutionalCommand(true)}
                onOpenDemoFlow={() => setShowDemoFlow(true)}
                onOpenDeploymentProgram={() => setShowDeploymentProgram(true)}
                onOpenTrainingDelivery={() => setShowTrainingDelivery(true)}
                onOpenSupportOps={() => setShowSupportOps(true)}
                onOpenBuyerJourney={() => setShowBuyerJourney(true)}
                onOpenPilotConversion={() => setShowPilotConversion(true)}
                onOpenCommercialPackages={() => setShowCommercialPackages(true)}
                onOpenFieldLaunch={() => setShowFieldLaunch(true)}
                onOpenPartnerRollout={() => setShowPartnerRollout(true)}
                onOpenBuyerOps={() => setShowBuyerOps(true)}
                onOpenDemoToPilot={() => setShowDemoToPilot(true)}
                onOpenPilotExpansion={() => setShowPilotExpansion(true)}
                onOpenRenewalRisk={() => setShowRenewalRisk(true)}
                onOpenLaunchWeek={() => setShowLaunchWeek(true)}
                onOpenFollowupGenerator={() => setShowFollowupGenerator(true)}
                onOpenFieldFeedback={() => setShowFieldFeedback(true)}
                onOpenPartnerCertification={() => setShowPartnerCertification(true)}
                onOpenManagedServices={() => setShowManagedServices(true)}
                onOpenStrategicAccount={() => setShowStrategicAccount(true)}
                onOpenPortfolioRollout={() => setShowPortfolioRollout(true)}
                onOpenRevenueOps={() => setShowRevenueOps(true)}
                onOpenChannelExpansion={() => setShowChannelExpansion(true)}
                onOpenCrossAccountRenewal={() => setShowCrossAccountRenewal(true)}
                onOpenExecutiveScale={() => setShowExecutiveScale(true)}
                onOpenEcosystemPortfolio={() => setShowEcosystemPortfolio(true)}
                onOpenServiceLine={() => setShowServiceLine(true)}
                onOpenPartnerNetworkGovernance={() => setShowPartnerNetworkGovernance(true)}
                onOpenGlobalPlanning={() => setShowGlobalPlanning(true)}
                onOpenEcosystemRevenue={() => setShowEcosystemRevenue(true)}
                onOpenBoardOperatingPack={() => setShowBoardOperatingPack(true)}
                onOpenLicensedOperator={() => setShowLicensedOperator(true)}
                onOpenEcosystemCommand={() => setShowEcosystemCommand(true)}
                onOpenShift={() => setShowShiftConsole(true)}
                onOpenIncidentMode={() => setShowIncidentMode(true)}
                onOpenPolicyRollout={() => setShowPolicyRollout(true)}
                onOpenOfflineUpdates={() => setShowOfflineUpdateConsole(true)}
                onOpenMissionScheduler={() => setShowMissionScheduler(true)}
                onOpenNodeChain={() => setShowNodeChainPanel(true)}
                onOpenWatchdog={() => setShowRuntimeAlerts(true)}
                onOpenFirstBoot={() => {
                    reopenFirstBoot();
                    setShowFirstBootWizard(true);
                }}
                onOpenSplitWorkspace={() => setShowSplitWorkspace(true)}
            />
            <FleetControlPanel
                open={showFleetControl}
                onClose={() => setShowFleetControl(false)}
                fleet={fleet}
                onImportLocalRuntime={importLocalRuntimeNode}
            />
            <RecoveryCenter
                open={showRecoveryCenter}
                onClose={() => setShowRecoveryCenter(false)}
            />
            <ApplianceConsole
                open={showApplianceConsole}
                onClose={() => setShowApplianceConsole(false)}
                enabled={applianceModeEnabled}
                onToggleEnabled={async (nextEnabled) => {
                    setApplianceModeEnabled(Boolean(nextEnabled));
                    if (!(window.api && window.api.settings && typeof window.api.settings.get === 'function')) return;
                    try {
                        const current = await window.api.settings.get();
                        const base = current && typeof current === 'object' ? current : {};
                        if (nextEnabled) {
                            await window.api.settings.update({
                                ...base,
                                offlineOnlyEnforced: true,
                                allowRemoteBridge: false,
                                autoUpdateChannel: 'locked',
                            });
                        }
                    } catch {
                        // best effort update only
                    }
                }}
                runtimeState={runtimeState}
                fleetSummary={fleet.healthSummary}
            />
            <AirGapOperationsCenter
                open={showAirGapOperations}
                onClose={() => setShowAirGapOperations(false)}
                locked={airGapLocked}
                onToggleLocked={async (nextLocked) => {
                    const shouldLock = Boolean(nextLocked);
                    setAirGapLocked(shouldLock);
                    if (!(window.api && window.api.settings && typeof window.api.settings.get === 'function')) return;
                    try {
                        const current = await window.api.settings.get();
                        const base = current && typeof current === 'object' ? current : {};
                        await window.api.settings.update({
                            ...base,
                            offlineOnlyEnforced: shouldLock,
                            allowRemoteBridge: shouldLock ? false : Boolean(base.allowRemoteBridge),
                            autoUpdateChannel: shouldLock ? 'frozen' : String(base.autoUpdateChannel || 'stable'),
                        });
                    } catch {
                        // best effort update
                    }
                    appendRuntimeEvent(
                        shouldLock ? 'airgap.lock.enabled' : 'airgap.lock.disabled',
                        { source: 'airgap-operations' },
                        { source: 'airgap', severity: shouldLock ? 'critical' : 'warning' },
                    );
                }}
            />
            <TrustFabricConsole
                open={showTrustFabric}
                onClose={() => setShowTrustFabric(false)}
            />
            <HardwareApplianceManager
                open={showHardwareAppliance}
                onClose={() => setShowHardwareAppliance(false)}
            />
            <CourierTransferCenter
                open={showCourierTransfer}
                onClose={() => setShowCourierTransfer(false)}
            />
            <ContinuityDrillCenter
                open={showContinuityDrills}
                onClose={() => setShowContinuityDrills(false)}
            />
            <ProcurementCommandCenter
                open={showProcurementCommand}
                onClose={() => setShowProcurementCommand(false)}
            />
            <TamperSimulationCenter
                open={showTamperSimulation}
                onClose={() => setShowTamperSimulation(false)}
            />
            <InstitutionalCommandConsole
                open={showInstitutionalCommand}
                onClose={() => setShowInstitutionalCommand(false)}
                onOpenPanel={openRuntimePanelById}
            />
            <DemoFlowConsole
                open={showDemoFlow}
                onClose={() => setShowDemoFlow(false)}
                enabled={demoModeEnabled}
                onToggleEnabled={setDemoModeEnabled}
                onOpenPanel={openRuntimePanelById}
            />
            <DeploymentProgramCenter
                open={showDeploymentProgram}
                onClose={() => setShowDeploymentProgram(false)}
            />
            <TrainingDeliveryCenter
                open={showTrainingDelivery}
                onClose={() => setShowTrainingDelivery(false)}
            />
            <SupportOpsConsole
                open={showSupportOps}
                onClose={() => setShowSupportOps(false)}
            />
            <BuyerEvaluationCenter
                open={showBuyerJourney}
                onClose={() => setShowBuyerJourney(false)}
            />
            <PilotConversionConsole
                open={showPilotConversion}
                onClose={() => setShowPilotConversion(false)}
            />
            <CommercialPackageConsole
                open={showCommercialPackages}
                onClose={() => setShowCommercialPackages(false)}
            />
            <FieldLaunchCommandCenter
                open={showFieldLaunch}
                onClose={() => setShowFieldLaunch(false)}
                onOpenPanel={openRuntimePanelById}
            />
            <PartnerRolloutConsole
                open={showPartnerRollout}
                onClose={() => setShowPartnerRollout(false)}
            />
            <BuyerOpsConsole
                open={showBuyerOps}
                onClose={() => setShowBuyerOps(false)}
            />
            <DemoToPilotConsole
                open={showDemoToPilot}
                onClose={() => setShowDemoToPilot(false)}
            />
            <PilotExpansionConsole
                open={showPilotExpansion}
                onClose={() => setShowPilotExpansion(false)}
            />
            <RenewalRiskConsole
                open={showRenewalRisk}
                onClose={() => setShowRenewalRisk(false)}
            />
            <LaunchWeekCommandCenter
                open={showLaunchWeek}
                onClose={() => setShowLaunchWeek(false)}
                onOpenPanel={openRuntimePanelById}
            />
            <FollowupGenerator
                open={showFollowupGenerator}
                onClose={() => setShowFollowupGenerator(false)}
            />
            <FieldFeedbackConsole
                open={showFieldFeedback}
                onClose={() => setShowFieldFeedback(false)}
            />
            <PartnerCertificationHub
                open={showPartnerCertification}
                onClose={() => setShowPartnerCertification(false)}
            />
            <ManagedServicesConsole
                open={showManagedServices}
                onClose={() => setShowManagedServices(false)}
            />
            <StrategicAccountConsole
                open={showStrategicAccount}
                onClose={() => setShowStrategicAccount(false)}
            />
            <PortfolioRolloutPlanner
                open={showPortfolioRollout}
                onClose={() => setShowPortfolioRollout(false)}
            />
            <RevenueOpsConsole
                open={showRevenueOps}
                onClose={() => setShowRevenueOps(false)}
            />
            <ChannelExpansionPlanner
                open={showChannelExpansion}
                onClose={() => setShowChannelExpansion(false)}
            />
            <CrossAccountRenewalMatrix
                open={showCrossAccountRenewal}
                onClose={() => setShowCrossAccountRenewal(false)}
            />
            <ExecutiveScaleDashboard
                open={showExecutiveScale}
                onClose={() => setShowExecutiveScale(false)}
                onOpenPanel={openRuntimePanelById}
            />
            <EcosystemPortfolioConsole
                open={showEcosystemPortfolio}
                onClose={() => setShowEcosystemPortfolio(false)}
            />
            <ServiceLineConsole
                open={showServiceLine}
                onClose={() => setShowServiceLine(false)}
            />
            <PartnerNetworkGovernance
                open={showPartnerNetworkGovernance}
                onClose={() => setShowPartnerNetworkGovernance(false)}
            />
            <GlobalPlanningConsole
                open={showGlobalPlanning}
                onClose={() => setShowGlobalPlanning(false)}
            />
            <EcosystemRevenuePlanner
                open={showEcosystemRevenue}
                onClose={() => setShowEcosystemRevenue(false)}
            />
            <BoardOperatingPackConsole
                open={showBoardOperatingPack}
                onClose={() => setShowBoardOperatingPack(false)}
            />
            <LicensedOperatorFramework
                open={showLicensedOperator}
                onClose={() => setShowLicensedOperator(false)}
            />
            <EcosystemCommandCenter
                open={showEcosystemCommand}
                onClose={() => setShowEcosystemCommand(false)}
                onOpenPanel={openRuntimePanelById}
            />
            <ShiftConsole
                open={showShiftConsole}
                onClose={() => setShowShiftConsole(false)}
                role={activeRuntimeRole}
                onChangeRole={(nextRole) => setActiveRuntimeRole(nextRole)}
                fleetNodes={fleet.nodes}
                incidents={incidents.filter((entry) => String(entry && entry.status ? entry.status : '') === 'open')}
            />
            <IncidentModePanel
                open={showIncidentMode}
                onClose={() => setShowIncidentMode(false)}
                incidents={incidents}
                fleetNodes={fleet.nodes}
                onDeclare={(input) => {
                    const nextIncident = {
                        incidentId: `inc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                        title: String(input && input.title ? input.title : 'Runtime Incident'),
                        severity: String(input && input.severity ? input.severity : 'degraded'),
                        status: 'open',
                        declaredAt: new Date().toISOString(),
                        affectedNodes: Array.isArray(input && input.affectedNodes) ? input.affectedNodes : [],
                        timeline: [],
                    };
                    setIncidents((prev) => [nextIncident, ...(Array.isArray(prev) ? prev : [])].slice(0, 250));
                    appendRuntimeEvent('incident.declared', {
                        incidentId: nextIncident.incidentId,
                        severity: nextIncident.severity,
                        affectedNodes: nextIncident.affectedNodes.length,
                    }, { source: 'incident', severity: nextIncident.severity === 'critical' ? 'critical' : 'degraded' });
                    return nextIncident;
                }}
                onResolve={(incidentId) => {
                    setIncidents((prev) => (Array.isArray(prev) ? prev.map((entry) => (
                        String(entry.incidentId || '') === String(incidentId || '')
                            ? {
                                ...entry,
                                status: 'resolved',
                                resolvedAt: new Date().toISOString(),
                            }
                            : entry
                    )) : prev));
                    appendRuntimeEvent('incident.resolved', { incidentId: String(incidentId || '') }, { source: 'incident', severity: 'info' });
                }}
                onApplyPlaybook={(playbook, activeIncident) => {
                    const incidentId = String(activeIncident && activeIncident.incidentId ? activeIncident.incidentId : '');
                    if (!incidentId) return;
                    setIncidents((prev) => (Array.isArray(prev) ? prev.map((entry) => {
                        if (String(entry.incidentId || '') !== incidentId) return entry;
                        return {
                            ...entry,
                            timeline: [...(Array.isArray(entry.timeline) ? entry.timeline : []), {
                                at: new Date().toISOString(),
                                type: 'incident.playbook.applied',
                                source: 'incident',
                                detail: {
                                    playbookId: String(playbook && playbook.id ? playbook.id : ''),
                                    playbookTitle: String(playbook && playbook.title ? playbook.title : ''),
                                },
                            }].slice(-400),
                        };
                    }) : prev));
                    appendRuntimeEvent('incident.playbook.applied', {
                        incidentId,
                        playbookId: String(playbook && playbook.id ? playbook.id : ''),
                    }, { source: 'incident', severity: 'warning' });
                }}
                onTriggerSafeMode={async () => {
                    if (!(window.api && window.api.settings && typeof window.api.settings.get === 'function')) return;
                    try {
                        const current = await window.api.settings.get();
                        await window.api.settings.update({
                            ...(current || {}),
                            offlineOnlyEnforced: true,
                            allowRemoteBridge: false,
                            autoUpdateChannel: 'frozen',
                        });
                    } catch {
                        // best effort
                    }
                    appendRuntimeEvent('incident.safe_mode.enabled', {}, { source: 'incident', severity: 'critical' });
                }}
            />
            <PolicyRolloutConsole
                open={showPolicyRollout}
                onClose={() => setShowPolicyRollout(false)}
                fleet={fleet}
                history={policyRolloutHistory}
                onApplyRollout={({ bundle, nodeIds, mode, scheduledFor }) => {
                    const payload = bundle && bundle.payload && typeof bundle.payload === 'object' ? bundle.payload : {};
                    const policyProfile = String(payload.policyProfile || payload.label || payload.policyId || 'fleet-policy');
                    const policyId = String(payload.policyId || policyProfile || 'policy');
                    const rolloutRecord = {
                        rolloutId: `rollout-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                        policyId,
                        policyProfile,
                        nodeIds: Array.isArray(nodeIds) ? nodeIds : [],
                        mode: String(mode || 'immediate'),
                        scheduledFor: scheduledFor || '',
                        status: 'applied',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                    fleet.applyPolicyBundle({ policyProfile, policyId }, rolloutRecord.nodeIds, { mode: rolloutRecord.mode });
                    setPolicyRolloutHistory((prev) => [rolloutRecord, ...(Array.isArray(prev) ? prev : [])].slice(0, 250));
                    appendRuntimeEvent('fleet.policy.rollout.applied', {
                        rolloutId: rolloutRecord.rolloutId,
                        policyProfile,
                        targets: rolloutRecord.nodeIds.length,
                        mode: rolloutRecord.mode,
                    }, { source: 'fleet-policy', severity: 'info' });
                }}
                onRollbackRollout={(entry) => {
                    const record = entry && typeof entry === 'object' ? entry : {};
                    const nodeIds = Array.isArray(record.nodeIds) ? record.nodeIds : [];
                    nodeIds.forEach((nodeId) => {
                        fleet.rollbackPolicy(nodeId, 'none');
                    });
                    setPolicyRolloutHistory((prev) => (Array.isArray(prev) ? prev.map((row) => (
                        String(row.rolloutId || '') === String(record.rolloutId || '')
                            ? {
                                ...row,
                                status: 'rolled_back',
                                updatedAt: new Date().toISOString(),
                            }
                            : row
                    )) : prev));
                    appendRuntimeEvent('fleet.policy.rollout.rolled_back', {
                        rolloutId: String(record.rolloutId || ''),
                        targets: nodeIds.length,
                    }, { source: 'fleet-policy', severity: 'warning' });
                }}
            />
            <OfflineUpdateConsole
                open={showOfflineUpdateConsole}
                onClose={() => setShowOfflineUpdateConsole(false)}
                fleet={fleet}
            />
            <MissionScheduler
                open={showMissionScheduler}
                onClose={() => setShowMissionScheduler(false)}
                fleet={fleet}
                onOpenIncidentMode={() => setShowIncidentMode(true)}
            />
            <NodeChainPanel
                open={showNodeChainPanel}
                onClose={() => setShowNodeChainPanel(false)}
                onSnapshotRequest={triggerNodeChainSnapshot}
                onOpenPanel={openRuntimePanelById}
            />
            <RuntimeAlertsDrawer
                open={showRuntimeAlerts}
                alerts={watchdogAlerts}
                onClose={() => setShowRuntimeAlerts(false)}
                onAcknowledge={acknowledgeWatchdogAlert}
            />
            <SplitWorkspace
                open={showSplitWorkspace}
                onClose={() => setShowSplitWorkspace(false)}
                runtimeState={runtimeState}
                onRestoreSnapshotPayload={restoreSnapshotPayload}
                alerts={watchdogAlerts}
                proofStdout={latestProofStdout}
                releaseHealth={runtimeState && runtimeState.releaseHealth ? runtimeState.releaseHealth : {}}
            />
            {showFirstBootWizard && (
                <FirstBootWizard
                    open={showFirstBootWizard}
                    steps={firstBootSteps}
                    progress={firstBootProgress}
                    busyStepId={firstBootBusyStepId}
                    onRunStep={runFirstBootStep}
                    onSkipStep={skipFirstBootStep}
                    onClose={() => {
                        setShowFirstBootWizard(false);
                        dismissFirstBoot();
                    }}
                    onFinish={handleFinishFirstBoot}
                />
            )}
            {canUseOnboardingWizard && showOnboarding && !showFirstBootWizard && (
                <OnboardingWizard
                    open={showOnboarding}
                    onClose={handleCloseOnboarding}
                    onOpenSettings={openSettings}
                    onRunCommand={executeSignal}
                />
            )}
            <IssueAssistModal
                open={showIssueAssist}
                onClose={() => setShowIssueAssist(false)}
                metadata={{
                    tier: runtimeCapabilityPayload.tierLabel,
                    version: 'NeuralShell_V2.2.0',
                    workflowId: workflowId || '',
                    supportBundlePath: supportBundleMeta.outputPath || '',
                    supportBundleHash: supportBundleMeta.sha256 || '',
                }}
            />
            <SuccessCaptureModal
                open={showSuccessCapture}
                onClose={() => setShowSuccessCapture(false)}
                workflowId={workflowId || ''}
                tierLabel={runtimeCapabilityPayload.tierLabel}
            />

            {sessionDialog.open && (
                <div
                    data-testid="session-modal-overlay"
                    className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeSessionDialog();
                        }
                    }}
                >
                    <div
                        data-testid="session-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={sessionDialogTitleId}
                        aria-describedby={sessionDialogDescriptionId}
                        className="w-full max-w-md rounded-2xl border border-cyan-400/20 bg-slate-950 shadow-[0_20px_80px_rgba(0,0,0,0.7)] p-6"
                    >
                        <h2 id={sessionDialogTitleId} className="text-lg font-bold text-cyan-100 tracking-wide mb-2">
                            {sessionDialog.mode === 'create' ? 'Create Session' : 'Unlock Session'}
                        </h2>
                        <p id={sessionDialogDescriptionId} className="text-[11px] text-slate-400 font-mono mb-5">
                            {sessionDialog.mode === 'create'
                                ? 'Set a session name and passphrase. The passphrase stays local to this runtime.'
                                : `Enter the passphrase for "${sessionDialog.targetSession}".`}
                        </p>
                        <form onSubmit={handleSessionDialogSubmit} className="space-y-4">
                            {sessionDialog.mode === 'create' && (
                                <label className="block">
                                    <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-bold">Session Name</span>
                                    <input
                                        ref={sessionNameInputRef}
                                        data-testid="session-modal-name-input"
                                        value={sessionNameDraft}
                                        onChange={(e) => setSessionNameDraft(e.target.value)}
                                        placeholder="Workflow_ALPHA"
                                        autoFocus
                                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/40"
                                    />
                                </label>
                            )}
                            <label className="block">
                                <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-bold">Passphrase</span>
                                <input
                                    ref={sessionPassInputRef}
                                    data-testid="session-modal-pass-input"
                                    type="password"
                                    value={sessionPassphraseDraft}
                                    onChange={(e) => setSessionPassphraseDraft(e.target.value)}
                                    placeholder="Required"
                                    autoFocus={sessionDialog.mode !== 'create'}
                                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/40"
                                />
                            </label>
                            {sessionDialogError && (
                                <div data-testid="session-modal-error" className="text-[11px] text-rose-300 font-mono">
                                    {sessionDialogError}
                                </div>
                            )}
                            <div className="pt-2 flex gap-2 justify-end">
                                <button
                                    ref={sessionCancelButtonRef}
                                    type="button"
                                    data-testid="session-modal-cancel-btn"
                                    onClick={closeSessionDialog}
                                    className="px-4 py-2 rounded-lg border border-white/10 text-[10px] uppercase tracking-[0.14em] font-bold text-slate-300 hover:bg-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    ref={sessionSubmitButtonRef}
                                    type="submit"
                                    data-testid="session-modal-submit-btn"
                                    className="px-4 py-2 rounded-lg border border-cyan-300/30 bg-cyan-400/10 text-[10px] uppercase tracking-[0.14em] font-bold text-cyan-200 hover:bg-cyan-400/20"
                                >
                                    {sessionDialog.mode === 'create' ? 'Create Session' : 'Unlock Session'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;




