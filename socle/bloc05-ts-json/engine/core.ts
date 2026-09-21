/* engine/core.ts — the heart of the game.

   No dependency, neither Node nor browser specific: this file is shared by
   play.ts (terminal, blocs 3 to 5) and play.html (browser, bloc 6).
   You do not need to read it to play. You are not allowed to edit it to win. */

export const XP_PER_QUEST = 100;
export const XP_PER_CHALLENGE = 25;
export const TEST_TIMEOUT_MS = 3000;

export interface Rank {
  readonly xp: number;
  readonly name: string;
  readonly icon: string;
}

export const RANKS: readonly Rank[] = [
  { xp: 0, name: "Intern", icon: "🐣" },
  { xp: 200, name: "Junior", icon: "🌱" },
  { xp: 450, name: "Mid-level", icon: "⚡" },
  { xp: 700, name: "Senior", icon: "🔥" },
  { xp: 950, name: "Lead", icon: "🚀" },
  { xp: 1200, name: "Armando le GOAT ENFAITE EUUUUUH", icon: "👑" },
];

export function rankFor(xp: number): Rank {
  let current = RANKS[0];
  for (const rank of RANKS) if (xp >= rank.xp) current = rank;
  return current;
}

export function nextRank(xp: number): Rank | null {
  return RANKS.find((rank) => rank.xp > xp) ?? null;
}

/* ------------------------------------------------------------------ */
/* Formatting values in error messages                                 */
/* ------------------------------------------------------------------ */

const FORMAT_LIMIT = 240;
const MAX_DEPTH = 2;

/* core.ts is type-checked without the DOM library (blocs 3 to 5 run in
   Node), so DOM values are described structurally and detected through
   globalThis. */
export interface ElementLike {
  readonly tagName: string;
  readonly attributes: Iterable<{ name: string; value: string }>;
  readonly textContent: string | null;
  readonly classList?: { contains(name: string): boolean } & Iterable<string>;
  readonly children?: { length: number };
  readonly isConnected?: boolean;
  hasAttribute?(name: string): boolean;
  getAttribute?(name: string): string | null;
}

type Constructor = abstract new (...args: never[]) => unknown;
const dom = globalThis as unknown as {
  Element?: Constructor;
  Node?: Constructor;
  NodeList?: Constructor;
  HTMLCollection?: Constructor;
};
const isElement = (value: unknown): value is ElementLike =>
  dom.Element !== undefined && value instanceof dom.Element;
const isNode = (value: unknown): value is { nodeName: string } =>
  dom.Node !== undefined && value instanceof dom.Node;
const isNodeList = (value: unknown): value is { length: number } =>
  dom.NodeList !== undefined && value instanceof dom.NodeList;
const isHtmlCollection = (value: unknown): value is { length: number } =>
  dom.HTMLCollection !== undefined && value instanceof dom.HTMLCollection;

export function format(value: unknown, depth = 0): string {
  const text = formatRaw(value, depth);
  return text.length > FORMAT_LIMIT ? `${text.slice(0, FORMAT_LIMIT - 1)}…` : text;
}

function formatRaw(value: unknown, depth: number): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") return Object.is(value, -0) ? "-0" : String(value);
  if (typeof value === "bigint") return `${value}n`;
  if (typeof value === "boolean") return String(value);
  if (typeof value === "symbol") return value.toString();
  if (typeof value === "function") return `[function ${value.name || "anonymous"}]`;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? "Date(invalid)" : `Date(${value.toISOString()})`;
  if (value instanceof Error) return `${value.name}(${JSON.stringify(value.message)})`;
  if (value instanceof RegExp) return String(value);
  if (isElement(value)) return describeElement(value);
  if (isNode(value)) return `[node ${value.nodeName}]`;
  if (isNodeList(value)) return `NodeList(${value.length})`;
  if (isHtmlCollection(value)) return `HTMLCollection(${value.length})`;
  if (value instanceof Promise) return "[promise]";
  if (value instanceof Map) {
    const entries = [...value].map(
      ([k, v]) => `${formatRaw(k, depth + 1)} => ${formatRaw(v, depth + 1)}`,
    );
    return `Map(${entries.join(", ")})`;
  }
  if (value instanceof Set)
    return `Set(${[...value].map((v) => formatRaw(v, depth + 1)).join(", ")})`;
  if (Array.isArray(value)) {
    if (depth > MAX_DEPTH) return `[…${value.length} items]`;
    return `[${value.map((v) => formatRaw(v, depth + 1)).join(", ")}]`;
  }
  if (typeof value === "object") {
    if (depth > MAX_DEPTH) return "{…}";
    const keys = Object.keys(value);
    if (keys.length === 0) return "{}";
    const record = value as Record<string, unknown>;
    return `{ ${keys.map((k) => `${readableKey(k)}: ${formatRaw(record[k], depth + 1)}`).join(", ")} }`;
  }
  return String(value);
}

