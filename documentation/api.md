# Basic Reactivity

## `createSignal`

```ts
export function createSignal<T>(
  value: T,
  options?: { name?: string; equals?: false | ((prev: T, next: T) => boolean) }
): [get: () => T, set: (v: T) => T];
```

This is the most basic reactive primitive used to track a single value that changes over time. The create function returns a get and set pair of functions to access and update the signal.

```js
const [getValue, setValue] = createSignal(initialValue);

// read value
getValue();

// set value
setValue(nextValue);
```

Remember to access signals under a tracking scope if you wish them to react to updates.

## `createEffect`

```ts
export function createEffect<T>(fn: (v: T) => T, value?: T, options?: { name?: string }): void;
```

Creates a new computation that automatically tracks dependencies and runs after each render where a dependency has changed. Ideal for using `ref`s and managing other side effects.

```js
const [a, setA] = createSignal(initialValue);

// effect that depends on signal `a`
createEffect(() => doSideEffect(a()));
```

The effect function is called with the value returned from the effect function's last execution. This value can be initialized as an optional 2nd argument. This can be useful for diffing without creating an additional closure.

```js
createEffect(prev => {
  const sum = a() + b();
  if (sum !== prev) console.log(sum);
  return sum;
}, 0);
```

## `createMemo`

```ts
export function createMemo<T>(
  fn: (v: T) => T,
  value?: T,
  options?: { name?: string; equals?: false | ((prev: T, next: T) => boolean) }
): () => T;
```

Creates a readonly derived signal that recalculates it's value whenever the executed code's dependencies update.

```js
const getValue = createMemo(() => computeExpensiveValue(a(), b()));

// read value
getValue();
```

The memo function is called with the value returned from the memo function's last execution. This value can be initialized as an optional 2nd argument. This is useful for reducing computations.

```js
const sum = createMemo(prev => input() + prev, 0);
```

## `createResource`

```ts
type ResourceReturn<T> = [
  {
    (): T | undefined;
    loading: boolean;
    error: any;
  },
  {
    mutate: (v: T | undefined) => T | undefined;
    refetch: () => void;
  }
];

export function createResource<T, U = true>(
  fetcher: (k: U, getPrev: () => T | undefined) => T | Promise<T>,
  options?: { initialValue?: T; name?: string }
): ResourceReturn<T>;

export function createResource<T, U>(
  source: U | false | null | (() => U | false | null),
  fetcher: (k: U, getPrev: () => T | undefined) => T | Promise<T>,
  options?: { initialValue?: T; name?: string }
): ResourceReturn<T>;
```

Creates a signal that can manage async requests. The `fetcher` is an async function that accepts return value of the `source` if provided and returns a Promise whose resolved value is set in the resource. The fetcher is not reactive so use the optional first argument if you want it to run more than once. If the source resolves to false, null, or undefined will not to fetch.

```js
const [data, { mutate, refetch }] = createResource(getQuery, fetchData);

// read value
data();

// check if loading
data.loading;

// check if errored
data.error;

// directly set value without creating promise
mutate(optimisticValue);

// refetch last request just because
refetch();
```

`loading` and `error` are reactive getters and can be tracked.

## `createState`

```ts
export function createState<T extends StateNode>(
  state: T | State<T>,
  options?: { name?: string }
): [get: State<T>, set: SetStateFunction<T>];
```

This creates a tree of signals as proxy that allows individual values in nested data structures to be independently tracked. The create function returns a readonly proxy object, and a state setter function.

```js
const [state, setState] = createState(initialValue);

// read value
state.someValue;

// set value
setState({ merge: "thisValue" });

setState("path", "to", "value", newValue);
```

### Getters

State objects support the use of getters to store calculated values.

```js
const [state, setState] = createState({
  user: {
    firstName: "John",
    lastName: "Smith",
    get fullName() {
      return `${this.firstName} ${this.lastName}`;
    }
  }
});
```

These are simple getters, so you still need to use a Memo if you want to cache a value;

```js
let fullName;
const [state, setState] = createState({
  user: {
    firstName: "John",
    lastName: "Smith",
    get fullName() {
      return fullName();
    }
  }
});
fullName = createMemo(() => `${state.firstName} ${state.lastName}`);
```

