# Deno Testing Infrastructure Guide

## Overview

This guide documents the comprehensive Deno testing infrastructure for the Idaho Events project. Deno provides a modern, secure runtime for JavaScript and TypeScript with built-in testing capabilities.

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Test Structure](#test-structure)
4. [Running Tests](#running-tests)
5. [Writing Tests](#writing-tests)
6. [Test Helpers](#test-helpers)
7. [Best Practices](#best-practices)
8. [CI/CD Integration](#cicd-integration)
9. [Troubleshooting](#troubleshooting)

## Installation

### Install Deno

**macOS/Linux:**
```bash
curl -fsSL https://deno.land/install.sh | sh
```

**Windows (PowerShell):**
```powershell
irm https://deno.land/install.ps1 | iex
```

**Alternative (Homebrew on macOS):**
```bash
brew install deno
```

### Verify Installation

```bash
deno --version
```

Expected output:
```
deno 2.0.0 (release, aarch64-apple-darwin)
v8 12.9.xxx
typescript 5.6.xxx
```

### IDE Setup

**VS Code:**
1. Install the official Deno extension
2. Enable Deno in settings: `"deno.enable": true`
3. Set workspace settings in `.vscode/settings.json`:

```json
{
  "deno.enable": true,
  "deno.lint": true,
  "deno.unstable": false,
  "deno.path": "/Users/johnt/.deno/bin/deno"
}
```

## Quick Start

### Run All Tests

```bash
npm run test:deno
```

### Run Unit Tests Only

```bash
npm run test:deno:unit
```

### Run Integration Tests Only

```bash
npm run test:deno:integration
```

### Run Tests with Coverage

```bash
npm run test:deno:coverage
```

### Watch Mode (Auto-rerun on changes)

```bash
npm run test:deno:watch
```

### Run All Test Suites (Jest + Deno + Cypress)

```bash
npm run test:all
```

## Test Structure

### Directory Organization

```
tests/
├── unit/                          # Unit tests
│   ├── transportation.test.ts     # Transportation service tests
│   └── ...                        # Additional unit tests
├── integration/                   # Integration tests
│   ├── transportation-api.test.ts # API integration tests
│   └── ...                        # Additional integration tests
├── helpers/                       # Test utilities
│   └── test_helpers.ts            # Comprehensive test helpers
└── fixtures/                      # Test data fixtures
    └── ...                        # JSON test data
```

### File Naming Conventions

- **Unit tests**: `*.test.ts`
- **Integration tests**: `*.test.ts`
- **Test helpers**: `*_helpers.ts`
- **Fixtures**: `*.json` or `*.fixture.ts`
- **Skip tests**: `*.skip.ts` (excluded from test runs)

## Running Tests

### Deno Task Commands

These commands are defined in `deno.json`:

```bash
# Run all tests
deno task test

# Run unit tests
deno task test:unit

# Run integration tests
deno task test:integration

# Generate coverage report
deno task test:coverage

# Watch mode
deno task test:watch

# Complete test suite with coverage
deno task test:all
```

### npm Script Commands

Equivalent npm commands (automatically set Deno PATH):

```bash
npm run test:deno              # All tests
npm run test:deno:unit         # Unit tests
npm run test:deno:integration  # Integration tests
npm run test:deno:coverage     # Coverage report
npm run test:deno:watch        # Watch mode
npm run test:deno:all          # Full suite
```

### Test Filtering

Run specific test file:
```bash
deno test tests/unit/transportation.test.ts
```

Run tests matching pattern:
```bash
deno test --filter "Vehicle" tests/
```

### Permissions

Deno requires explicit permissions. Common flags:
- `--allow-read`: File system read access
- `--allow-write`: File system write access
- `--allow-net`: Network access
- `--allow-env`: Environment variable access
- `--allow-run`: Subprocess execution

All test commands include necessary permissions.

## Writing Tests

### Basic Test Structure

```typescript
import { assertEquals, assertExists } from "std/assert";
import { describe, it, beforeEach, afterEach } from "std/testing/bdd.ts";

describe("Feature Name", () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it("should do something", () => {
    const result = someFunction();
    assertEquals(result, expectedValue);
  });

  it("should handle async operations", async () => {
    const result = await asyncFunction();
    assertExists(result);
  });
});
```

### Available Assertions

```typescript
import {
  assert,              // assert(value)
  assertEquals,        // assertEquals(actual, expected)
  assertExists,        // assertExists(value)
  assertStrictEquals,  // assertStrictEquals(actual, expected)
  assertThrows,        // assertThrows(fn)
  assertRejects,       // await assertRejects(promise)
} from "std/assert";
```

### Example Unit Test

```typescript
// tests/unit/example.test.ts
import { assertEquals } from "std/assert";
import { describe, it } from "std/testing/bdd.ts";
import { TestDataGenerator } from "../helpers/test_helpers.ts";

describe("Data Service", () => {
  it("should generate unique IDs", () => {
    const id1 = TestDataGenerator.randomId();
    const id2 = TestDataGenerator.randomId();

    assertEquals(id1.startsWith("test_"), true);
    assertEquals(id1 === id2, false);
  });

  it("should validate email format", () => {
    const email = TestDataGenerator.randomEmail();
    assertEquals(email.includes("@"), true);
    assertEquals(email.includes(".com"), true);
  });
});
```

### Example Integration Test

```typescript
// tests/integration/api.test.ts
import { assertEquals } from "std/assert";
import { describe, it } from "std/testing/bdd.ts";
import { MockHTTPServer, AsyncHelpers } from "../helpers/test_helpers.ts";

describe("API Integration", () => {
  it("should handle HTTP requests", async () => {
    const server = new MockHTTPServer();

    server.get("/api/data", () => {
      return new Response(
        JSON.stringify({ status: "ok" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const request = new Request("http://localhost/api/data");
    const response = await server.handle(request);

    assertEquals(response.status, 200);
    const data = await response.json();
    assertEquals(data.status, "ok");
  });
});
```

## Test Helpers

### TestDataGenerator

Generate random test data:

```typescript
import { TestDataGenerator } from "../helpers/test_helpers.ts";

// Generate random data
const id = TestDataGenerator.randomId();
const email = TestDataGenerator.randomEmail();
const phone = TestDataGenerator.randomPhone();
const address = TestDataGenerator.randomAddress();
const str = TestDataGenerator.randomString(10);
const num = TestDataGenerator.randomNumber(1, 100);
const date = TestDataGenerator.randomDate();
```

### MockFactory

Create test doubles:

```typescript
import { MockFactory } from "../helpers/test_helpers.ts";

const factory = new MockFactory();

// Create mock object
const mockUser = factory.create("user", {
  id: "123",
  name: "Test User",
  email: "test@example.com"
});

// Retrieve mock
const retrieved = factory.get("user");

// Clear specific mock
factory.clear("user");

// Reset all mocks
factory.reset();
```

### Spy

Track function calls:

```typescript
import { Spy } from "../helpers/test_helpers.ts";

const fn = (a: number, b: number) => a + b;
const spy = new Spy(fn);

// Call function
const result = spy.call(1, 2);

// Check calls
assertEquals(spy.callCount(), 1);
assertEquals(spy.calledWith(1, 2), true);

// Get specific call
const firstCall = spy.getCall(0);
assertEquals(firstCall.args, [1, 2]);
assertEquals(firstCall.result, 3);
```

### Stub

Replace function implementations:

```typescript
import { Stub } from "../helpers/test_helpers.ts";

const stub = new Stub();

// Return specific value
stub.returns(42);
assertEquals(stub.call(), 42);

// Throw error
stub.throws(new Error("Test error"));
assertThrows(() => stub.call());

// Custom implementation
stub.callsFake((x: number) => x * 2);
assertEquals(stub.call(5), 10);
```

### AsyncHelpers

Handle async operations:

```typescript
import { AsyncHelpers } from "../helpers/test_helpers.ts";

// Wait for specified time
await AsyncHelpers.wait(100);

// Wait for condition
let ready = false;
setTimeout(() => ready = true, 50);
await AsyncHelpers.waitFor(() => ready, {
  timeout: 1000,
  interval: 10
});

// Timeout operation
try {
  await AsyncHelpers.timeout(
    slowOperation(),
    100,
    "Operation timed out"
  );
} catch (error) {
  console.log("Caught timeout");
}
```

### MockHTTPServer

Mock HTTP requests:

```typescript
import { MockHTTPServer } from "../helpers/test_helpers.ts";

const server = new MockHTTPServer();

// GET endpoint
server.get("/api/users", () => {
  return new Response(JSON.stringify([{ id: 1, name: "User" }]));
});

// POST endpoint
server.post("/api/users", async (req) => {
  const body = await req.json();
  return new Response(JSON.stringify({ id: 123, ...body }), {
    status: 201
  });
});

// Handle request
const response = await server.handle(request);
```

### PerformanceMeasure

Measure execution time:

```typescript
import { PerformanceMeasure } from "../helpers/test_helpers.ts";

// Manual measurement
const measure = new PerformanceMeasure();
measure.start();
// ... code to measure
const duration = measure.end();
console.log(`Took ${duration}ms`);

// Automatic measurement
const { result, duration } = await PerformanceMeasure.measure(async () => {
  return await expensiveOperation();
});
```

### SnapshotTester

Snapshot testing:

```typescript
import { SnapshotTester } from "../helpers/test_helpers.ts";

const snapshots = new SnapshotTester("tests/__snapshots__");

// Match snapshot (creates on first run)
await snapshots.matchSnapshot("user-data", userData);

// Update snapshot
await snapshots.updateSnapshot("user-data", newUserData);
```

### FixtureLoader

Load test data:

```typescript
import { FixtureLoader } from "../helpers/test_helpers.ts";

// Load JSON fixture
const data = await FixtureLoader.load<UserData>("tests/fixtures/users.json");

// Load text fixture
const text = await FixtureLoader.loadText("tests/fixtures/template.txt");

// Save fixture
await FixtureLoader.save("tests/fixtures/output.json", data);
```

## Best Practices

### 1. Test Organization

- **Unit tests**: Test individual functions/classes in isolation
- **Integration tests**: Test interactions between components
- **Use descriptive names**: Test names should describe expected behavior
- **One assertion per test**: Keep tests focused and clear

### 2. Test Independence

```typescript
// ✅ Good: Tests are independent
describe("User Service", () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService(); // Fresh instance each test
  });

  it("should create user", () => {
    const user = service.create({ name: "Test" });
    assertExists(user.id);
  });

  it("should find user by id", () => {
    const user = service.create({ name: "Test" });
    const found = service.findById(user.id);
    assertEquals(found, user);
  });
});

// ❌ Bad: Tests depend on execution order
let sharedUser: User;

it("should create user", () => {
  sharedUser = service.create({ name: "Test" });
});

it("should find user", () => {
  const found = service.findById(sharedUser.id); // Depends on previous test
});
```

### 3. Async Testing

```typescript
// ✅ Good: Properly await async operations
it("should fetch data", async () => {
  const data = await fetchData();
  assertExists(data);
});

// ❌ Bad: Missing await
it("should fetch data", () => {
  const data = fetchData(); // Returns promise, not data
  assertExists(data); // Will fail
});
```

### 4. Error Testing

```typescript
// Testing synchronous errors
it("should throw on invalid input", () => {
  assertThrows(
    () => processData(invalidData),
    Error,
    "Invalid input"
  );
});

// Testing async errors
it("should reject on network error", async () => {
  await assertRejects(
    async () => await fetchRemoteData(),
    Error,
    "Network error"
  );
});
```

### 5. Mocking Best Practices

```typescript
// ✅ Good: Clear, focused mocks
const mockApi = {
  fetchUser: () => Promise.resolve({ id: 1, name: "Test" }),
  deleteUser: () => Promise.resolve(true)
};

// ❌ Bad: Over-complicated mocks
const mockApi = {
  fetchUser: (id: number) => {
    if (id === 1) return Promise.resolve({ id: 1, name: "User 1" });
    if (id === 2) return Promise.resolve({ id: 2, name: "User 2" });
    // ... lots of logic
  }
};
```

### 6. Test Coverage

Aim for:
- **80%+ code coverage** overall
- **100% coverage** for critical paths
- **Edge cases** and error scenarios
- **Boundary conditions**

### 7. Performance Testing

```typescript
it("should complete within 100ms", async () => {
  const { duration } = await PerformanceMeasure.measure(async () => {
    return await operation();
  });

  assertEquals(duration < 100, true, `Took ${duration}ms, expected < 100ms`);
});
```

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/deno-tests.yml`:

```yaml
name: Deno Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Deno
        uses: denoland/setup-deno@v1
        with:
          deno-version: v2.x

      - name: Run Deno tests
        run: deno task test:all

      - name: Generate coverage report
        run: deno task test:summary

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
deno-tests:
  image: denoland/deno:latest
  script:
    - deno task test:all
    - deno task test:summary
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/lcov.info
```

### Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
echo "Running Deno tests..."
deno task test:unit
if [ $? -ne 0 ]; then
  echo "Tests failed. Commit aborted."
  exit 1
fi
```

Make executable:
```bash
chmod +x .git/hooks/pre-commit
```

## Troubleshooting

### Common Issues

#### 1. Deno Not Found

**Problem**: `deno: command not found`

**Solution**:
```bash
# Check Deno installation
which deno

# Add to PATH in ~/.zshrc or ~/.bashrc
export PATH="$HOME/.deno/bin:$PATH"

# Reload shell
source ~/.zshrc
```

#### 2. Permission Errors

**Problem**: `error: Requires read access to ...`

**Solution**: Add necessary permissions to test command:
```bash
deno test --allow-read --allow-write --allow-net tests/
```

#### 3. Module Not Found

**Problem**: `error: Module not found "std/assert"`

**Solution**: Check imports in `deno.json`:
```json
{
  "imports": {
    "std/assert": "https://deno.land/std@0.224.0/assert/mod.ts"
  }
}
```

#### 4. TypeScript Errors

**Problem**: Type errors in test files

**Solution**: Configure `compilerOptions` in `deno.json`:
```json
{
  "compilerOptions": {
    "lib": ["deno.ns", "deno.window", "dom"],
    "strict": true,
    "allowJs": true
  }
}
```

#### 5. Test Timeouts

**Problem**: Tests timing out

**Solution**: Increase timeout or optimize async operations:
```typescript
// Increase timeout
await AsyncHelpers.timeout(operation(), 5000); // 5 seconds

// Or optimize the operation
await AsyncHelpers.wait(10); // Instead of 1000
```

#### 6. Coverage Not Generated

**Problem**: No coverage report

**Solution**:
```bash
# Ensure coverage directory exists
mkdir -p coverage

# Run with coverage flag
deno test --coverage=coverage/ tests/

# Generate report
deno coverage coverage/ --lcov --output=coverage/lcov.info
```

### Debugging Tests

#### 1. Use console.log

```typescript
it("should debug issue", () => {
  const data = getData();
  console.log("Data:", data); // Debug output
  assertEquals(data.value, 42);
});
```

#### 2. VS Code Debugger

Add to `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Deno Test",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "deno",
      "runtimeArgs": ["test", "--inspect-brk", "--allow-all"],
      "attachSimplePort": 9229
    }
  ]
}
```

#### 3. Filter Specific Tests

```bash
# Run only tests matching pattern
deno test --filter "Vehicle" tests/

# Run single file
deno test tests/unit/transportation.test.ts
```

### Getting Help

1. **Deno Documentation**: https://docs.deno.com/
2. **Deno Discord**: https://discord.gg/deno
3. **Stack Overflow**: Tag questions with `deno`
4. **GitHub Issues**: https://github.com/denoland/deno/issues

## Additional Resources

### Official Documentation

- [Deno Manual](https://docs.deno.com/runtime/manual)
- [Deno Standard Library](https://deno.land/std)
- [Testing Guide](https://docs.deno.com/runtime/manual/basics/testing)

### Example Tests

- `tests/unit/transportation.test.ts` - Unit test examples
- `tests/integration/transportation-api.test.ts` - Integration test examples
- `tests/helpers/test_helpers.ts` - All available test utilities

### Related Guides

- `TRANSPORTATION_PERSPECTIVES_GUIDE.md` - Transportation testing specifics
- `README.md` - Project overview
- `deno.json` - Configuration reference

---

## Summary

The Deno testing infrastructure provides:

✅ **Comprehensive test utilities** (10+ helper classes)
✅ **Unit and integration test examples**
✅ **Full npm script integration**
✅ **Coverage reporting**
✅ **Watch mode for development**
✅ **CI/CD ready**
✅ **TypeScript support**
✅ **Modern async testing**

**Quick Commands**:
```bash
npm run test:deno           # Run all Deno tests
npm run test:deno:unit      # Unit tests only
npm run test:deno:coverage  # With coverage
npm run test:deno:watch     # Watch mode
npm run test:all            # All test suites
```

Happy testing! 🦕