function readableKey(key: string): string {
  return /^[a-zA-Z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
}

export function describeElement(element: ElementLike): string {
  const attributes = [...element.attributes]
    .map((a) => ` ${a.name}="${a.value.length > 40 ? `${a.value.slice(0, 37)}…` : a.value}"`)
    .join("");
  const text = (element.textContent ?? "").trim().replace(/\s+/g, " ");
  const preview = text ? ` ${text.length > 30 ? `${text.slice(0, 27)}…` : text}` : "";
  return `<${element.tagName.toLowerCase()}${attributes}>${preview}`;
}

export function typeName(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (isElement(value)) return "DOM element";
  if (value instanceof Date) return "Date";
  if (value instanceof Promise) return "promise";
  return typeof value;
}

/* ------------------------------------------------------------------ */
/* Deep equality                                                       */
/* ------------------------------------------------------------------ */

export function deepEqual(a: unknown, b: unknown, strict = false): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a === "number" && typeof b === "number") return a === b; // +0 and -0
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }
  if (a instanceof RegExp || b instanceof RegExp) {
    return a instanceof RegExp && b instanceof RegExp && String(a) === String(b);
  }
  if (isNode(a) || isNode(b)) return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => deepEqual(item, b[i], strict));
  }
  if (a instanceof Map || b instanceof Map) {
    if (!(a instanceof Map && b instanceof Map) || a.size !== b.size) return false;
    for (const [key, value] of a)
      if (!b.has(key) || !deepEqual(value, b.get(key), strict)) return false;
    return true;
  }
  if (a instanceof Set || b instanceof Set) {
    if (!(a instanceof Set && b instanceof Set) || a.size !== b.size) return false;
    for (const value of a)
      if (![...b].some((other) => deepEqual(value, other, strict))) return false;
    return true;
  }
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  const recordA = a as Record<string, unknown>;
  const recordB = b as Record<string, unknown>;
  const keysA = Object.keys(recordA).filter((k) => strict || recordA[k] !== undefined);
  const keysB = Object.keys(recordB).filter((k) => strict || recordB[k] !== undefined);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => Object.hasOwn(recordB, k) && deepEqual(recordA[k], recordB[k], strict));
}

/* ------------------------------------------------------------------ */
/* expect                                                              */
/* ------------------------------------------------------------------ */

export class AssertionFailure extends Error {
  readonly expected?: string;
  readonly received?: string;
  readonly hint?: string;

  constructor(options: { expected?: string; received?: string; hint?: string; message?: string }) {
    super(options.message ?? `Expected: ${options.expected}\nReceived: ${options.received}`);
    this.name = "AssertionFailure";
    this.expected = options.expected;
    this.received = options.received;
    this.hint = options.hint;
  }
}

function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function hintFor(received: unknown, expected: unknown): string | undefined {
  if (received === undefined && expected !== undefined) {
    return "your function returns undefined: missing `return`, or it never reaches it?";
  }
  if (typeof received === "string" && typeof expected === "string") {
    if (received.trim() === expected.trim())
      return "same text, but extra or missing spaces at the start or the end.";
    if (received.toLowerCase() === expected.toLowerCase()) return "same text, different casing.";
    if (received.replace(/\s+/g, " ") === expected.replace(/\s+/g, " "))
      return "same text, but the whitespace differs (double space? line break?).";
    if (stripAccents(received) === stripAccents(expected)) return "same text, one accent apart.";
  }
  if (typeof received !== typeof expected && received !== undefined && expected !== undefined) {
    if (typeof received === "string" && typeof expected === "number")
      return `you return a string ("${received}") where a number is expected. \`Number(...)\`?`;
    if (typeof received === "number" && typeof expected === "string")
      return "you return a number where a string is expected.";
    return `the type does not match: got ${typeName(received)}, expected ${typeName(expected)}.`;
  }
  if (Array.isArray(received) && Array.isArray(expected)) {
    if (received.length !== expected.length)
      return `wrong array length: ${received.length} item(s) instead of ${expected.length}.`;
    const index = received.findIndex((item, i) => !deepEqual(item, expected[i]));
    if (index >= 0)
      return `first difference at index ${index}: ${format(received[index])} instead of ${format(expected[index])}.`;
  }
  if (isPlainObject(received) && isPlainObject(expected)) {
    const missing = Object.keys(expected).filter((k) => !(k in received));
    const extra = Object.keys(received).filter((k) => !(k in expected));
    if (missing.length)
      return `missing propert${missing.length > 1 ? "ies" : "y"}: ${missing.join(", ")}.`;
    if (extra.length)
      return `unexpected propert${extra.length > 1 ? "ies" : "y"}: ${extra.join(", ")}.`;
    const different = Object.keys(expected).find((k) => !deepEqual(received[k], expected[k]));
    if (different)
      return `property "${different}" is ${format(received[different])} instead of ${format(expected[different])}.`;
  }
  if (
    typeof received === "number" &&
    typeof expected === "number" &&
    Math.abs(received - expected) < 1e-9 &&
    received !== expected
  ) {
    return "a floating point rounding issue: think `Math.round`.";
  }
  return undefined;
}

