import { describe, expect, it } from "vitest";
import { bookingGroup } from "./utilityServices";

describe("bookingGroup", () => {
  it("keeps unfinished bookings in the Pending tab", () => {
    for (const status of ["pending", "assigned", "in_progress", "quoted"]) {
      expect(bookingGroup(status)).toBe("pending");
    }
  });

  it("moves finished bookings to the Completed tab", () => {
    expect(bookingGroup("completed")).toBe("completed");
  });

  it("keeps cancelled bookings out of Pending and Completed", () => {
    expect(bookingGroup("cancelled")).toBe("cancelled");
  });
});
