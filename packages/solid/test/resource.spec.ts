import {
  createRoot,
  createSignal,
  createResource,
  createResourceState,
  createEffect,
  onError,
  SetStateFunction,
  Resource
} from "../src";

describe("Simulate a dynamic fetch", () => {
  let resolve: (v: string) => void,
    reject: (r: string) => void,
    trigger: (v: number) => void,
    load: (v: Promise<string> | undefined) => void,
    value: Resource<string>,
    error: string;
  function fetcher(id: number): Promise<string> | undefined {
    return !!id
      ? new Promise<string>((r, f) => {
          resolve = r;
          reject = f;
        })
      : undefined;
  }

  test("initial async resource", async done => {
    createRoot(() => {
      const [id, setId] = createSignal(1);
      [value, load] = createResource<string>();
      trigger = setId;
      onError(e => (error = e));
      createEffect(() => load(fetcher(id())));
      createEffect(value);
    });
    expect(value()).toBeUndefined();
    expect(value.loading).toBe(true);
    resolve("John");
    await Promise.resolve();
    expect(value()).toBe("John");
    expect(value.loading).toBe(false);
    done();
  });

  test("test out of order", async done => {
    trigger(2);
    expect(value.loading).toBe(true);
    const resolve1 = resolve;
    trigger(3);
    const resolve2 = resolve;
    resolve2("Jake");
    resolve1("Jo");
    await Promise.resolve();
    expect(value()).toBe("Jake");
    expect(value.loading).toBe(false);
    done();
  });

  test("promise rejection", async done => {
    trigger(4);
    expect(value.loading).toBe(true);
    reject("Because I said so");
    await Promise.resolve();
    expect(error).toBe("Because I said so");
    expect(value.loading).toBe(false);
    done();
  });

  test("no promise", () => {
    trigger(0);
    expect(value.loading).toBe(false);
    expect(value()).toBeUndefined();
  });
});

describe("Simulate a dynamic fetch with state", () => {
  let resolve: (v: string) => void,
    reject: (r: string) => void,
    trigger: (v: number) => void,
    load: (
      v: { [k: number]: Promise<string> | string },
      r?: (v: any) => (state: any) => void
    ) => void,
    setUsers: SetStateFunction<{ [id: number]: string }>,
    users: any;
  function fetcher(): Promise<string> {
    return new Promise<string>((r, f) => {
      resolve = r;
      reject = f;
    });
  }

  test("initial async resource", async done => {
    createRoot(() => {
      const [id, setId] = createSignal(1);
      [users, load, setUsers] = createResourceState<{ [id: number]: string }>({ 6: "Rio" });
      trigger = setId;
      createEffect(() => {
        const i = id();
        if (i === 5) return load({ 5: "Jordan" });
        load({ [i]: fetcher() });
      });
    });
    expect(users[1]).toBeUndefined();
    expect(users.loading[1]).toBe(true);
    resolve("John");
    await Promise.resolve();
    await Promise.resolve();
    expect(users[1]).toBe("John");
    expect(users.loading[1]).toBe(false);
    done();
  });

  test("test multiple loads", async done => {
    trigger(2);
    expect(users.loading[2]).toBe(true);
    const resolve1 = resolve;
    trigger(3);
    const resolve2 = resolve;
    resolve2("Jake");
    resolve1("Jo");
    await Promise.resolve();
    await Promise.resolve();
    expect(users[3]).toBe("Jake");
    expect(users.loading[3]).toBe(false);
    done();
  });

  test("promise rejection", async done => {
    trigger(4);
    expect(users.loading[4]).toBe(true);
    reject("Because I said so");
    await Promise.resolve();
    await Promise.resolve();
    expect(users.loading[4]).toBe(false);
    done();
  });

  test("direct value", () => {
    trigger(5);
    expect(users.loading[5]).toBe(false);
    expect(users[5]).toBe("Jordan");
  });

  test("setState", () => {
    setUsers(5, "Jordy");
    expect(users[5]).toBe("Jordy");
  });

  test("custom reconciler", async done => {
    const reconcile = (v: string) => (state: string) => `${state} ${v}`;
    load({ 6: new Promise(r => r("Jerry")) }, reconcile);
    await Promise.resolve();
    await Promise.resolve();
    expect(users[6]).toBe("Rio Jerry");
    done();
  });

  test("setState tracked", () => {
    createRoot(() => {
      let runs = 0;
      createEffect(() => {
        users[7];
        runs++;
      });
      expect(runs).toBe(1);
      setUsers({ 7: "Jimbo" });
      expect(users[7]).toBe("Jimbo");
      expect(runs).toBe(2);
    });
  });
});

describe("using Resource with no root", () => {
  test("loads default value", () => {
    expect(() => {
      const [, load] = createResource<string>();
      let resolve: (v: string) => void;
      load(new Promise(r => (resolve = r)));
      resolve!("Hi");
    }).not.toThrow();
  });
});
