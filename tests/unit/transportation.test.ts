/**
 * Transportation Mock Data Service Unit Tests
 *
 * Tests for the transportation mock data service using Deno's testing framework.
 */

import { assertEquals, assertExists } from "std/assert";
import { describe, it, beforeEach, afterEach } from "std/testing/bdd.ts";
import {
  TestDataGenerator,
  MockFactory,
  Spy,
  AsyncHelpers,
} from "../helpers/test_helpers.ts";

// Mock the transportation data (in real tests, import from actual service)
const mockTransportationData = {
  vehicles: [
    {
      id: "VEH001",
      name: "Community Van 1",
      type: "van",
      capacity: 12,
      status: "available",
    },
    {
      id: "VEH002",
      name: "Medical Transport Bus",
      type: "bus",
      capacity: 15,
      status: "in_use",
    },
  ],
  drivers: [
    {
      id: "DRV001",
      name: "Michael Rodriguez",
      status: "active",
      stats: { totalRides: 1247, onTimePercentage: 94.5 },
    },
  ],
  stats: {
    vehicles: {
      total: 5,
      available: 2,
      inUse: 2,
      maintenance: 1,
      utilizationRate: 0.60,
    },
    rides: {
      today: 12,
      thisWeek: 67,
      thisMonth: 284,
      onTimePercentage: 94.3,
    },
  },
};

describe("Transportation Mock Data Service", () => {
  let mockFactory: MockFactory;

  beforeEach(() => {
    mockFactory = new MockFactory();
  });

  afterEach(() => {
    mockFactory.reset();
  });

  describe("Vehicle Data", () => {
    it("should have vehicles array", () => {
      assertExists(mockTransportationData.vehicles);
      assertEquals(Array.isArray(mockTransportationData.vehicles), true);
    });

    it("should have at least 2 vehicles", () => {
      assertEquals(mockTransportationData.vehicles.length >= 2, true);
    });

    it("should have vehicles with required properties", () => {
      const vehicle = mockTransportationData.vehicles[0];
      assertExists(vehicle.id);
      assertExists(vehicle.name);
      assertExists(vehicle.type);
      assertExists(vehicle.capacity);
      assertExists(vehicle.status);
    });

    it("should have valid vehicle IDs", () => {
      mockTransportationData.vehicles.forEach((vehicle) => {
        assertEquals(vehicle.id.startsWith("VEH"), true);
      });
    });

    it("should have vehicles with different statuses", () => {
      const statuses = mockTransportationData.vehicles.map((v) => v.status);
      assertEquals(statuses.includes("available"), true);
      assertEquals(statuses.includes("in_use"), true);
    });

    it("should calculate total capacity correctly", () => {
      const totalCapacity = mockTransportationData.vehicles.reduce(
        (sum, v) => sum + v.capacity,
        0
      );
      assertEquals(totalCapacity, 27);
    });
  });

  describe("Driver Data", () => {
    it("should have drivers array", () => {
      assertExists(mockTransportationData.drivers);
      assertEquals(Array.isArray(mockTransportationData.drivers), true);
    });

    it("should have drivers with required properties", () => {
      const driver = mockTransportationData.drivers[0];
      assertExists(driver.id);
      assertExists(driver.name);
      assertExists(driver.status);
      assertExists(driver.stats);
    });

    it("should have valid driver statistics", () => {
      const driver = mockTransportationData.drivers[0];
      assertEquals(driver.stats.totalRides > 0, true);
      assertEquals(driver.stats.onTimePercentage > 0, true);
      assertEquals(driver.stats.onTimePercentage <= 100, true);
    });
  });

  describe("Transportation Statistics", () => {
    it("should have stats object", () => {
      assertExists(mockTransportationData.stats);
    });

    it("should have vehicle statistics", () => {
      const vehicleStats = mockTransportationData.stats.vehicles;
      assertExists(vehicleStats);
      assertEquals(vehicleStats.total, 5);
      assertEquals(vehicleStats.available, 2);
      assertEquals(vehicleStats.inUse, 2);
      assertEquals(vehicleStats.maintenance, 1);
    });

    it("should calculate utilization rate correctly", () => {
      const { utilizationRate, inUse, total } = mockTransportationData.stats.vehicles;
      assertEquals(utilizationRate, inUse / total);
    });

    it("should have ride statistics", () => {
      const rideStats = mockTransportationData.stats.rides;
      assertExists(rideStats);
      assertEquals(rideStats.today > 0, true);
      assertEquals(rideStats.thisWeek > 0, true);
      assertEquals(rideStats.thisMonth > 0, true);
    });

    it("should have valid on-time percentage", () => {
      const { onTimePercentage } = mockTransportationData.stats.rides;
      assertEquals(onTimePercentage > 0, true);
      assertEquals(onTimePercentage <= 100, true);
    });

    it("should have consistent ride statistics", () => {
      const { today, thisWeek, thisMonth } = mockTransportationData.stats.rides;
      assertEquals(today <= thisWeek, true);
      assertEquals(thisWeek <= thisMonth, true);
    });
  });

  describe("Test Data Generator", () => {
    it("should generate random IDs", () => {
      const id1 = TestDataGenerator.randomId();
      const id2 = TestDataGenerator.randomId();
      assertEquals(id1.startsWith("test_"), true);
      assertEquals(id2.startsWith("test_"), true);
      assertEquals(id1 === id2, false);
    });

    it("should generate random strings", () => {
      const str = TestDataGenerator.randomString(10);
      assertEquals(str.length, 10);
    });

    it("should generate random numbers within range", () => {
      const num = TestDataGenerator.randomNumber(1, 10);
      assertEquals(num >= 1, true);
      assertEquals(num <= 10, true);
    });

    it("should generate valid emails", () => {
      const email = TestDataGenerator.randomEmail();
      assertEquals(email.includes("@"), true);
      assertEquals(email.includes(".com"), true);
    });

    it("should generate valid phone numbers", () => {
      const phone = TestDataGenerator.randomPhone();
      const parts = phone.split("-");
      assertEquals(parts.length, 3);
      assertEquals(parts[0].length, 3);
      assertEquals(parts[1].length, 3);
      assertEquals(parts[2].length, 4);
    });
  });

  describe("Mock Factory", () => {
    it("should create mock objects", () => {
      const mock = mockFactory.create<{ id: string; name: string }>("test", {
        id: "123",
        name: "Test",
      });
      assertEquals(mock.id, "123");
      assertEquals(mock.name, "Test");
    });

    it("should retrieve mocks by name", () => {
      mockFactory.create("test1", { value: "a" });
      const retrieved = mockFactory.get("test1");
      assertExists(retrieved);
      assertEquals(retrieved.value, "a");
    });

    it("should clear specific mocks", () => {
      mockFactory.create("test1", { value: "a" });
      mockFactory.create("test2", { value: "b" });
      mockFactory.clear("test1");
      assertEquals(mockFactory.get("test1"), undefined);
      assertExists(mockFactory.get("test2"));
    });
  });

  describe("Spy", () => {
    it("should track function calls", () => {
      const fn = (a: number, b: number) => a + b;
      const spy = new Spy(fn);
      spy.call(1, 2);
      spy.call(3, 4);
      assertEquals(spy.callCount(), 2);
    });

    it("should track arguments", () => {
      const fn = (a: number) => a * 2;
      const spy = new Spy(fn);
      spy.call(5);
      assertEquals(spy.calledWith(5), true);
      assertEquals(spy.calledWith(10), false);
    });

    it("should return correct results", () => {
      const fn = (a: number) => a * 2;
      const spy = new Spy(fn);
      const result = spy.call(5);
      assertEquals(result, 10);
    });
  });
});

