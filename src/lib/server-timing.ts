import { cache } from "react";

const LEARN_REQUEST_SCOPE = "GET /learn";

type ServerTimer = {
  measure: <T>(name: string, fn: () => T | Promise<T>) => Promise<T>;
  addDuration: (name: string, ms: number) => void;
  setMeta: (key: string, value: string | number) => void;
  log: () => void;
};

const noopTimer: ServerTimer = {
  measure: async (_name, fn) => fn(),
  addDuration: () => {},
  setMeta: () => {},
  log: () => {},
};

function isLearnTimingEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.ENABLE_LEARN_TIMING === "true"
  );
}

export function createServerTimer(scope: string): ServerTimer {
  if (!isLearnTimingEnabled()) {
    return noopTimer;
  }

  const segments = new Map<string, number>();
  const meta = new Map<string, string | number>();
  const start = performance.now();

  return {
    async measure<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
      const segmentStart = performance.now();

      try {
        return await fn();
      } finally {
        const elapsed = performance.now() - segmentStart;
        segments.set(name, (segments.get(name) ?? 0) + elapsed);
      }
    },
    addDuration(name: string, ms: number) {
      segments.set(name, (segments.get(name) ?? 0) + ms);
    },
    setMeta(key: string, value: string | number) {
      meta.set(key, value);
    },
    log() {
      const auth = segments.get("auth");
      const list = segments.get("list");
      const db = segments.get("db");
      const thumbnails = segments.get("thumbnails");
      const exists = segments.get("exists");
      const presign = segments.get("presign");
      const total = Math.round(performance.now() - start);

      const inner = [
        db !== undefined ? `db=${Math.round(db)}ms` : null,
        thumbnails !== undefined
          ? `thumbnails=${Math.round(thumbnails)}ms`
          : null,
        exists !== undefined ? `exists=${Math.round(exists)}ms` : null,
        presign !== undefined ? `presign=${Math.round(presign)}ms` : null,
      ]
        .filter(Boolean)
        .join(" ");

      const count = meta.get("count");
      const countSuffix = count !== undefined ? ` count=${count}` : "";

      console.log(
        `[learn-timing] ${scope} total=${total}ms` +
          (auth !== undefined ? ` auth=${Math.round(auth)}ms` : "") +
          (list !== undefined ? ` list=${Math.round(list)}ms` : "") +
          (inner ? ` (${inner})` : "") +
          countSuffix
      );
    },
  };
}

const getCachedServerTimer = cache((scope: string) => createServerTimer(scope));

export function getLearnRequestTimer(): ServerTimer {
  return getCachedServerTimer(LEARN_REQUEST_SCOPE);
}
