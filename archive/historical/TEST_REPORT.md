# NeuralShell v5 Test Report

This document outlines the recommended manual test cases for NeuralShell v5.
Due to the headless build environment, these tests have not been executed
automatically but should be run in a local development environment by the
maintainer.

## Test Environment

Run `npm ci` to install dependencies, then start the app with `npm
start`. Ensure a local Ollama server is running on `127.0.0.1:11434` with
the expected models (e.g. `llama3`).

## Test Cases

### 1. Application Startup

1. Launch the application with `npm start`.
2. Observe that the window opens without errors and the title reads
   *NeuralShell v5*.
3. Verify that the left, centre and right panels are rendered.
4. The LLM status should display *Connected* (in green) if the local
   Ollama instance is reachable; otherwise it should show *Disconnected*
   (in red).

### 2. Model Selection

1. Choose different models from the dropdown in the left panel.
2. Verify that the choice persists after closing and restarting the
   application.
3. Send a simple prompt; confirm that the request is routed to the
   selected model (by inspecting the network requests or LLM logs).

### 3. Sending Messages

1. Type a message in the prompt box and press *Send* or press Enter.
2. Ensure the user message appears in the chat history with the
   appropriate styling.
3. Observe that the assistant response streams into the chat history
   token by token; the interim message should be replaced with a final
   assistant message once complete.
4. Close and reopen the app; the conversation history should be
   restored.

### 4. Session Management

1. Enter a session name and passphrase in the left panel, then click
   *Save*. The session should appear in the list below.
2. Clear the chat by editing the underlying state file or starting a
   new conversation, then load the saved session by selecting its name
   and entering the same passphrase before clicking *Load*.
3. Verify that the chat history is restored exactly and that
   incorrect passphrases display an error.

### 5. System Monitor

1. Observe the CPU, memory, token count and platform information
   updating every two seconds in the right panel.
2. Send several messages to increase the token count; verify that the
   token counter increments accordingly.

### 6. Error Handling & Logging

1. Temporarily stop the Ollama server and click *Send*. Confirm that
   an error message is displayed in the chat history and that the LLM
   status switches to *Disconnected*.
2. Inspect the `app.log` file in the user data directory to ensure
   that the errors are logged.

### 7. Auto-Update Stub

1. When running the packaged app, simulate an update by placing a
   higher version in the update feed directory. Observe that
   update events are logged in `app.log` (automatic installation may not
   occur in development mode).

### 8. Cross‑Platform Packaging

1. On Windows, macOS and Linux hosts run `npm run dist` to build
   installers. Ensure the build completes without errors and produces
   the appropriate artifact for each platform.

### 9. Dynamic Model List & Connection Status

1. Ensure the Ollama server hosts multiple models (e.g. `llama2`, `mistral`, `llama3`).
2. Start the application. Observe that the model selector populates with
   the available models rather than a hard‑coded list.
3. Disconnect the Ollama server. The status label should change from
   *Connected* to *Error*. Reconnect the server; the status should
   transition through *Connecting* back to *Connected*.

### 10. Slash Commands

1. Type `!help` in the prompt input and press Enter. Verify that a
   help message appears listing available commands.
2. Issue `!model mistral` and confirm the model selector updates.
3. Use `!save test1 pass123` to save the current chat; verify it
   appears in the session list. Then clear the chat with `!clear`.
4. Load the saved session with `!load test1 pass123` and ensure the
   conversation is restored.
5. Send `!stats` to display the current model, token count and
   session count. Compare against actual values.
6. Type an unknown command like `!unknown` to ensure an error message
   is returned.

### 11. Session Index Operations

1. After creating several sessions, call `await window.api.session.search('test')` in
   the DevTools console. Verify that sessions containing 'test' in their
   name are returned with metadata.
2. Call `await window.api.session.rename('test1','testOne')` and
   confirm the session file and index entry are renamed. Refresh the
   session list to verify.
3. Call `await window.api.session.delete('testOne')` to remove the
   session. Attempting to load it should fail.

### 12. Plugin Example

1. Send a message starting with `!echo Hello`.
2. Check `app.log` to ensure a line similar to `Echo command: Hello` was
   recorded by the example plugin.

## Observations

All tests should pass without unhandled exceptions. The interface
performance may depend on LLM response time and system resources. The
session encryption requires the same passphrase for load and save.