const isNullish = (value: unknown): value is null | undefined =>
  value === null || value === undefined;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type ErrorClass = new (...args: never[]) => Error;
type ThrowExpectation = string | RegExp | ErrorClass;

export interface Matchers {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toStrictEqual(expected: unknown): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toBeNull(): void;
  toBeUndefined(): void;
  toBeDefined(): void;
  toBeNaN(): void;
  toBeTypeOf(type: string): void;
  toBeInstanceOf(constructor: abstract new (...args: never[]) => unknown): void;
  toBeGreaterThan(n: number): void;
  toBeGreaterThanOrEqual(n: number): void;
  toBeLessThan(n: number): void;
  toBeLessThanOrEqual(n: number): void;
  toBeCloseTo(n: number, decimals?: number): void;
  toBeBetween(low: number, high: number): void;
  toHaveLength(n: number): void;
  toContain(item: unknown): void;
  toContainEqual(item: unknown): void;
  toMatch(pattern: RegExp | string): void;
  toHaveProperty(path: string, value?: unknown): void;
  toStartWith(prefix: string): void;
  toEndWith(suffix: string): void;
  toThrow(expected?: ThrowExpectation): void;
  toHaveClass(className: string): void;
  toHaveAttribute(name: string, value?: string): void;
  toHaveTextContent(text: string | RegExp): void;
  toBeEmptyDOMElement(): void;
}

export interface AsyncMatchers {
  [name: string]: (...args: unknown[]) => Promise<void>;
}

export interface Expectation extends Matchers {
  readonly not: Matchers;
  readonly resolves: AsyncMatchers & { not: AsyncMatchers };
  readonly rejects: AsyncMatchers & { not: AsyncMatchers };
}

function asElement(value: unknown): Partial<ElementLike> {
  return (value ?? {}) as Partial<ElementLike>;
}

