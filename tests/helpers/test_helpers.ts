/**
 * Deno Test Helpers
 *
 * Utility functions for Deno testing including mocks, assertions,
 * and test data generators.
 */

import {
  assert,
  assertEquals,
  assertExists,
  assertStrictEquals,
  assertThrows,
  assertRejects,
} from "std/assert";

export { assert, assertEquals, assertExists, assertStrictEquals, assertThrows, assertRejects };

/**
 * Test data generator for common types
 */
export class TestDataGenerator {
  static randomId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  static randomString(length = 10): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static randomNumber(min = 0, max = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static randomBoolean(): boolean {
    return Math.random() < 0.5;
  }

  static randomDate(start?: Date, end?: Date): Date {
    const startDate = start || new Date(2020, 0, 1);
    const endDate = end || new Date();
    return new Date(
      startDate.getTime() +
        Math.random() * (endDate.getTime() - startDate.getTime())
    );
  }

  static randomEmail(): string {
    return `${this.randomString(8)}@${this.randomString(5)}.com`;
  }

  static randomPhone(): string {
    return `${this.randomNumber(200, 999)}-${this.randomNumber(100, 999)}-${this.randomNumber(1000, 9999)}`;
  }

  static randomAddress(): string {
    return `${this.randomNumber(100, 9999)} ${this.randomString(8)} St, ${this.randomString(6)}, ID ${this.randomNumber(10000, 99999)}`;
  }
}

/**
 * Mock factory for creating test doubles
 */
export class MockFactory {
  private mocks: Map<string, any> = new Map();

  create<T extends object>(name: string, defaults?: Partial<T>): T {
    const mock = { ...defaults } as T;
    this.mocks.set(name, mock);
    return mock;
  }

  get<T>(name: string): T | undefined {
    return this.mocks.get(name);
  }

  clear(name?: string): void {
    if (name) {
      this.mocks.delete(name);
    } else {
      this.mocks.clear();
    }
  }

  reset(): void {
    this.mocks.clear();
  }
}

/**
 * Spy for tracking function calls
 */
export class Spy<T extends (...args: any[]) => any> {
  calls: Array<{ args: Parameters<T>; result?: ReturnType<T>; error?: Error }> = [];
  private impl?: T;

  constructor(implementation?: T) {
    this.impl = implementation;
  }

  call(...args: Parameters<T>): ReturnType<T> {
    try {
      const result = this.impl ? this.impl(...args) : undefined;
      this.calls.push({ args, result });
      return result;
    } catch (error) {
      this.calls.push({ args, error: error as Error });
      throw error;
    }
  }

  callCount(): number {
    return this.calls.length;
  }

  calledWith(...args: Parameters<T>): boolean {
    return this.calls.some((call) =>
      JSON.stringify(call.args) === JSON.stringify(args)
    );
  }

  reset(): void {
    this.calls = [];
  }

  getCall(index: number): { args: Parameters<T>; result?: ReturnType<T>; error?: Error } | undefined {
    return this.calls[index];
  }

  lastCall(): { args: Parameters<T>; result?: ReturnType<T>; error?: Error } | undefined {
    return this.calls[this.calls.length - 1];
  }
}

/**
 * Stub for replacing function implementations
 */
export class Stub<T extends (...args: any[]) => any> {
  private returnValue?: ReturnType<T>;
  private throwError?: Error;
  private implementation?: T;

  returns(value: ReturnType<T>): this {
    this.returnValue = value;
    return this;
  }

  throws(error: Error): this {
    this.throwError = error;
    return this;
  }

  callsFake(impl: T): this {
    this.implementation = impl;
    return this;
  }

  call(...args: Parameters<T>): ReturnType<T> {
    if (this.throwError) {
      throw this.throwError;
    }
    if (this.implementation) {
      return this.implementation(...args);
    }
    return this.returnValue as ReturnType<T>;
  }
}

/**
 * Async helpers
 */
export class AsyncHelpers {
  static async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static async waitFor(
    condition: () => boolean | Promise<boolean>,
    options: { timeout?: number; interval?: number } = {}
  ): Promise<void> {
    const timeout = options.timeout || 5000;
    const interval = options.interval || 100;
    const start = Date.now();

    while (Date.now() - start < timeout) {
      if (await condition()) {
        return;
      }
      await this.wait(interval);
    }

    throw new Error(`Condition not met within ${timeout}ms`);
  }

  static async timeout<T>(
    promise: Promise<T>,
    ms: number,
    message = "Operation timed out"
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(message)), ms)
      ),
    ]);
  }
}

/**
 * Test suite helper
 */
export class TestSuite {
  private tests: Array<{ name: string; fn: () => void | Promise<void> }> = [];
  private beforeEachHooks: Array<() => void | Promise<void>> = [];
  private afterEachHooks: Array<() => void | Promise<void>> = [];
  private beforeAllHooks: Array<() => void | Promise<void>> = [];
  private afterAllHooks: Array<() => void | Promise<void>> = [];

  constructor(private name: string) {}