### Setting State

Changes can take the form of function that passes previous state and returns new state or a value. Objects are always merged. Set values to `undefined` to delete them from state.

```js
const [state, setState] = createState({ firstName: "John", lastName: "Miller" });

setState({ firstName: "Johnny", middleName: "Lee" });
// ({ firstName: 'Johnny', middleName: 'Lee', lastName: 'Miller' })

setState(state => ({ preferredName: state.firstName, lastName: "Milner" }));
// ({ firstName: 'Johnny', preferredName: 'Johnny', middleName: 'Lee', lastName: 'Milner' })
```

It supports paths including key arrays, object ranges, and filter functions.

setState also supports nested setting where you can indicate the path to the change. When nested the state you are updating may be other non Object values. Objects are still merged but other values (including Arrays) are replaced.

```js
const [state, setState] = createState({
  counter: 2,
  list: [
    { id: 23, title: 'Birds' }
    { id: 27, title: 'Fish' }
  ]
});

setState('counter', c => c + 1);
setState('list', l => [...l, {id: 43, title: 'Marsupials'}]);
setState('list', 2, 'read', true);
// {
//   counter: 3,
//   list: [
//     { id: 23, title: 'Birds' }
//     { id: 27, title: 'Fish' }
//     { id: 43, title: 'Marsupials', read: true }
//   ]
// }
```

Path can be string keys, array of keys, iterating objects ({from, to, by}), or filter functions. This gives incredible expressive power to describe state changes.

```js
const [state, setState] = createState({
  todos: [
    { task: 'Finish work', completed: false }
    { task: 'Go grocery shopping', completed: false }
    { task: 'Make dinner', completed: false }
  ]
});

setState('todos', [0, 2], 'completed', true);
// {
//   todos: [
//     { task: 'Finish work', completed: true }
//     { task: 'Go grocery shopping', completed: false }
//     { task: 'Make dinner', completed: true }
//   ]
// }

setState('todos', { from: 0, to: 1 }, 'completed', c => !c);
// {
//   todos: [
//     { task: 'Finish work', completed: false }
//     { task: 'Go grocery shopping', completed: true }
//     { task: 'Make dinner', completed: true }
//   ]
// }

setState('todos', todo => todo.completed, 'task', t => t + '!')
// {
//   todos: [
//     { task: 'Finish work', completed: false }
//     { task: 'Go grocery shopping!', completed: true }
//     { task: 'Make dinner!', completed: true }
//   ]
// }

setState('todos', {}, todo => ({ marked: true, completed: !todo.completed }))
// {
//   todos: [
//     { task: 'Finish work', completed: true, marked: true }
//     { task: 'Go grocery shopping!', completed: false, marked: true }
//     { task: 'Make dinner!', completed: false, marked: true }
//   ]
// }
```

# Lifecycles

## `onMount`

```ts
export function onMount(fn: () => void): void;
```

Registers a method that runs after initial render and elements have been mounted. Ideal for using `ref`s and managing other one time side effects. It is equivalent to a `createEffect` which does not have any dependencies.

## `onCleanup`

```ts
export function onCleanup(fn: () => void): void;
```

Registers a cleanup method that executes on disposal or recalculation of the current reactive scope. Can be used in any Component or Effect.

## `onError`

```ts
export function onError(fn: (err: any) => void): void;
```

Registers an error handler method that executes when child scope errors. Only the nearest scope error handlers execute. Rethrow to trigger up the line.

# Other Primitives

## `createMutable`

```ts
export function createMutable<T extends StateNode>(
  state: T | State<T>,
  options?: { name?: string }
): State<T> {
```

Creates a new mutable State proxy object. State only triggers update on values changing. Tracking is done by intercepting property access and automatically tracks deep nesting via proxy.

Useful for integrating external systems or as a compatibility layer with MobX/Vue.

> **Note:** As mutable state can be passed around and mutated anywhere, which can make it harder to follow and break unidirectional flow, it generally recommended to use `createState` instead. The `produce` state modifier can give many of the same benefits without any of the downsides.

