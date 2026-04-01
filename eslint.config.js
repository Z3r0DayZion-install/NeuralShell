const js = require("@eslint/js");
const security = require("eslint-plugin-security");

module.exports = [
  js.configs.recommended,
  {
    linterOptions: {
      reportUnusedDisableDirectives: "off"
    },
  },
  {
    languageOptions: {
      ecmaVersion: 2021,
      globals: {
        require: "readonly",
        module: "readonly",
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        __dirname: "readonly",
        URL: "readonly",
        fetch: "readonly",
        AbortController: "readonly",
        queueMicrotask: "readonly",
      },
    },
    plugins: {
      security: security,
    },
    rules: {
      "no-unused-vars": "off",
      "no-console": "off",
      "security/detect-object-injection": "off",
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-non-literal-regexp": "off",
      "security/detect-non-literal-require": "off",
    },
  },
  {
    files: ["src/preload.js", "src/renderer.js", "src/runtime/*.js", "tear/smoke-*.js", "src/renderer/src/**/*.js", "src/renderer/src/**/*.jsx"],
    languageOptions: {
      ecmaVersion: 2021,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        Blob: "readonly",
        FileReader: "readonly",
        CustomEvent: "readonly",
        Event: "readonly",
        alert: "readonly",
        api: "readonly",
        checkProfileDrift: "readonly",
        getActiveProfile: "readonly",
        resolveProfileTrustState: "readonly",
        isOfflineMode: "readonly",
        uiPerformDisconnect: "readonly",
        uiSwitchActiveProfile: "readonly",
        uiPerformOfflineEntry: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "off",
      "no-console": "off",
    },
  },
  {
    files: ["tear/**/*.js", "tests/**/*.js"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        before: "readonly",
        after: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        global: "readonly",
        require: "readonly",
        module: "readonly",
        process: "readonly",
        console: "readonly",
      },
    },
  },
];
