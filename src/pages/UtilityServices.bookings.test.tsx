import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import UtilityServices from "./UtilityServices";

vi.mock("@/integrations/supabase/client", () => {
  const bookings = [
    { id: "pnd00001", service_id: "svc1", customer_user_id: "cust1", contact_name: "Anu", contact_phone: "9999999999", status: "pending", created_at: "2026-10-08T09:00:00Z" },
    { id: "asg00002", service_id: "svc1", customer_user_id: "cust1", contact_name: "Anu", contact_phone: "9999999999", status: "assigned", created_at: "2026-10-08T08:00:00Z" },
    { id: "cmp00003", service_id: "svc1", customer_user_id: "cust1", contact_name: "Anu", contact_phone: "9999999999", status: "completed", created_at: "2026-10-07T08:00:00Z" },
    { id: "cxl00004", service_id: "svc1", customer_user_id: "cust1", contact_name: "Anu", contact_phone: "9999999999", status: "cancelled", created_at: "2026-10-06T08:00:00Z" },
  ];
  const resultFor = (table: string) =>
    table === "utility_service_requests"
      ? { data: bookings, error: null }
      : table === "utility_services"
        ? { data: [{ id: "svc1", name: "Plumbing" }], error: null }
        : { data: [], error: null };
  const chainFor = (table: string): any => {
    const chain: any = {
      select: () => chain, insert: () => chain, update: () => chain, upsert: () => chain,
      eq: () => chain, neq: () => chain, in: () => chain, is: () => chain, like: () => chain,
      ilike: () => chain, gte: () => chain, lte: () => chain, gt: () => chain, lt: () => chain,
      order: () => chain, limit: () => chain, range: () => chain, single: () => chain,
      maybeSingle: () => chain,
      then: (resolve: (value: unknown) => void) => resolve(resultFor(table)),
    };
    return chain;
  };
  return {
    supabase: {
      from: (table: string) => chainFor(table),
      rpc: () => chainFor("rpc"),
      channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
      removeChannel: () => undefined,
    },
  };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "cust1" }, profile: null, loading: false }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: () => undefined }),
}));

afterEach(cleanup);

const openBookings = () => {
  fireEvent.click(screen.getByRole("button", { name: /My bookings/ }));
};

describe("My bookings status tabs", () => {
  it("shows unfinished bookings on the Pending tab first", async () => {
    render(<MemoryRouter><UtilityServices /></MemoryRouter>);
    openBookings();
    await screen.findByRole("tab", { name: /Pending/ });
    expect(screen.getByRole("tab", { name: /Pending/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Booking #pnd00001")).toBeInTheDocument();
    expect(screen.getByText("Booking #asg00002")).toBeInTheDocument();
    expect(screen.queryByText("Booking #cmp00003")).not.toBeInTheDocument();
    expect(screen.queryByText("Booking #cxl00004")).not.toBeInTheDocument();
  });

  it("switches to only finished bookings on the Completed tab", async () => {
    render(<MemoryRouter><UtilityServices /></MemoryRouter>);
    openBookings();
    fireEvent.click(await screen.findByRole("tab", { name: /Completed/ }));
    expect(screen.getByRole("tab", { name: /Completed/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Booking #cmp00003")).toBeInTheDocument();
    expect(screen.queryByText("Booking #pnd00001")).not.toBeInTheDocument();
    expect(screen.queryByText("Booking #asg00002")).not.toBeInTheDocument();
  });

  it("keeps cancelled bookings on their own tab", async () => {
    render(<MemoryRouter><UtilityServices /></MemoryRouter>);
    openBookings();
    fireEvent.click(await screen.findByRole("tab", { name: /Cancelled/ }));
    expect(screen.getByText("Booking #cxl00004")).toBeInTheDocument();
    expect(screen.queryByText("Booking #pnd00001")).not.toBeInTheDocument();
    expect(screen.queryByText("Booking #cmp00003")).not.toBeInTheDocument();
  });
});
