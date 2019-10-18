import { createRoot, createSignal } from "../../dist";
import { insert } from "../../dist/dom";

describe("Testing an only child each control flow", () => {
  let div, disposer;
  const n1 = "a",
    n2 = "b",
    n3 = "c",
    n4 = "d";
  const [list, setList] = createSignal([n1, n2, n3, n4]);
  const Component = () => (
    <div ref={div}>
      <For each={list()}>{item => item}</For>
    </div>
  );

  function apply(array) {
    setList(array);
    expect(div.innerHTML).toBe(array.join(""));
    setList([n1, n2, n3, n4]);
    expect(div.innerHTML).toBe("abcd");
  }

  test("Create each control flow", () => {
    createRoot(dispose => {
      disposer = dispose;
      <Component />;
    });

    expect(div.innerHTML).toBe("abcd");
  });

  test("1 missing", () => {
    apply([n2, n3, n4]);
    apply([n1, n3, n4]);
    apply([n1, n2, n4]);
    apply([n1, n2, n3]);
  });

  test("2 missing", () => {
    apply([n3, n4]);
    apply([n2, n4]);
    apply([n2, n3]);
    apply([n1, n4]);
    apply([n1, n3]);
    apply([n1, n2]);
  });

  test("3 missing", () => {
    apply([n1]);
    apply([n2]);
    apply([n3]);
    apply([n4]);
  });

  test("all missing", () => {
    apply([]);
  });

  test("swaps", () => {
    apply([n2, n1, n3, n4]);
    apply([n3, n2, n1, n4]);
    apply([n4, n2, n3, n1]);
  });

  test("rotations", () => {
    apply([n2, n3, n4, n1]);
    apply([n3, n4, n1, n2]);
    apply([n4, n1, n2, n3]);
  });

  test("reversal", () => {
    apply([n4, n3, n2, n1]);
  });

  test("full replace", () => {
    apply(["e", "f", "g", "h"]);
  });

  test("swap backward edge", () => {
    setList(["milk", "bread", "chips", "cookie", "honey"]);
    setList(["chips", "bread", "cookie", "milk", "honey"]);
  });

  test("dispose", () => disposer());
});

describe("Testing an multi child each control flow", () => {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode("z"));
  const n1 = "a",
    n2 = "b",
    n3 = "c",
    n4 = "d";
  const [list, setList] = createSignal([n1, n2, n3, n4]);
  const Component = () => <For each={list()}>{item => item}</For>;
  let disposer;

  function apply(array) {
    setList(array);
    expect(div.innerHTML).toBe(array.join("") + "z");
    setList([n1, n2, n3, n4]);
    expect(div.innerHTML).toBe("abcdz");
  }

  test("Create each control flow", () => {
    createRoot(dispose => {
      disposer = dispose;
      insert(div, <Component />, div.firstChild);
    });

    expect(div.innerHTML).toBe("abcdz");
  });

  test("1 missing", () => {
    apply([n2, n3, n4]);
    apply([n1, n3, n4]);
    apply([n1, n2, n4]);
    apply([n1, n2, n3]);
  });

  test("2 missing", () => {
    apply([n3, n4]);
    apply([n2, n4]);
    apply([n2, n3]);
    apply([n1, n4]);
    apply([n1, n3]);
    apply([n1, n2]);
  });

  test("3 missing", () => {
    apply([n1]);
    apply([n2]);
    apply([n3]);
    apply([n4]);
  });

  test("all missing", () => {
    apply([]);
  });

  test("swaps", () => {
    apply([n2, n1, n3, n4]);
    apply([n3, n2, n1, n4]);
    apply([n4, n2, n3, n1]);
  });

  test("rotations", () => {
    apply([n2, n3, n4, n1]);
    apply([n3, n4, n1, n2]);
    apply([n4, n1, n2, n3]);
  });

  test("reversal", () => {
    apply([n4, n3, n2, n1]);
  });

  test("full replace", () => {
    apply(["e", "f", "g", "h"]);
  });

  test("swap backward edge", () => {
    setList(["milk", "bread", "chips", "cookie", "honey"]);
    setList(["chips", "bread", "cookie", "milk", "honey"]);
  });

  test("dispose", () => disposer());
});

