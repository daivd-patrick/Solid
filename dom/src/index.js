import { createRuntime } from 'babel-plugin-jsx-dom-expressions';
import S from 's-js';

function shallowDiff(a, b) {
  let sa = new Set(a), sb = new Set(b);
  return [a.filter(i => !sb.has(i)), (b.filter(i => !sa.has(i)))];
}

export const r = createRuntime({wrap: S.makeComputationNode});

export function selectWhen(signal, handler) {
  return list => {
    S.on(signal, element => {
      const model = signal();
      if (element) handler(element, false);
      if (element = model && list().find(el => el.model === model)) handler(element, true);
      return element;
    });
    return list;
  }
}

export function selectEach(signal, handler) {
  return list => {
    S.on(signal, elements => {
      const models = signal(),
        newElements = list().filter(el => models.indexOf(el.model) > -1),
        [additions, removals] = shallowDiff(newElements, elements);
      additions.forEach(el => handler(el, true));
      removals.forEach(el => handler(el, false));
      return newElements;
    });
    return list;
  }
}
