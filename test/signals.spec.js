const { createRoot, createSignal, createEffect, createMemo, freeze } = require('../lib/solid');

describe('Create signals', () => {
  test('Create and read a Signal', () => {
    const [value] = createSignal(5);
    expect(value()).toBe(5);
  });
  test('Create and read a Signal with comparator', () => {
    const [value] = createSignal(5, (a, b) => a === b);
    expect(value()).toBe(5);
  });
  test('Create and read a Memo', () => {
    createRoot(() => {
      const memo = createMemo(() => 'Hello');
      expect(memo()).toBe('Hello');
    });
  });
  test('Create and read a Memo with initial value', () => {
    createRoot(() => {
      const memo = createMemo(i => i + ' John', 'Hello');
      expect(memo()).toBe('Hello John');
    });
  });
  test('Create an Effect', () => {
    createRoot(() => {
      let temp;
      createEffect(() => temp = 'unpure');
      expect(temp).toBe('unpure');
    });
  });
  test('Create an Effect with explicit deps', () => {
    createRoot(() => {
      let temp;
      const [sign] = createSignal('thoughts')
      createEffect(() => temp = 'unpure ' + sign(), [sign]);
      expect(temp).toBe('unpure thoughts');
    });
  });
});

describe('Update signals', () => {
  test('Create and update a Signal', () => {
    const [value, setValue] = createSignal(5);
    setValue(10);
    expect(value()).toBe(10);
  });
  test('Create Signal with comparator and set different value', () => {
    const [value, setValue] = createSignal(5, (a, b) => a === b);
    setValue(10);
    expect(value()).toBe(10);
  });
  test('Create Signal with comparator and set equivalent value', () => {
    const [value, setValue] = createSignal(5, (a, b) => a > b);
    setValue(3);
    expect(value()).toBe(5);
  });
  test('Create Signal with comparator and force synchronicity error', () => {
    const [value, setValue] = createSignal(5, (a, b) => a === b);
    expect(() => freeze(() => {
      setValue(10);
      setValue(5);
    })).toThrow();
  });
  test('Create and trigger a Memo', () => {
    createRoot(() => {
      const [name, setName] = createSignal('John')
        memo = createMemo(() => 'Hello ' + name());
      expect(memo()).toBe('Hello John');
      setName('Jake')
      expect(memo()).toBe('Hello Jake');
    });
  });
  test('Create and trigger an Effect', () => {
    createRoot(() => {
      let temp;
      const [sign, setSign] = createSignal('thoughts')
      createEffect(() => temp = 'unpure ' + sign());
      expect(temp).toBe('unpure thoughts');
      setSign('mind');
      expect(temp).toBe('unpure mind');
    });
  });
  test('Create an Effect trigger explicit deps', () => {
    createRoot(() => {
      let temp;
      const [sign, setSign] = createSignal('thoughts')
      createEffect(() => temp = 'unpure ' + sign(), sign);
      expect(temp).toBe('unpure thoughts');
      setSign('mind');
      expect(temp).toBe('unpure mind');
    });
  });
  test('Create an Effect trigger not in explicit deps', () => {
    createRoot(() => {
      let temp;
      const [sign, setSign] = createSignal('thoughts')
      createEffect(() => temp = 'unpure ' + sign(), []);
      expect(temp).toBe('unpure thoughts');
      setSign('mind');
      expect(temp).toBe('unpure thoughts');
    });
  });
})