export function expect(received: unknown, message?: string): Expectation {
  const prefix = message ? `${message}\n` : "";

  const build = (negated: boolean): Matchers => {
    const fail = (expected: string, receivedText: string, hint?: string): never => {
      throw new AssertionFailure({
        expected: (negated ? "not " : "") + expected,
        received: receivedText,
        hint: negated ? undefined : hint,
        message: `${prefix}Expected: ${negated ? "not " : ""}${expected}\nReceived: ${receivedText}`,
      });
    };
    const check = (
      ok: boolean,
      expected: string,
      receivedText = format(received),
      hint?: string,
    ): void => {
      if (ok === negated) fail(expected, receivedText, hint);
    };
    const num = typeof received === "number" ? received : Number.NaN;

    return {
      toBe: (expected) =>
        check(
          Object.is(received, expected) || (received === 0 && expected === 0),
          format(expected),
          format(received),
          hintFor(received, expected),
        ),
      toEqual: (expected) =>
        check(
          deepEqual(received, expected),
          format(expected),
          format(received),
          hintFor(received, expected),
        ),
      toStrictEqual: (expected) =>
        check(
          deepEqual(received, expected, true),
          `${format(expected)} (strictly)`,
          format(received),
          hintFor(received, expected),
        ),
      toBeTruthy: () => check(Boolean(received), "a truthy value"),
      toBeFalsy: () => check(!received, "a falsy value"),
      toBeNull: () => check(received === null, "null"),
      toBeUndefined: () => check(received === undefined, "undefined"),
      toBeDefined: () => check(received !== undefined, "a defined value"),
      toBeNaN: () => check(Number.isNaN(received), "NaN"),
      toBeTypeOf: (type) =>
        check(
          typeof received === type,
          `a value of type ${type}`,
          `${format(received)} (type ${typeof received})`,
        ),
      toBeInstanceOf: (constructor) => {
        const name = (received as { constructor?: { name?: string } } | null)?.constructor?.name;
        check(
          received instanceof constructor,
          `an instance of ${constructor.name}`,
          `${format(received)}${name ? ` (instance of ${name})` : ""}`,
        );
      },
      toBeGreaterThan: (n) => check(num > n, `a number > ${n}`),
      toBeGreaterThanOrEqual: (n) => check(num >= n, `a number ≥ ${n}`),
      toBeLessThan: (n) => check(num < n, `a number < ${n}`),
      toBeLessThanOrEqual: (n) => check(num <= n, `a number ≤ ${n}`),
      toBeCloseTo: (n, decimals = 2) =>
        check(Math.abs(num - n) < 10 ** -decimals / 2, `≈ ${n} (${decimals} decimals)`),
      toBeBetween: (low, high) =>
        check(num >= low && num <= high, `a number between ${low} and ${high}`),
      toHaveLength: (n) => {
        const length = (received as { length?: unknown } | null)?.length;
        check(
          typeof length === "number" && length === n,
          `a length of ${n}`,
          isNullish(received)
            ? format(received)
            : `a length of ${String(length)} — ${format(received)}`,
        );
      },
      toContain: (item) => {
        if (typeof received === "string")
          return check(received.includes(String(item)), `a string containing ${format(item)}`);
        if (
          !isNullish(received) &&
          typeof (received as Iterable<unknown>)[Symbol.iterator] === "function"
        ) {
          return check(
            [...(received as Iterable<unknown>)].some(
              (e) => Object.is(e, item) || deepEqual(e, item),
            ),
            `a collection containing ${format(item)}`,
          );
        }
        return check(false, `a string or a collection containing ${format(item)}`);
      },
      toContainEqual: (item) =>
        check(
          Array.isArray(received) && received.some((e) => deepEqual(e, item)),
          `an array containing ${format(item)}`,
        ),
      toMatch: (pattern) => {
        const ok =
          typeof received === "string" &&
          (pattern instanceof RegExp ? pattern.test(received) : received.includes(pattern));
        check(
          ok,
          `a string matching ${pattern instanceof RegExp ? String(pattern) : format(pattern)}`,
        );
      },
      toHaveProperty: (path, ...rest) => {
        let current: unknown = received;
        let present = true;
        for (const part of String(path).split(".")) {
          if (isNullish(current) || !(part in Object(current))) {
            present = false;
            break;
          }
          current = (current as Record<string, unknown>)[part];
        }
        if (rest.length >= 1) {
          const value = rest[0];
          check(
            present && deepEqual(current, value),
            `a property "${path}" equal to ${format(value)}`,
            present
              ? `"${path}" is ${format(current)}`
              : `no property "${path}" in ${format(received)}`,
          );
          return;
        }
        check(present, `a property "${path}"`);
      },
      toStartWith: (prefixText) =>
        check(
          typeof received === "string" && received.startsWith(prefixText),
          `a string starting with ${format(prefixText)}`,
        ),
      toEndWith: (suffix) =>
        check(
          typeof received === "string" && received.endsWith(suffix),
          `a string ending with ${format(suffix)}`,
        ),
      toThrow: (expected) => {
        if (typeof received !== "function") {
          throw new AssertionFailure({
            message: `${prefix}expect(...).toThrow() needs a FUNCTION: write expect(() => fn(x)).toThrow(), not expect(fn(x)).toThrow()`,
          });
        }
        let error: unknown;
        let result: unknown;
        let threw = false;
        try {
          result = (received as () => unknown)();
        } catch (e) {
          error = e;
          threw = true;
        }
        if (!threw)
          return check(
            false,
            "a thrown error",
            `no error — the function returned ${format(result)}`,
          );
        if (expected === undefined) return check(true, "a thrown error", format(error));
        const text = error instanceof Error ? error.message : String(error);
        if (typeof expected === "string")
          return check(
            text.includes(expected),
            `an error whose message contains ${format(expected)}`,
            `an error whose message is ${format(text)}`,
          );
        if (expected instanceof RegExp)
          return check(
            expected.test(text),
            `an error whose message matches ${String(expected)}`,
            `an error whose message is ${format(text)}`,
          );
        const name =
          (error as { constructor?: { name?: string } } | null)?.constructor?.name ?? typeof error;
        return check(
          error instanceof expected,
          `an error of type ${expected.name}`,
          `${name}: ${format(text)}`,
        );
      },
      toHaveClass: (className) => {
        const el = asElement(received);
        check(
          el.classList?.contains(className) === true,
          `an element with class "${className}"`,
          el.classList
            ? `${format(received)} — classes: [${[...el.classList].join(", ")}]`
            : format(received),
        );
      },
      toHaveAttribute: (name, value) => {
        const el = asElement(received);
        const present = el.hasAttribute?.(name) === true;
        if (value === undefined) return check(present, `an element with attribute "${name}"`);
        check(
          present && el.getAttribute?.(name) === value,
          `an attribute ${name}="${value}"`,
          present
            ? `${name}="${el.getAttribute?.(name)}"`
            : `no attribute "${name}" on ${format(received)}`,
        );
      },
      toHaveTextContent: (text) => {
        const actual = (asElement(received).textContent ?? "").replace(/\s+/g, " ").trim();
        const ok =
          text instanceof RegExp
            ? text.test(actual)
            : actual.includes(text.replace(/\s+/g, " ").trim());
        check(ok, `an element whose text contains ${format(text)}`, `the text ${format(actual)}`);
      },
      toBeEmptyDOMElement: () => {
        const el = asElement(received);
        check(
          el.children?.length === 0 && (el.textContent ?? "").trim() === "",
          "an empty element",
          format(received),
        );
      },
    };
  };

  const positive = build(false) as Expectation;
  Object.defineProperty(positive, "not", { value: build(true) });
  Object.defineProperty(positive, "resolves", {
    get: () => asyncMatchers(received, false, message),
  });
  Object.defineProperty(positive, "rejects", {
    get: () => asyncMatchers(received, true, message),
  });
  return positive;
}

