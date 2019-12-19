import {
  pipe,
  map,
  reduce,
  defer,
  createSignal,
  createMemo,
  createRoot
} from "../src";

describe("Pipe operator", () => {
  const multiply = (m: number) => (s: () => number) => () => s() * m;
  test("no ops", () => {
    createRoot(() => {
      const [s, set] = createSignal(0),
        r = createMemo(pipe()(s));
      expect(r()).toBe(0);
      set(2);
      expect(r()).toBe(2);
    });
  });

  test("single op", () => {
    createRoot(() => {
      const [s, set] = createSignal(1),
        r = createMemo(pipe(multiply(2))(s));
      expect(r()).toBe(2);
      set(2);
      expect(r()).toBe(4);
    });
  });

  test("multiple ops", () => {
    createRoot(() => {
      const [s, set] = createSignal(1),
        r = createMemo(pipe(multiply(2), multiply(3))(s));
      expect(r()).toBe(6);
      set(2);
      expect(r()).toBe(12);
    });
  });
});

describe("Reduce operator", () => {
  test("simple addition", () => {
    createRoot(() => {
      const [s, set] = createSignal([1, 2, 3, 4]),
        r = createMemo(reduce(s, (m: number, v: number) => m + v, 0));
      expect(r()).toBe(10);
      set([3, 4, 5]);
      expect(r()).toBe(12);
    });
  });

  test("simple addition curried", () => {
    createRoot(() => {
      const [s, set] = createSignal([1, 2, 3, 4]),
        sum = reduce((m: number, v: number) => m + v, 0),
        r = createMemo(sum(s));
      expect(r()).toBe(10);
      set([3, 4, 5]);
      expect(r()).toBe(12);
    });
  });

  test("filter list", () => {
    createRoot(() => {
      const [s, set] = createSignal([1, 2, 3, 4]),
        filterOdd = reduce(
          (m: number[], v: number) => (v % 2 ? [...m, v] : m),
          []
        ),
        r = createMemo(filterOdd(s));
      expect(r()).toEqual([1, 3]);
      set([3, 4, 5]);
      expect(r()).toEqual([3, 5]);
    });
  });
});

describe("Map operator", () => {
  test("simple map", () => {
    createRoot(() => {
      const [s, set] = createSignal([1, 2, 3, 4]),
        r = createMemo(map(s, (v: number) => v * 2));
      expect(r()).toEqual([2, 4, 6, 8]);
      set([3, 4, 5]);
      expect(r()).toEqual([6, 8, 10]);
    });
  });

  test("simple map curried", () => {
    createRoot(() => {
      const [s, set] = createSignal([1, 2, 3, 4]),
        double = map((v: number) => v * 2),
        r = createMemo(double(s));
      expect(r()).toEqual([2, 4, 6, 8]);
      set([3, 4, 5]);
      expect(r()).toEqual([6, 8, 10]);
    });
  });

  test("show fallback", () => {
    createRoot(() => {
      const [s, set] = createSignal([1, 2, 3, 4]),
        double = map<number, number | string>(v => v * 2, {
          fallback: () => "Empty"
        }),
        r = createMemo(double(s));
      expect(r()).toEqual([2, 4, 6, 8]);
      set([]);
      expect(r()).toEqual(["Empty"]);
      set([3, 4, 5]);
      expect(r()).toEqual([6, 8, 10]);
    });
  });
});

describe("Defer operator", () => {
  test("simple defer", done => {
    createRoot(() => {
      const [s, set] = createSignal(),
        r = createMemo(defer(s, { timeoutMs: 20 }));
      expect(r()).not.toBeDefined();
      set("Hi");
      expect(r()).not.toBeDefined();
      setTimeout(() => {
        expect(r()).toBe("Hi");
        done();
      }, 100);
    });
  });

  test("simple defer curried", done => {
    createRoot(() => {
      const [s, set] = createSignal(),
        defered = defer({ timeoutMs: 20 }),
        r = createMemo(defered(s));
      expect(r()).not.toBeDefined();
      set("Hi");
      expect(r()).not.toBeDefined();
      setTimeout(() => {
        expect(r()).toBe("Hi");
        done();
      }, 100);
    });
  });
});
