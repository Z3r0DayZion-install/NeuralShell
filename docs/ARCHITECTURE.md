# The Codex: NeuralShell Architecture

> "The structure of the system reflects the structure of the intelligence it houses."

## 1. The Hexagonal Core
NeuralShell follows a **Hexagonal Architecture (Ports & Adapters)** to ensure future-proofing. The core logic is isolated from the outside world (HTTP, Docker, Filesystem).

### 1.1 The Nucleus (Domain Layer)
*   **Location:** `src/intelligence/`, `src/economy/`, `src/swarm/`
*   **Responsibility:** Pure business logic.
    *   *Orchestrator:* Decision making.
    *   *Ledger:* Economic truth.
    *   *EvolutionEngine:* Self-optimization.
*   **Constraint:** Zero dependencies on HTTP frameworks or specific databases (abstracted via adapters).

### 1.2 The Membrane (Application Layer)
*   **Location:** `src/agents/`, `src/plugins/`
*   **Responsibility:** Coordinating the Nucleus to perform tasks.
    *   *GenesisAgent:* Coordinates `ProjectManager` and `ContainerManager`.
    *   *RagPlugin:* Coordinates `DatabaseMemory` and `EmbeddingEngine`.

### 1.3 The Interface (Ports)
*   **Primary Port:** `production-server.js` (Fastify Gateway).
*   **Secondary Port:** `src/hive/meshNode.js` (P2P WebSocket).
*   **Tertiary Port:** `src/sandbox/hardenedSandbox.js` (Docker Execution).

---

## 2. The Swarm Topology
The system creates a **Local-First DAO**.

```
[User] <--> [Mission Control (UI)]
                   |
            [Gateway API]
                   |
      +------------+------------+
      |            |            |
 [Orchestrator] [Ledger] [Marketplace]
      |            |            |
      v            v            v
  [Researcher]  [Coder]     [Dreamer]
      |            |            |
   (Web/Sim)    (Docker)    (Genesis)
```

## 3. Data Sovereignty (The Dark Node)
*   **Memory:** `pgvector` (PostgreSQL) stores semantic embeddings.
*   **Embeddings:** `Transformers.js` (ONNX) runs locally. No API calls.
*   **Execution:** `Docker` containers run untrusted code in isolation.

## 4. Future Proofing Protocols
1.  **Agent Protocol:** All agents inherit `BaseAgent` and communicate via `MessageBus`. New agents simply need to subscribe to a topic.
2.  **Plugin Protocol:** All capabilities implement the `Plugin` interface. Adding a new capability (e.g., Image Generation) requires no core changes.
3.  **Economy Protocol:** All actions have a cost. This prevents infinite loops and spam by enforcing economic constraints.