function asyncMatchers(
  promise: unknown,
  shouldReject: boolean,
  message?: string,
): AsyncMatchers & { not: AsyncMatchers } {
  const settle = async (): Promise<{ value?: unknown; error?: unknown }> => {
    if (!promise || typeof (promise as Promise<unknown>).then !== "function") {
      throw new AssertionFailure({
        message: `expect(...).${shouldReject ? "rejects" : "resolves"} needs a PROMISE, received ${format(promise)}`,
      });
    }
    try {
      const value = await (promise as Promise<unknown>);
      if (shouldReject)
        throw new AssertionFailure({
          message: `Expected: a rejected promise\nReceived: a promise resolved with ${format(value)}`,
        });
      return { value };
    } catch (error) {
      if (error instanceof AssertionFailure) throw error;
      if (!shouldReject)
        throw new AssertionFailure({
          message: `Expected: a resolved promise\nReceived: a promise rejected with ${format(error)}`,
        });
      return { error };
    }
  };
  const target = (settled: { value?: unknown; error?: unknown }): unknown =>
    shouldReject
      ? () => {
          throw settled.error;
        }
      : settled.value;
  const make = (negated: boolean): AsyncMatchers =>
    new Proxy({} as AsyncMatchers, {
      get:
        (_, name: string) =>
        async (...args: unknown[]) => {
          const settled = await settle();
          const matchers = negated
            ? expect(target(settled), message).not
            : expect(target(settled), message);
          (matchers[name as keyof Matchers] as (...a: unknown[]) => void)(...args);
        },
    });
  const matchers = make(false) as AsyncMatchers & { not: AsyncMatchers };
  Object.defineProperty(matchers, "not", { value: make(true) });
  return matchers;
}

/* ------------------------------------------------------------------ */
/* Errors coming from the student module                               */
/* ------------------------------------------------------------------ */

export class MissingExportError extends Error {
  readonly hint: string;

  constructor(name: string, file: string) {
    super(`"${name}" is not exported by ${file}`);
    this.name = "MissingExportError";
    this.hint = `write \`export function ${name}(…) { … }\` in ${file}`;
  }
}

export type StudentModule = Record<string, unknown>;

/** Every missing export becomes a function that throws a readable error. */
export function wrapModule(module: object, file: string): StudentModule {
  const copy: StudentModule = { ...module };
  return new Proxy(copy, {
    get(target, key) {
      if (typeof key !== "string" || key in target) return target[key as string];
      if (key === "then" || key === "toJSON") return undefined;
      const missing = (): never => {
        throw new MissingExportError(key, file);
      };
      Object.defineProperty(missing, "name", { value: key });
      return missing;
    },
    has: (target, key) => key in target,
  });
}

