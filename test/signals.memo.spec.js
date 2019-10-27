import {
  createRoot,
  createSignal,
  createEffect,
  createMemo
} from "../dist/index";

const EQUAL = (a, b) => a === b;

describe("createMemo", () => {
  describe("executing propagating", () => {
    it("does not trigger downstream computations unless changed", () => {
      createRoot(() => {
        let [s1, set] = createSignal(1);
        let order = "";
        let t1 = createMemo(
          () => {
            order += "t1";
            return s1();
          },
          undefined,
          EQUAL
        );
        createEffect(() => {
          order += "c1";
          t1();
        });
        expect(order).toBe("t1c1");
        order = "";
        set(1);
        expect(order).toBe("t1");
        order = "";
        set(2);
        expect(order).toBe("t1c1");
      });
    });

    it("applies updates to changed dependees in same order as createEffect", () => {
      createRoot(() => {
        let [s1, set] = createSignal(0);
        let order = "";
        let t1 = createMemo(
          () => {
            order += "t1";
            return s1() === 0;
          },
          undefined,
          EQUAL
        );
        createEffect(() => {
          order += "c1";
          return s1();
        });
        createEffect(() => {
          order += "c2";
          return t1();
        });

        expect(order).toBe("t1c1c2");
        order = "";
        set(1);
        expect(order).toBe("t1c2c1");
      });
    });

    it("updates downstream pending computations", () => {
      createRoot(() => {
        let [s1, set] = createSignal(0);
        let [s2] = createSignal(0);
        let order = "";
        let t1 = createMemo(
          () => {
            order += "t1";
            return s1() === 0;
          },
          undefined,
          EQUAL
        );
        createEffect(() => {
          order += "c1";
          return s1();
        });
        createEffect(() => {
          order += "c2";
          t1();
          createEffect(() => {
            order += "c2_1";
            return s2();
          });
        });
        order = "";
        set(1);
        expect(order).toBe("t1c2c2_1c1");
      });
    });
  });

  describe("with changing dependencies", () => {
    var i, setI;
    var t, setT;
    var e, setE;
    var fevals;
    var f;

    function init() {
      [i, setI] = createSignal(true);
      [t, setT] = createSignal(1);
      [e, setE] = createSignal(2);
      fevals = 0;
      f = createMemo(
        () => {
          fevals++;
          return i() ? t() : e();
        },
        undefined,
        EQUAL
      );
      fevals = 0;
    }

    it("updates on active dependencies", () => {
      createRoot(() => {
        init();
        setT(5);
        expect(fevals).toBe(1);
        expect(f()).toBe(5);
      });
    });

    it("does not update on inactive dependencies", () => {
      createRoot(() => {
        init();
        setE(5);
        expect(fevals).toBe(0);
        expect(f()).toBe(1);
      });
    });

    it("deactivates obsolete dependencies", () => {
      createRoot(() => {
        init();
        setI(false);
        fevals = 0;
        setT(5);
        expect(fevals).toBe(0);
      });
    });

    it("activates new dependencies", () => {
      createRoot(() => {
        init();
        setI(false);
        fevals = 0;
        setE(5);
        expect(fevals).toBe(1);
      });
    });

    it("ensures that new dependencies are updated before dependee", () => {
      createRoot(() => {
        var order = "",
          [a, setA] = createSignal(0),
          b = createMemo(
            () => {
              order += "b";
              return a() + 1;
            },
            undefined,
            EQUAL
          ),
          c = createMemo(
            () => {
              order += "c";
              const check = b();
              if (check) {
                return check;
              }
              return e();
            },
            undefined,
            EQUAL
          ),
          d = createMemo(
            () => {
              return a();
            },
            undefined,
            EQUAL
          ),
          e = createMemo(
            () => {
              order += "d";
              return d() + 10;
            },
            undefined,
            EQUAL
          );

        expect(order).toBe("bcd");

        order = "";
        setA(-1);

        expect(order).toBe("bcd");
        expect(c()).toBe(9);

        order = "";
        setA(0);

        expect(order).toBe("bcd");
        expect(c()).toBe(1);
      });
    });
  });

  describe("with intercepting computations", () => {
    it("does not update subsequent pending computations after stale invocations", () => {
      createRoot(() => {
        let [s1, set1] = createSignal(1);
        let [s2, set2] = createSignal(false);
        let count = 0;
        /*
                    s1
                    |
                +---+---+
               t1 t2 c1 t3
                \       /
                   c3
             [PN,PN,STL,void]
        */
        let t1 = createMemo(() => s1() > 0, undefined, EQUAL);
        let t2 = createMemo(() => s1() > 0, undefined, EQUAL);
        let c1 = createMemo(() => s1());
        let t3 = createMemo(
          () => {
            let a = s1();
            let b = s2();
            return a && b;
          },
          undefined,
          EQUAL
        );
        createEffect(() => {
          t1();
          t2();
          c1();
          t3();
          count++;
        });
        set2(true);
        expect(count).toBe(2);
        set1(2);
        expect(count).toBe(3);
      });
    });

    it("evaluates stale computations before dependendees when trackers stay unchanged", () => {
      createRoot(() => {
        let [s1, set] = createSignal(1);
        let order = "";
        let t1 = createMemo(
          () => {
            order += "t1";
            return s1() > 2;
          },
          undefined,
          EQUAL
        );
        let t2 = createMemo(
          () => {
            order += "t2";
            return s1() > 2;
          },
          undefined,
          EQUAL
        );
        let c1 = createMemo(() => {
          order += "c1";
          s1();
        });
        createEffect(() => {
          order += "c2";
          t1();
          t2();
          c1();
        });
        order = "";
        set(1);
        expect(order).toBe("t1t2c1c2");
        order = "";
        set(3);
        expect(order).toBe("t1c2t2c1");
      });
    });

    it("evaluates nested trackings", () => {
      createRoot(() => {
        let [s1, set1] = createSignal(1);
        let [s2] = createSignal(1);
        let count = 0;
        let c1;
        createMemo(
          () => {
            c1 = createMemo(() => s2(), undefined, EQUAL);
            return s1();
          },
          undefined,
          EQUAL
        );
        createEffect(() => {
          count++;
          c1();
        });
        set1(2);
        expect(count).toBe(1);
      });
    });

    it("propagates in topological order", () => {
      createRoot(() => {
        let [s1, set] = createSignal(true);
        let order = "";
        let t1 = createMemo(
          () => {
            order += "t1";
            return s1();
          },
          undefined,
          EQUAL
        );
        let t2 = createMemo(
          () => {
            order += "t2";
            return s1();
          },
          undefined,
          EQUAL
        );
        createEffect(() => {
          t1();
          t2();
          order += "c1";
        });
        order = "";
        set(false);
        expect(order).toBe("t1t2c1");
      });
    });

    it("does not evaluate dependencies with tracking sources that have not changed", () => {
      createRoot(() => {
        let [s1, set] = createSignal(1);
        let order = "";
        let c2;
        createEffect(() => {
          order += "c1";
          if (s1() > 1) {
            c2();
          }
        });
        let t1 = createMemo(
          () => {
            order += "t1";
            return s1() < 3;
          },
          undefined,
          EQUAL
        );
        let t2 = createMemo(
          () => {
            order += "t2";
            return t1();
          },
          undefined,
          EQUAL
        );
        c2 = createMemo(() => {
          order += "c2";
          return t2();
        });
        order = "";
        set(2);
        expect(order).toBe("c1t1");
        order = "";
        set(3);
        expect(order).toBe("c1t1t2c2");
      });
    });

    it("correctly marks downstream computations as stale on change", () => {
      createRoot(() => {
        let [s1, set] = createSignal(1);
        let order = "";
        let t1 = createMemo(
          () => {
            order += "t1";
            return s1();
          },
          undefined,
          EQUAL
        );
        let c1 = createMemo(() => {
          order += "c1";
          return t1();
        });
        let c2 = createMemo(() => {
          order += "c2";
          return c1();
        });
        createEffect(() => {
          order += "c3";
          return c2();
        });
        order = "";
        set(2);
        expect(order).toBe("t1c1c2c3");
      });
    });
  });

  describe("with unending changes", () => {
    it("throws when continually setting a direct dependency", () => {
      createRoot(() => {
        var [d, set] = createSignal(1);

        expect(() => {
          createMemo(
            () => {
              return set(d() + 1);
            },
            undefined,
            EQUAL
          );
        }).toThrow();
      });
    });

    it("throws when continually setting an indirect dependency", () => {
      createRoot(() => {
        let i = 2;
        var [d, set] = createSignal(1),
          f1 = createMemo(() => d(), undefined, EQUAL),
          f2 = createMemo(() => f1(), undefined, EQUAL),
          f3 = createMemo(() => f2(), undefined, EQUAL);

        expect(() => {
          createMemo(
            () => {
              f3();
              set(i++);
            },
            undefined,
            EQUAL
          );
        }).toThrow();
      });
    });
  });

  describe("with circular dependencies", () => {
    it("throws when cycle created by modifying a branch", () => {
      createRoot(() => {
        var [d, set] = createSignal(1),
          f = createMemo(() => (f ? f() : d()));

        expect(() => {
          set(0);
        }).toThrow();
      });
    });
  });
});