describe("Testing an only child each control flow with fragment children", () => {
  let div, disposer;
  const n1 = "a",
    n2 = "b",
    n3 = "c",
    n4 = "d";
  const [list, setList] = createSignal([n1, n2, n3, n4]);
  const Component = () => (
    <div ref={div}>
      <For each={list()}>
        {item => (
          <>
            {item}
            {item}
          </>
        )}
      </For>
    </div>
  );

  function apply(array) {
    setList(array);
    expect(div.innerHTML).toBe(array.map(p => `${p}${p}`).join(""));
    setList([n1, n2, n3, n4]);
    expect(div.innerHTML).toBe("aabbccdd");
  }

  test("Create each control flow", () => {
    createRoot(dispose => {
      disposer = dispose;
      <Component />;
    });

    expect(div.innerHTML).toBe("aabbccdd");
  });

  test("1 missing", () => {
    apply([n2, n3, n4]);
    apply([n1, n3, n4]);
    apply([n1, n2, n4]);
    apply([n1, n2, n3]);
  });

  test("2 missing", () => {
    apply([n3, n4]);
    apply([n2, n4]);
    apply([n2, n3]);
    apply([n1, n4]);
    apply([n1, n3]);
    apply([n1, n2]);
  });

  test("3 missing", () => {
    apply([n1]);
    apply([n2]);
    apply([n3]);
    apply([n4]);
  });

  test("all missing", () => {
    apply([]);
  });

  test("swaps", () => {
    apply([n2, n1, n3, n4]);
    apply([n3, n2, n1, n4]);
    apply([n4, n2, n3, n1]);
  });

  test("rotations", () => {
    apply([n2, n3, n4, n1]);
    apply([n3, n4, n1, n2]);
    apply([n4, n1, n2, n3]);
  });

  test("reversal", () => {
    apply([n4, n3, n2, n1]);
  });

  test("full replace", () => {
    apply(["e", "f", "g", "h"]);
  });

  test("swap backward edge", () => {
    setList(["milk", "bread", "chips", "cookie", "honey"]);
    setList(["chips", "bread", "cookie", "milk", "honey"]);
  });

  test("dispose", () => disposer());
});

describe("Testing an only child each control flow with array children", () => {
  let div, disposer;
  const n1 = "a",
    n2 = "b",
    n3 = "c",
    n4 = "d";
  const [list, setList] = createSignal([n1, n2, n3, n4]);
  const Component = () => (
    <div ref={div}>
      <For each={list()}>{item => [item, item]}</For>
    </div>
  );

  function apply(array) {
    setList(array);
    expect(div.innerHTML).toBe(array.map(p => `${p}${p}`).join(""));
    setList([n1, n2, n3, n4]);
    expect(div.innerHTML).toBe("aabbccdd");
  }

  test("Create each control flow", () => {
    createRoot(dispose => {
      disposer = dispose;
      <Component />;
    });

    expect(div.innerHTML).toBe("aabbccdd");
  });

  test("1 missing", () => {
    apply([n2, n3, n4]);
    apply([n1, n3, n4]);
    apply([n1, n2, n4]);
    apply([n1, n2, n3]);
  });

  test("2 missing", () => {
    apply([n3, n4]);
    apply([n2, n4]);
    apply([n2, n3]);
    apply([n1, n4]);
    apply([n1, n3]);
    apply([n1, n2]);
  });

  test("3 missing", () => {
    apply([n1]);
    apply([n2]);
    apply([n3]);
    apply([n4]);
  });

  test("all missing", () => {
    apply([]);
  });

  test("swaps", () => {
    apply([n2, n1, n3, n4]);
    apply([n3, n2, n1, n4]);
    apply([n4, n2, n3, n1]);
  });

  test("rotations", () => {
    apply([n2, n3, n4, n1]);
    apply([n3, n4, n1, n2]);
    apply([n4, n1, n2, n3]);
  });

  test("reversal", () => {
    apply([n4, n3, n2, n1]);
  });

  test("full replace", () => {
    apply(["e", "f", "g", "h"]);
  });

  test("swap backward edge", () => {
    setList(["milk", "bread", "chips", "cookie", "honey"]);
    setList(["chips", "bread", "cookie", "milk", "honey"]);
  });

  test("dispose", () => disposer());
});

describe("Testing each control flow with fallback", () => {
  let div, disposer;
  const n1 = "a",
    n2 = "b",
    n3 = "c",
    n4 = "d";
  const [list, setList] = createSignal([]);
  const Component = () => (
    <div ref={div}>
      <For each={list()} fallback={"Empty"}>
        {item => item}
      </For>
    </div>
  );

  test("Create each control flow", () => {
    createRoot(dispose => {
      disposer = dispose;
      <Component />;
    });
    expect(div.innerHTML).toBe("Empty");
    setList([n1, n2, n3, n4]);
    expect(div.innerHTML).toBe("abcd");
    setList([]);
    expect(div.innerHTML).toBe("Empty");
  });

  test("dispose", () => disposer());
});

describe("Testing each that maps to undefined", () => {
  let div, disposer;
  const n1 = "a",
    n2 = "b",
    n3 = "c",
    n4 = "d";
  const [list, setList] = createSignal([]);
  const Component = () => (
    <div ref={div}>
      <For each={list()}>{item => undefined}</For>
    </div>
  );

  test("Create each control flow", () => {
    createRoot(dispose => {
      disposer = dispose;
      <Component />;
    });
    expect(div.innerHTML).toBe("");
    setList([n1, n2, n3, n4]);
    expect(div.innerHTML).toBe("");
    setList([]);
    expect(div.innerHTML).toBe("");
  });

  test("dispose", () => disposer());
});