const EXCEPTION_HINTS: ReadonlyArray<[RegExp, (message: string) => string]> = [
  [
    /is not a function/,
    (m) =>
      `not a function: ${m.split(" is not")[0].trim()} is something else (undefined?) — typo in the name, or missing export?`,
  ],
  [
    /Cannot read propert(?:y|ies) of (undefined|null) \(reading '([^']+)'\)/,
    (m) => {
      const match = /of (undefined|null) \(reading '([^']+)'\)/.exec(m);
      return `you read \`.${match?.[2]}\` on ${match?.[1]}: the value right before the dot does not exist. \`console.log\` it, or guard with \`?.\`.`;
    },
  ],
  [
    /Cannot set propert(?:y|ies) of (undefined|null)/,
    () => "you write a property on undefined: the object was not created first.",
  ],
  [
    /is not defined/,
    (m) =>
      `"${m.split(" is not")[0].trim()}" does not exist: undeclared variable, typo, or missing import?`,
  ],
  [/Maximum call stack/, () => "endless recursion: what is your base case?"],
  [
    /Assignment to constant variable/,
    () => "you reassign a `const`: declare it with `let` if it must change.",
  ],
  [
    /Cannot assign to read only property|object is not extensible|Cannot add property/,
    () =>
      "you mutate a frozen object: this test checks that you do NOT touch the original data. Make a copy.",
  ],
  [
    /is not iterable/,
    () => "you iterate (`for…of`, `...`, destructuring) over something that is not an array.",
  ],
  [
    /Unexpected end of JSON|is not valid JSON|JSON\.parse|in JSON at position/,
    () => "the text is not valid JSON.",
  ],
  [
    /\.(map|filter|reduce|find|some|every) is not a function/,
    () => "you call an array method on something that is not an array.",
  ],
];

export type FailureKind = "assertion" | "export" | "timeout" | "exception";

export interface Failure {
  readonly kind: FailureKind;
  readonly message: string;
  readonly expected?: string;
  readonly received?: string;
  readonly hint?: string;
  readonly location?: string;
  raw?: unknown;
}

interface TimeoutError extends Error {
  timeout?: boolean;
}

export function describeFailure(error: unknown, file?: string): Failure {
  if (error instanceof AssertionFailure) {
    return {
      kind: "assertion",
      message: error.message,
      expected: error.expected,
      received: error.received,
      hint: error.hint,
      location: studentLocation(error, file),
    };
  }
  if (error instanceof MissingExportError) {
    return { kind: "export", message: error.message, hint: error.hint };
  }
  if ((error as TimeoutError | null)?.timeout) {
    return {
      kind: "timeout",
      message: (error as Error).message,
      hint: "a loop that never ends, or a promise that never settles?",
    };
  }
  const name = (error as Error | null)?.name ?? "Error";
  const message = error instanceof Error ? error.message : String(error);
  let hint: string | undefined = (error as { hint?: string } | null)?.hint;
  if (!hint) {
    for (const [pattern, describe] of EXCEPTION_HINTS) {
      if (pattern.test(message)) {
        hint = describe(message);
        break;
      }
    }
  }
  return {
    kind: "exception",
    message: `${name}: ${message}`,
    hint,
    location: studentLocation(error, file),
  };
}

function studentLocation(error: unknown, _file?: string): string | undefined {
  const stack = (error as { stack?: unknown } | null)?.stack;
  if (typeof stack !== "string") return undefined;
  const pattern = /(?:src|solution\/src)\/([\w.-]+\.[jt]s)[?\w=]*:(\d+):(\d+)/;
  for (const line of stack.split("\n")) {
    const match = pattern.exec(line);
    if (match) return `src/${match[1]}:${match[2]}`;
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Test context and execution                                          */
/* ------------------------------------------------------------------ */

export type TestFn = () => void | Promise<void>;

export interface TestCase {
  readonly name: string;
  readonly fn: TestFn;
  readonly challenge: boolean;
  readonly xp: number;
}

export interface TestResult extends TestCase {
  readonly ok: boolean;
  readonly durationMs: number;
  readonly failure?: Failure;
}

export interface QuestContext {
  test(name: string, fn: TestFn): void;
  it(name: string, fn: TestFn): void;
  challenge(name: string, fn: TestFn, xp?: number): void;
  expect: typeof expect;
  /** Browser only: a fresh piece of page, optionally filled with HTML.
   *  (Typed precisely as HTMLElement by engine/browser.ts.) */
  sandbox: (html?: string) => object;
  /** Browser only: wait a few milliseconds (0 = a macrotask). */
  wait: (ms?: number) => Promise<void>;
  /** Browser only: was this event cancelled by the student's code? */
  wasPrevented: (event: { readonly defaultPrevented: boolean }) => boolean;
}

export type QuestExtras = Partial<Pick<QuestContext, "sandbox" | "wait" | "wasPrevented">>;

const notAvailable = (name: string) => (): never => {
  throw new Error(`${name}() is only available in the browser runner`);
};

export function createContext(extras: QuestExtras = {}): {
  context: QuestContext;
  tests: TestCase[];
} {
  const tests: TestCase[] = [];
  const test = (name: string, fn: TestFn): void => {
    tests.push({ name, fn, challenge: false, xp: 0 });
  };
  const context: QuestContext = {
    test,
    it: test,
    challenge: (name, fn, xp = XP_PER_CHALLENGE) => {
      tests.push({ name, fn, challenge: true, xp });
    },
    expect,
    sandbox: extras.sandbox ?? notAvailable("sandbox"),
    wait: extras.wait ?? ((ms = 0) => new Promise((resolve) => setTimeout(resolve, ms))),
    wasPrevented: extras.wasPrevented ?? ((event) => event.defaultPrevented),
  };
  return { context, tests };
}

function withTimeout(value: unknown, ms: number): unknown {
  if (!value || typeof (value as Promise<unknown>).then !== "function") return value;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const error: TimeoutError = new Error(`the test exceeded ${ms / 1000} s`);
      error.timeout = true;
      reject(error);
    }, ms);
    (value as Promise<unknown>).then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(timer);
        reject(e as Error);
      },
    );
  });
}

