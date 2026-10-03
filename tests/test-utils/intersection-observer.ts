/** Controllable stand-in for the browser's IntersectionObserver (jsdom has none). */
export class FakeIntersectionObserver implements IntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];

  readonly root = null;
  readonly rootMargin: string;
  readonly thresholds: readonly number[] = [0];
  readonly scrollMargin = "0px";
  readonly observed = new Set<Element>();

  constructor(
    private readonly callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.rootMargin = options?.rootMargin ?? "0px";
    FakeIntersectionObserver.instances.push(this);
  }

  observe(target: Element) {
    this.observed.add(target);
  }

  unobserve(target: Element) {
    this.observed.delete(target);
  }

  disconnect() {
    this.observed.clear();
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  /** Report visibility changes for observed elements to the callback. */
  emit(changes: { target: Element; isIntersecting: boolean }[]) {
    const entries = changes
      .filter(({ target }) => this.observed.has(target))
      .map(
        ({ target, isIntersecting }) =>
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          ({ target, isIntersecting, intersectionRatio: isIntersecting ? 1 : 0 }) as IntersectionObserverEntry,
      );
    if (entries.length > 0) this.callback(entries, this);
  }

  /** Emit to every live observer. */
  static emitAll(changes: { target: Element; isIntersecting: boolean }[]) {
    for (const observer of FakeIntersectionObserver.instances) observer.emit(changes);
  }
}
