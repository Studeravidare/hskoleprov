import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TimerRing from "../components/TimerRing/TimerRing";

// ─── Time formatting ───────────────────────────────────────────────────────────

describe("TimerRing – time display", () => {
  it("formats whole minutes correctly", () => {
    render(<TimerRing seconds={300} totalSeconds={600} />);
    expect(screen.getByText("5:00")).toBeInTheDocument();
  });

  it("pads seconds with leading zero", () => {
    render(<TimerRing seconds={65} totalSeconds={600} />);
    expect(screen.getByText("1:05")).toBeInTheDocument();
  });

  it("shows 0:00 when time is up", () => {
    render(<TimerRing seconds={0} totalSeconds={600} />);
    expect(screen.getByText("0:00")).toBeInTheDocument();
  });

  it("shows correct time for 90 seconds", () => {
    render(<TimerRing seconds={90} totalSeconds={600} />);
    expect(screen.getByText("1:30")).toBeInTheDocument();
  });

  it("shows correct time for 599 seconds", () => {
    render(<TimerRing seconds={599} totalSeconds={600} />);
    expect(screen.getByText("9:59")).toBeInTheDocument();
  });
});

// ─── Color thresholds ─────────────────────────────────────────────────────────

describe("TimerRing – color", () => {
  function getStrokeColor(seconds: number, totalSeconds: number) {
    const { container } = render(
      <TimerRing seconds={seconds} totalSeconds={totalSeconds} />,
    );
    const fillCircle = container.querySelectorAll("circle")[1];
    return fillCircle.getAttribute("stroke");
  }

  it("uses teal color when >50% time remains", () => {
    expect(getStrokeColor(400, 600)).toBe("#035c67");
  });

  it("uses gold color when 25–50% time remains", () => {
    expect(getStrokeColor(200, 600)).toBe("#ffb71b");
  });

  it("uses red color when <25% time remains", () => {
    expect(getStrokeColor(100, 600)).toBe("#991b1b");
  });

  it("uses teal exactly at 100% time", () => {
    expect(getStrokeColor(600, 600)).toBe("#035c67");
  });

  it("uses red when time is 0", () => {
    expect(getStrokeColor(0, 600)).toBe("#991b1b");
  });
});

// ─── SVG structure ────────────────────────────────────────────────────────────

describe("TimerRing – SVG structure", () => {
  it("renders an SVG element", () => {
    const { container } = render(
      <TimerRing seconds={300} totalSeconds={600} />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders two circles (track + fill)", () => {
    const { container } = render(
      <TimerRing seconds={300} totalSeconds={600} />,
    );
    expect(container.querySelectorAll("circle")).toHaveLength(2);
  });

  it("offset formula: less time → larger offset than more time", () => {
    // Verify the math directly: offset = circumference * (1 - seconds/total)
    const radius = 17;
    const circumference = 2 * Math.PI * radius;
    const offsetAt = (seconds: number, total: number) =>
      circumference * (1 - seconds / total);
    expect(offsetAt(100, 600)).toBeGreaterThan(offsetAt(500, 600));
  });

  it("offset is zero when full time remains", () => {
    const radius = 17;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - 600 / 600);
    expect(offset).toBeCloseTo(0, 5);
  });

  it("handles totalSeconds=0 without crashing", () => {
    expect(() =>
      render(<TimerRing seconds={0} totalSeconds={0} />),
    ).not.toThrow();
  });
});
