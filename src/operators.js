import S from 's-js';
import { unwrap, isObject }  from './utils';

function fromPromise(promise, seed) {
  let s = S.makeDataNode(seed),
    complete = false;
  promise
    .then((value) => {
      if (complete) return;
      s.next(value);
    }).catch(err => console.error(err));

  S.cleanup(function dispose() { complete = true; });
  return () => s.current();
}

function fromObservable(observable, seed) {
  let s = S.makeDataNode(seed),
    disposable = observable.subscribe(v => s.next(v), err => console.error(err));

  S.cleanup(function dispose() {
    disposable.unsubscribe();
    disposable = null;
  });
  return () => s.current();
}

export function from(input, seed) {
  if (isObject(input)) {
    if (typeof input === 'function') return input;
    if (Symbol.observable in input) return fromObservable(input[Symbol.observable](), seed);
    if ('then' in input) return fromPromise(input, seed);
  }
  throw new Error('from() input must be a function, Promise, or Observable');
}

export function pipe(input, ...fns) {
  return compose(...fns)(input);
}

export function map(fn) {
  return input => () => {
    const value = input();
    if (value === void 0) return;
    return S.sample(() => fn(value));
  }
}

export function compose(...fns) {
  if (!fns) return i => i;
  if (fns.length === 1) return fns[0];
  return input => fns.reduce(((prev, fn) => fn(prev)), input);
}

// memoized map that handles falsey rejection
export function when(mapFn) {
  let mapped, value, disposable;
  S.cleanup(function dispose() {
    disposable && disposable();
  });
  return map(function mapper(newValue) {
    if (newValue == null || newValue === false) {
      disposable && disposable();
      return value = mapped = disposable = null;
    }
    if (value === newValue) return mapped;
    disposable && disposable();
    disposable = null;
    value = newValue;
    return mapped = S.root((d) => {
      disposable = d;
      return mapFn(value);
    });
  })
}

// Need to be able grab wrapped state internals so can't use S-Array
export function each(mapFn) {
  let mapped = [],
      list = [],
      disposables = [],
      length = 0;
  S.cleanup(function dispose() {
    for (let i = 0; i < disposables.length; i++) disposables[i]();
  });
  return map(function mapper(newList) {
    let newListUnwrapped = unwrap(newList), i, j = 0,
      newLength = (newListUnwrapped && newListUnwrapped.length) || 0;
    if (newLength === 0) {
      if (length !== 0) {
        for (i = 0; i < length; i++) disposables[i]();
        list = [];
        mapped = [];
        disposables = [];
        length = 0;
      }
    } else if (length === 0) {
      j = 0;
      while (j < newLength) {
        list[j] = newListUnwrapped[j];
        mapped[j] = S.root(mappedFn);
        j++;
      }
      length = newLength;
    } else {
      const newMapped = new Array(newLength),
        tempDisposables = new Array(newLength),
        indexedItems = new Map();

      // reduce from both ends
      let end = Math.min(length, newLength),
        start = 0, item, itemIndex, newEnd;
      while (start < end && newListUnwrapped[start] === list[start]) start++;

      end = length - 1;
      newEnd = newLength - 1;
      while (end >= 0 && newEnd >= 0 && newListUnwrapped[newEnd] === list[end]) {
        newMapped[newEnd] = mapped[end];
        tempDisposables[newEnd] = disposables[end];
        end--;
        newEnd--;
      }

      // create indices
      j = newEnd;
      while (j >= start) {
        item = newListUnwrapped[j];
        itemIndex = indexedItems.get(item);
        if (itemIndex != null) itemIndex.push(j);
        else indexedItems.set(item, [j]);
        j--;
      }

      // find old items
      i = start;
      while (i <= end) {
        item = list[i];
        itemIndex = indexedItems.get(item);
        if (itemIndex != null && itemIndex.length > 0) {
          j = itemIndex.pop();
          newMapped[j] = mapped[i];
          tempDisposables[j] = disposables[i];
        } else disposables[i]();
        i++;
      }

      // set all new values
      j = start;
      while (j < newLength) {
        if (newMapped.hasOwnProperty(j)) {
          mapped[j] = newMapped[j];
          disposables[j] = tempDisposables[j];
        } else mapped[j] = S.root(mappedFn);
        j++;
      }

      // truncate extra length
      length = mapped.length = disposables.length = newLength;
      // save list for next iteration
      list = newListUnwrapped.slice(0);
    }
    return mapped;

    function mappedFn(dispose) {
      let ref;
      disposables[j] = dispose;
      const row = (ref = newList.sample) ? ref(j) : newList[j];
      return mapFn(row, j);
    }
  });
}

// export observable
export function observable(input) {
  if (Symbol.observable in input) return input[Symbol.observable]();
  return {
    subscribe(observer) {
      if (!(observer instanceof Object) || observer == null) {
        throw new TypeError('Expected the observer to be an object.');
      }
      observer = observer.next || observer;
      let complete = false;
      S.on(input, function next() {
        if (complete) return;
        observer(input());
      });
      return {
        unsubscribe() { complete = true; }
      };
    },
    [Symbol.observable]() { return this; }
  };
}
