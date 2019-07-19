import { onCleanup, createRoot, sample } from './signal';

const FALLBACK = '@@FALLBACK'

// Modified version of mapSample from S-array[https://github.com/adamhaile/S-array] by Adam Haile
export function map<T, U>(
  list: () => T[],
  mapFn: (v: T, i: number) => U,
  fallback?: () => U
) {
  let items = [] as T[],
    mapped = [] as U[],
    disposers = [] as (() => void)[],
    len = 0;
  onCleanup(() => {
    for (let i = 0, length = disposers.length; i < length; i++) disposers[i]();
  })
  return function() {
    let newItems = list(),
      i: number,
      j: number;
    return sample(() => {
      let newLen = newItems.length,
        newIndices: Map<T, number>,
        newIndicesNext: number[],
        temp: U[],
        tempdisposers: (() => void)[],
        start: number,
        end: number,
        newEnd: number,
        item: T;

      // fast path for empty arrays
      if (newLen === 0) {
        if (len !== 0) {
          for (i = 0; i < len; i++) disposers[i]();
          disposers = [];
          items = [];
          mapped = [];
          len = 0;
        }
        if (fallback) {
          items = [FALLBACK as unknown as any];
          mapped[0] = createRoot(disposer => {
            disposers[0] = disposer;
            return fallback();
          });
          len = 1;
        }
      }
      else if (len === 0) {
        for (j = 0; j < newLen; j++) {
          items[j] = newItems[j];
          mapped[j] = createRoot(mapper);
        }
        len = newLen;
      }
      else {
        newIndices = new Map<T, number>();
        temp = new Array(newLen);
        tempdisposers = new Array(newLen);
        // skip common prefix and suffix
        for (start = 0, end = Math.min(len, newLen); start < end && items[start] === newItems[start]; start++)
          ;
        for (end = len - 1, newEnd = newLen - 1; end >= 0 && newEnd >= 0 && items[end] === newItems[newEnd]; end-- , newEnd--) {
          temp[newEnd] = mapped[end];
          tempdisposers[newEnd] = disposers[end];
        }
        // 0) prepare a map of all indices in newItems, scanning backwards so we encounter them in natural order
        newIndicesNext = new Array(newEnd + 1);
        for (j = newEnd; j >= start; j--) {
          item = newItems[j];
          i = newIndices.get(item)!;
          newIndicesNext[j] = i === undefined ? -1 : i;
          newIndices.set(item, j);
        }
        // 1) step through all old items and see if they can be found in the new set; if so, save them in a temp array and mark them moved; if not, exit them
        for (i = start; i <= end; i++) {
          item = items[i];
          j = newIndices.get(item)!;
          if (j !== undefined && j !== -1) {
            temp[j] = mapped[i];
            tempdisposers[j] = disposers[i];
            j = newIndicesNext[j];
            newIndices.set(item, j);
          }
          else disposers[i]();
        }
        // 2) set all the new values, pulling from the temp array if copied, otherwise entering the new value
        for (j = start; j < newLen; j++) {
          if (temp.hasOwnProperty(j)) {
            mapped[j] = temp[j];
            disposers[j] = tempdisposers[j];
          }
          else mapped[j] = createRoot(mapper);
        }
        // 3) in case the new set is shorter than the old, set the length of the mapped array
        len = mapped.length = newLen;
        // 4) save a copy of the mapped items for the next update
        items = newItems.slice(0);
      }
      return mapped;
    });
    function mapper(disposer: () => void) {
      disposers[j] = disposer;
      return mapFn(newItems[j], j);
    }
  };
}