  test(name: string, fn: () => void | Promise<void>): this {
    this.tests.push({ name: `${this.name} - ${name}`, fn });
    return this;
  }

  beforeEach(fn: () => void | Promise<void>): this {
    this.beforeEachHooks.push(fn);
    return this;
  }

  afterEach(fn: () => void | Promise<void>): this {
    this.afterEachHooks.push(fn);
    return this;
  }

  beforeAll(fn: () => void | Promise<void>): this {
    this.beforeAllHooks.push(fn);
    return this;
  }

  afterAll(fn: () => void | Promise<void>): this {
    this.afterAllHooks.push(fn);
    return this;
  }

  async run(): Promise<void> {
    // Run beforeAll hooks
    for (const hook of this.beforeAllHooks) {
      await hook();
    }

    // Run tests
    for (const test of this.tests) {
      // Run beforeEach hooks
      for (const hook of this.beforeEachHooks) {
        await hook();
      }

      // Run test
      try {
        await test.fn();
        console.log(`✓ ${test.name}`);
      } catch (error) {
        console.error(`✗ ${test.name}`);
        console.error(error);
      }

      // Run afterEach hooks
      for (const hook of this.afterEachHooks) {
        await hook();
      }
    }

    // Run afterAll hooks
    for (const hook of this.afterAllHooks) {
      await hook();
    }
  }
}

/**
 * Mock HTTP server for testing
 */
export class MockHTTPServer {
  private routes: Map<string, (req: Request) => Response | Promise<Response>> = new Map();
  private defaultResponse: Response;

  constructor() {
    this.defaultResponse = new Response("Not Found", { status: 404 });
  }

  on(path: string, handler: (req: Request) => Response | Promise<Response>): this {
    this.routes.set(path, handler);
    return this;
  }

  get(path: string, handler: (req: Request) => Response | Promise<Response>): this {
    return this.on(path, (req) => {
      if (req.method === "GET") {
        return handler(req);
      }
      return new Response("Method Not Allowed", { status: 405 });
    });
  }

  post(path: string, handler: (req: Request) => Response | Promise<Response>): this {
    return this.on(path, (req) => {
      if (req.method === "POST") {
        return handler(req);
      }
      return new Response("Method Not Allowed", { status: 405 });
    });
  }

  async handle(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const handler = this.routes.get(url.pathname);

    if (handler) {
      return await handler(req);
    }

    return this.defaultResponse;
  }

  setDefault(response: Response): this {
    this.defaultResponse = response;
    return this;
  }

  clear(): void {
    this.routes.clear();
  }
}

/**
 * Test fixtures loader
 */
export class FixtureLoader {
  static async load<T>(path: string): Promise<T> {
    const content = await Deno.readTextFile(path);
    return JSON.parse(content) as T;
  }

  static async loadText(path: string): Promise<string> {
    return await Deno.readTextFile(path);
  }

  static async save<T>(path: string, data: T): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    await Deno.writeTextFile(path, content);
  }
}

/**
 * Performance measurement
 */
export class PerformanceMeasure {
  private startTime = 0;
  private endTime = 0;

  start(): this {
    this.startTime = performance.now();
    return this;
  }

  end(): number {
    this.endTime = performance.now();
    return this.duration();
  }

  duration(): number {
    return this.endTime - this.startTime;
  }

  static async measure<T>(
    fn: () => T | Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const measure = new PerformanceMeasure();
    measure.start();
    const result = await fn();
    const duration = measure.end();
    return { result, duration };
  }
}

/**
 * Snapshot testing helper
 */
export class SnapshotTester {
  private snapshotDir: string;

  constructor(snapshotDir = "tests/__snapshots__") {
    this.snapshotDir = snapshotDir;
  }

  async matchSnapshot(name: string, data: any): Promise<void> {
    const snapshotPath = `${this.snapshotDir}/${name}.snap.json`;
    const serialized = JSON.stringify(data, null, 2);

    try {
      const existing = await Deno.readTextFile(snapshotPath);
      assertEquals(serialized, existing, `Snapshot mismatch for ${name}`);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        // Create snapshot directory if it doesn't exist
        await Deno.mkdir(this.snapshotDir, { recursive: true });
        // Save new snapshot
        await Deno.writeTextFile(snapshotPath, serialized);
        console.log(`Created new snapshot: ${name}`);
      } else {
        throw error;
      }
    }
  }

  async updateSnapshot(name: string, data: any): Promise<void> {
    const snapshotPath = `${this.snapshotDir}/${name}.snap.json`;
    const serialized = JSON.stringify(data, null, 2);
    await Deno.mkdir(this.snapshotDir, { recursive: true });
    await Deno.writeTextFile(snapshotPath, serialized);
    console.log(`Updated snapshot: ${name}`);
  }
}

/**
 * Export all helpers
 */
export const testHelpers = {
  TestDataGenerator,
  MockFactory,
  Spy,
  Stub,
  AsyncHelpers,
  TestSuite,
  MockHTTPServer,
  FixtureLoader,
  PerformanceMeasure,
  SnapshotTester,
};

export default testHelpers;
