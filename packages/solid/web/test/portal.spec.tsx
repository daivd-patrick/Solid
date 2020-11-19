import { render, clearDelegatedEvents, Portal } from "../src";

describe("Testing a simple Portal", () => {
  let div = document.createElement("div"),
    disposer: () => void;
  const testMount = document.createElement("div");
  const Component = () => <Portal mount={testMount}>Hi</Portal>;

  test("Create portal control flow", () => {
    disposer = render(Component, div);
    expect(div.innerHTML).toBe("");
    expect((testMount.firstChild as HTMLDivElement).innerHTML).toBe("Hi");
    expect((testMount.firstChild as HTMLDivElement & { host: HTMLElement }).host).toBe(div);
  });

  test("dispose", () => disposer());
});

describe("Testing an SVG Portal", () => {
  let div = document.createElement("div"),
    disposer: () => void;
  const testMount = document.createElement("svg");
  const Component = () => <Portal mount={testMount} isSVG={true}>Hi</Portal>;

  test("Create portal control flow", () => {
    disposer = render(Component, div);
    expect(div.innerHTML).toBe("");
    expect((testMount.firstChild as SVGGElement).innerHTML).toBe("Hi");
    expect((testMount.firstChild as SVGGElement & { host: SVGElement }).host).toBe(div);
  });

  test("dispose", () => disposer());
});

describe("Testing a Portal to the head", () => {
  let div = document.createElement("div"),
    disposer: () => void;
  const Component = () => (
    <Portal mount={document.head}>
      <title>A Meaningful Page Title</title>
    </Portal>
  );

  test("Create portal control flow", () => {
    disposer = render(Component, div);
    expect(div.innerHTML).toBe("");
    expect(document.head.innerHTML).toBe("<title>A Meaningful Page Title</title>");
  });

  test("dispose", () => disposer());
});

describe("Testing a Portal with Synthetic Events", () => {
  let div = document.createElement("div"),
    disposer: () => void,
    checkElem: HTMLDivElement,
    testElem: HTMLDivElement,
    clicked = false;
  const Component = () => (
    <Portal ref={checkElem}>
      <div ref={testElem} onClick={e => (clicked = true)} />
    </Portal>
  );

  test("Create portal control flow", () => {
    disposer = render(Component, div);
    expect(div.innerHTML).toBe("");
    expect(testElem).toBe(checkElem.firstChild);
  });

  test("Test portal element clicked", () => {
    expect(clicked).toBe(false);
    testElem.click();
    expect(clicked).toBe(true);
    clicked = false;
    clearDelegatedEvents();
    expect(clicked).toBe(false);
    testElem.click();
    expect(clicked).toBe(false);
  });

  test("dispose", () => disposer());
});
