import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { HeroCounter } from "@/components/landing/hero-counter";
import { FakeIntersectionObserver } from "@test/intersection-observer";

function setVisibility(element: Element, isIntersecting: boolean) {
  act(() => FakeIntersectionObserver.emitAll([{ target: element, isIntersecting }]));
}

function advance(ms: number) {
  return act(() => vi.advanceTimersByTime(ms));
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("HeroCounter", () => {
  test("stays at zero until scrolled into view", async () => {
    render(<HeroCounter target={123_456} />);
    await advance(5000);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  test("counts up with easing and lands exactly on the target after 2.5s", async () => {
    render(<HeroCounter target={123_456} />);
    const counter = screen.getByText("0");

    setVisibility(counter, true);
    await advance(1000);
    const midway = Number(counter.textContent.replaceAll(",", ""));
    expect(midway).toBeGreaterThan(123_456 / 2); // ease-out: past halfway at 40% of the time
    expect(midway).toBeLessThan(123_456);

    await advance(2000);
    expect(counter).toHaveTextContent("123,456");
  });

  test("counts only once", async () => {
    render(<HeroCounter target={500} />);
    const counter = screen.getByText("0");
    setVisibility(counter, true);
    await advance(3000);

    setVisibility(counter, false);
    setVisibility(counter, true);
    await advance(100);

    expect(counter).toHaveTextContent("500");
  });
});