```js
const state = createMutable(initialValue);

// read value
state.someValue;

// set value
state.someValue = 5;

state.list.push(anotherValue);
```

Mutables support setters along with getters.

```js
const user = createMutable({
  firstName: "John",
  lastName: "Smith",
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  },
  set fullName(value) {
    [this.firstName, this.lastName] = value.split(" ");
  }
});
```

## `createDeferred`

```ts
export function createDeferred<T>(
  source: () => T,
  options?: { timeoutMs?: number; name?: string; equals?: false | ((prev: T, next: T) => boolean) }
): () => T;
```

Creates a readonly that only notifies downstream changes when the browser is idle. `timeoutMs` is the maximum time to wait before forcing the update.

## `createComputed`

```ts
export function createComputed<T>(fn: (v: T) => T, value?: T, options?: { name?: string }): void;
```

Creates a new computation that automatically tracks dependencies and runs immediately before render. Use this to write to other reactive primitives. When possible use `createMemo` instead as writing to a signal mid update can cause other computations to need to re-calculate.

## `createRenderEffect`

```ts
export function createRenderEffect<T>(
  fn: (v: T) => T,
  value?: T,
  options?: { name?: string }
): void;
```

Creates a new computation that automatically tracks dependencies and runs during the render phase as DOM elements are created and updated but not necessarily connected. All internal DOM updates happen at this time.

## `createSelector`

```ts
export function createSelector<T, U>(
  source: () => T,
  fn?: (a: U, b: T) => boolean,
  options?: { name?: string }
): (k: U) => boolean;
```

Creates a conditional signal that only notifies subscribers when entering or exiting their key matching the value. Useful for delegated selection state. As it makes the operation O(2) instead of O(n).

```js
const isSelected = createSelector(selectedId);

<For each={list()}>{item => <li classList={{ active: isSelected(item.id) }}>{item.name}</li>}</For>;
```

# Reactive Utilities

## `untrack`

```ts
export function untrack<T>(fn: () => T): T;
```

Ignores tracking any of the dependencies in the executing code block and returns the value.

## `batch`

```ts
export function batch<T>(fn: () => T): T;
```

Holds committing updates within the block until the end to prevent unnecessary recalculation. This means that reading values on the next line will not have updated yet. Solid State's `setState` method and Effects automatically wrap their code in a batch.

## `on`

```ts
type ReturnTypeArray<T> = { [P in keyof T]: T[P] extends () => infer U ? U : never };
export function on<T, X extends Array<() => T>, U>(
  ...args: X["length"] extends 1
    ? [w: () => T, fn: (v: T, prev: T | undefined, prevResults?: U) => U]
    : [...w: X, fn: (v: ReturnTypeArray<X>, prev: ReturnTypeArray<X> | [], prevResults?: U) => U]
): (prev?: U) => U;
```

`on` is designed to be passed into a computation to make its dependencies explicit. If more than one dependency is passed, value and prevValue are arrays.

```js
createEffect(on(a, v => console.log(v, b())));

// is equivalent to:
createEffect(() => {
  const v = a();
  untrack(() => console.log(v, b()));
});
```

## `createRoot`

```ts
export function createRoot<T>(fn: (dispose: () => void) => T): T;
```

Creates a new non-tracked context that doesn't auto-dispose. This useful for nested reactive context that you do not wish to release when the parent re-evaluates. This is a powerful pattern for caching.

All Solid code should be wrapped in one of these top level as they ensure that all memory/computations are freed up. Normally you do not need to worry about this as `createRoot` is embedded into all `render` entry functions.

## `mergeProps`

```ts
export function mergeProps(...sources: any): any;
```

A reactive object `merge` method. Useful for setting default props for components in case caller doesn't provide them. Or cloning the props object including reactive properties.

This method works by using a proxy and resolving properties in reverse order. This allows for dynamic tracking of properties that aren't present when the prop object is first merged.

```js
// default props
props = mergeProps({ name: "Smith" }, props);

// clone props
newProps = mergeProps(props);

// merge props
props = mergeProps(props, otherProps);
```

## `splitProps`

```ts
export function splitProps<T>(props: T, ...keys: Array<(keyof T)[]>): [...parts: Partial<T>];
```