export interface RunOptions {
  beforeEach?: (test: TestCase) => void | Promise<void>;
  afterEach?: (test: TestCase) => void | Promise<void>;
  file?: string;
}

export async function runTests(
  tests: readonly TestCase[],
  { beforeEach, afterEach, file }: RunOptions = {},
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  for (const test of tests) {
    try {
      await beforeEach?.(test);
    } catch {
      /* ignored */
    }
    const start = Date.now();
    try {
      await withTimeout(test.fn(), TEST_TIMEOUT_MS);
      results.push({ ...test, ok: true, durationMs: Date.now() - start });
    } catch (error) {
      results.push({
        ...test,
        ok: false,
        durationMs: Date.now() - start,
        failure: describeFailure(error, file),
      });
    }
    try {
      await afterEach?.(test);
    } catch {
      /* ignored */
    }
  }
  return results;
}

/* ------------------------------------------------------------------ */
/* The game                                                            */
/* ------------------------------------------------------------------ */

export interface Progress {
  unlocked: number;
  xp: number;
  completed: string[];
  challenges: string[];
  finished: boolean;
}

export function emptyProgress(): Progress {
  return { unlocked: 1, xp: 0, completed: [], challenges: [], finished: false };
}

/** What a file in quests/ exports. */
export interface QuestDefinition<M = StudentModule> {
  readonly title: string;
  readonly file: string;
  readonly lesson: string;
  readonly mission: string;
  readonly xp?: number;
  default(context: QuestContext, module: M): void | Promise<void>;
}

export interface LoadedQuest {
  readonly slug: string;
  readonly definition: QuestDefinition;
}

export type LevelState = "done" | "current" | "locked" | "regression";

export interface Level {
  readonly number: number;
  readonly slug: string;
  readonly title: string;
  readonly xp: number;
  readonly file: string;
  readonly lesson: string;
  readonly mission: string;
  state: LevelState;
  results: TestResult[] | null;
  loadFailure: Failure | null;
  typeErrors: string[];
  played: boolean;
  absolutePath?: string;
}

export type GameEvent =
  | { type: "quest"; level: number; title: string; xp: number }
  | { type: "challenge"; level: number; name: string; xp: number }
  | { type: "unlocked"; level: number; title: string }
  | { type: "rank"; rank: Rank }
  | { type: "finished" };

export interface GameOptions {
  all?: boolean;
  level?: number;
}

export interface GameInput {
  quests: readonly LoadedQuest[];
  loadModule: (file: string) => Promise<object>;
  progress?: Partial<Progress>;
  options?: GameOptions;
  extras?: QuestExtras;
  beforeEach?: RunOptions["beforeEach"];
  afterEach?: RunOptions["afterEach"];
  /** Type errors reported by the compiler for a given file (terminal only). */
  typeErrorsFor?: (file: string) => string[];
}

export interface GameReport {
  levels: Level[];
  progress: Progress;
  events: GameEvent[];
  focus: Level | null;
  total: number;
  allDone: boolean;
}

