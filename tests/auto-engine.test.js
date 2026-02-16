"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { AutonomousEngine } = require("../src/core/autoEngine");

function createFakeTimers() {
  const timers = new Map();
  let nextId = 1;
  return {
    setInterval(fn) {
      const id = nextId++;
      timers.set(id, fn);
      return id;
    },
    clearInterval(id) {
      timers.delete(id);
    },
    fireAll() {
      for (const fn of timers.values()) fn();
    },
    count() {
      return timers.size;
    }
  };
}

test("AutonomousEngine starts, ticks, and stops", () => {
  const fake = createFakeTimers();
  const ticks = [];
  const engine = new AutonomousEngine((tick) => ticks.push(tick), fake);

  const started = engine.start({ goal: "ship feature", intervalSec: 5 });
  assert.equal(started.running, true);
  assert.equal(started.goal, "ship feature");
  assert.equal(fake.count(), 1);
  assert.equal(ticks.length, 1);
  assert.equal(ticks[0].sequence, 1);

  fake.fireAll();
  assert.equal(ticks.length, 2);
  assert.equal(ticks[1].sequence, 2);

  const stopped = engine.stop();
  assert.equal(stopped.running, false);
  assert.equal(fake.count(), 0);
});

test("AutonomousEngine validates input", () => {
  const engine = new AutonomousEngine(() => {});
  assert.throws(() => engine.start({ goal: "", intervalSec: 5 }));
  assert.throws(() => engine.start({ goal: "x", intervalSec: 2 }));
});