This is the replacement for destructuring. It splits a reactive object by keys while maintaining reactivity.

```js
const [local, others] = splitProps(props, ["children"]);

<>
  <Child {...others} />
  <div>{local.children}<div>
</>
```

## `useTransition`

```ts
export function useTransition(): [() => boolean, (fn: () => void, cb?: () => void) => void];
```

Used to batch async updates in a transaction deferring commit until all async processes are complete. This is tied into Suspense and only tracks resources read under Suspense boundaries.

```js
const [isPending, start] = createTransition();

// check if transitioning
isPending();

// wrap in transition
start(() => setSignal(newValue), () => /* transition is done */)
```

# State Modifiers

Used to add additional behavior to `setState` function created with `createState`.

## `produce`

```ts
export function produce<T>(
  fn: (state: T) => void
): (state: T extends NotWrappable ? T : State<T>) => T extends NotWrappable ? T : State<T>;
```
Immer inspired API for Solid's state objects that allows for localized mutation.

```js
setState(produce(s => {
  s.user.name = "Frank";
  s.list.push("Pencil Crayon");
}))
```

## `reconcile`

```ts
export function reconcile<T>(
  value: T | State<T>,
  options?: {
    key?: string | null;
    merge?: boolean;
  } = { key; "id" }
): (state: T extends NotWrappable ? T : State<T>) => T extends NotWrappable ? T : State<T>;
```

Diffs data changes when we can't apply granular updates. Useful for when dealing with immutable data from stores or large API responses.

```js
```

# Component APIs

## `createContext`

```ts
interface Context<T> {
  id: symbol;
  Provider: (props: { value: T; children: any }) => any;
  defaultValue: T;
}
export function createContext<T>(defaultValue?: T): Context<T | undefined>;
```

Context provides a form of dependency injection in Solid. It is used to save from needing to pass data as props through intermediate components.

This function creates a new context object that can be used with `useContext` and provides the `Provider` control flow. Default Context is used when no `Provider` is found above in the hierarchy.

```js
export const CounterContext = createContext([{ count: 0 }, {}]);

export function CounterProvider(props) {
  const [state, setState] = createState({ count: props.count || 0 });
  const store = [
    state,
    {
      increment() {
        setState("count", c => c + 1);
      },
      decrement() {
        setState("count", c => c - 1);
      }
    }
  ];

  return <CounterContext.Provider value={store}>{props.children}</CounterContext.Provider>;
}
```

## `useContext`

```ts
export function useContext<T>(context: Context<T>): T;
```

Used to grab context to allow for deep passing of props without having to pass them through each Component function.

```js
const [state, { increment, decrement }] = useContext(CounterContext);
```

## `children`

```ts
export function children(fn: () => any): () => any;
```

Used to make it easier to interact with `props.children`. This helper resolves any nested reactivity and returns a memo. Recommended approach to using `props.children` in anything other than passing directly through to JSX.

```js
const list = children(() => props.children);

// do something with them
createEffect(() => list());
```

## `lazy`

```ts
export function lazy<T extends Component<any>>(
  fn: () => Promise<{ default: T }>
): T & { preload: () => Promise<T> };
```

Used to lazy load components to allow for code splitting. Components are not loaded until rendered. Lazy loaded components can be used the same as its statically imported counterpart, receiving props etc... Lazy components trigger `<Suspense>`

```js
// wrap import
const ComponentA = lazy(() => import("./ComponentA"));

// use in JSX
<ComponentA title={props.title} />;
```

# Rendering

These imports are exposed from `solid-js/web`.

## `render`

## `hydrate`

## `renderToString`

## `renderToStringAsync`

## `renderToNodeStream`

## `renderToWebStream`

## `isServer`

# Control Flow

## `<For>`

## `<Show>`

## `<Switch>`/`<Match>`

## `<Dynamic>`

## `<Index>`

## `<ErrorBoundary>`

## `<Suspense>`

## `<SuspenseList>`

## `<Portal>`

# Special JSX Attributes

## `ref`

## `classList`

## `style`

## `innerHTML`

## `textContent`

## `on:___`

## `use:___`

## `prop:___`

## `attr:___`