export async function play({
  quests,
  loadModule,
  progress,
  options = {},
  extras = {},
  beforeEach,
  afterEach,
  typeErrorsFor,
}: GameInput): Promise<GameReport> {
  const state: Progress = { ...emptyProgress(), ...(progress ?? {}) };
  const total = quests.length;
  state.unlocked = Math.min(Math.max(1, state.unlocked), total);
  const xpBefore = state.xp;
  const events: GameEvent[] = [];

  const levels: Level[] = quests.map((quest, index) => ({
    number: index + 1,
    slug: quest.slug,
    title: quest.definition.title,
    xp: quest.definition.xp ?? XP_PER_QUEST,
    file: quest.definition.file,
    lesson: quest.definition.lesson,
    mission: quest.definition.mission,
    state: state.completed.includes(quest.slug)
      ? "done"
      : index + 1 <= state.unlocked
        ? "current"
        : "locked",
    results: null,
    loadFailure: null,
    typeErrors: [],
    played: false,
  }));

  const playLevel = async (number: number): Promise<boolean> => {
    const level = levels[number - 1];
    const quest = quests[number - 1];
    level.played = true;
    const failLoad = (error: unknown): false => {
      level.loadFailure = describeFailure(error, quest.definition.file);
      level.loadFailure.raw = error;
      level.results = [];
      level.state = level.state === "done" ? "regression" : "current";
      return false;
    };

    let module: object;
    try {
      module = await loadModule(quest.definition.file);
    } catch (error) {
      return failLoad(error);
    }
    const { context, tests } = createContext(extras);
    try {
      await quest.definition.default(context, wrapModule(module, quest.definition.file));
    } catch (error) {
      return failLoad(error);
    }
    level.results = await runTests(tests, {
      beforeEach,
      afterEach,
      file: quest.definition.file,
    });
    level.typeErrors = typeErrorsFor?.(quest.definition.file) ?? [];
    const required = level.results.filter((r) => !r.challenge);
    const passed =
      required.length > 0 && required.every((r) => r.ok) && level.typeErrors.length === 0;

    for (const result of level.results) {
      if (!result.challenge || !result.ok) continue;
      const key = `${quest.slug}:${result.name}`;
      if (state.challenges.includes(key)) continue;
      state.challenges.push(key);
      state.xp += result.xp;
      events.push({
        type: "challenge",
        level: number,
        name: result.name,
        xp: result.xp,
      });
    }

    if (!passed) {
      level.state = state.completed.includes(quest.slug) ? "regression" : "current";
      return false;
    }
    if (!state.completed.includes(quest.slug)) {
      state.completed.push(quest.slug);
      state.xp += level.xp;
      events.push({
        type: "quest",
        level: number,
        title: level.title,
        xp: level.xp,
      });
    }
    level.state = "done";
    if (number === state.unlocked && number < total) {
      state.unlocked = number + 1;
      levels[number].state = "current";
      events.push({
        type: "unlocked",
        level: number + 1,
        title: levels[number].title,
      });
    }
    return true;
  };

  if (options.all) {
    for (let n = 1; n <= total; n++) await playLevel(n);
  } else if (options.level) {
    await playLevel(Math.min(Math.max(1, options.level), state.unlocked));
  } else {
    // state.unlocked moves forward when a level passes: the next one follows.
    for (let n = 1; n <= state.unlocked; n++) await playLevel(n);
  }

  const rankAfter = rankFor(state.xp);
  if (rankAfter !== rankFor(xpBefore)) events.push({ type: "rank", rank: rankAfter });

  const allDone = levels.every((level) => state.completed.includes(level.slug));
  if (allDone && !state.finished) {
    state.finished = true;
    events.push({ type: "finished" });
  }

  let focus: Level | null = options.level
    ? levels[Math.min(Math.max(1, options.level), state.unlocked) - 1]
    : (levels.find((l) => l.state === "regression") ??
      levels.find((l) => l.state === "current") ??
      null);
  if (options.all) focus = levels.find((l) => l.played && l.state !== "done") ?? null;

  return { levels, progress: state, events, focus, total, allDone };
}

/* ------------------------------------------------------------------ */
/* Lesson rendering: tiny markdown → blocks                            */
/* ------------------------------------------------------------------ */

export type LessonBlock = {
  type: "text" | "code" | "heading";
  content: string;
};

export function splitLesson(text = ""): LessonBlock[] {
  const blocks: LessonBlock[] = [];
  let code: string[] | null = null;
  for (const line of text.replace(/^\n+|\s+$/g, "").split("\n")) {
    if (line.trim().startsWith("```")) {
      if (code === null) code = [];
      else {
        blocks.push({ type: "code", content: code.join("\n") });
        code = null;
      }
      continue;
    }
    if (code !== null) {
      code.push(line);
      continue;
    }
    if (line.startsWith("## ")) blocks.push({ type: "heading", content: line.slice(3) });
    else blocks.push({ type: "text", content: line });
  }
  if (code !== null) blocks.push({ type: "code", content: code.join("\n") });
  return blocks;
}
