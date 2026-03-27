import React from "react";
import { onRuntimeEvent, readRuntimeEvents, RuntimeEventRecord } from "../runtime/runtimeEventBus.ts";

const MAX_FEED = 250;

export function useEventFeed() {
  const [events, setEvents] = React.useState<RuntimeEventRecord[]>(() => readRuntimeEvents().slice(-MAX_FEED));

  React.useEffect(() => {
    setEvents(readRuntimeEvents().slice(-MAX_FEED));
    return onRuntimeEvent((entry) => {
      setEvents((prev) => [...prev, entry].slice(-MAX_FEED));
    });
  }, []);

  const latest = events.length ? events[events.length - 1] : null;

  return {
    events,
    latest,
  };
}

export default useEventFeed;