describe("Async Transportation Operations", () => {
  it("should handle async vehicle status checks", async () => {
    const checkStatus = async () => {
      await AsyncHelpers.wait(10);
      return mockTransportationData.vehicles[0].status;
    };

    const status = await checkStatus();
    assertEquals(status, "available");
  });

  it("should timeout long operations", async () => {
    const slowOperation = async () => {
      await AsyncHelpers.wait(1000);
      return "done";
    };

    try {
      await AsyncHelpers.timeout(slowOperation(), 100, "Too slow");
      assertEquals(true, false, "Should have thrown timeout error");
    } catch (error) {
      assertEquals((error as Error).message, "Too slow");
    }
  });

  it("should wait for conditions", async () => {
    let ready = false;
    setTimeout(() => (ready = true), 50);

    await AsyncHelpers.waitFor(() => ready, {
      timeout: 1000,
      interval: 10,
    });

    assertEquals(ready, true);
  });
});

describe("Performance Measurements", () => {
  it("should measure execution time", async () => {
    const { result, duration } = await import("../helpers/test_helpers.ts")
      .then((m) => m.PerformanceMeasure.measure(async () => {
        await AsyncHelpers.wait(50);
        return "done";
      }));

    assertEquals(result, "done");
    assertEquals(duration >= 50, true);
    assertEquals(duration < 100, true);
  });
});
