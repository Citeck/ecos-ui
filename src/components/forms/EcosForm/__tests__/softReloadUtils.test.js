import { readRecordSequentially, redrawComponents } from '../softReloadUtils';

describe('softReloadUtils', () => {
  describe('readRecordSequentially', () => {
    it('runs two reads of one record strictly one after the other', async () => {
      const order = [];
      let releaseFirst;
      const first = readRecordSequentially('app/rec@1', () => {
        order.push('first-start');
        return new Promise(resolve => {
          releaseFirst = () => {
            order.push('first-end');
            resolve('a');
          };
        });
      });
      const second = readRecordSequentially('app/rec@1', () => {
        order.push('second-start');
        return Promise.resolve('b');
      });

      // the second task must not have started while the first is in flight
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(order).toEqual(['first-start']);

      releaseFirst();
      await expect(first).resolves.toBe('a');
      await expect(second).resolves.toBe('b');
      expect(order).toEqual(['first-start', 'first-end', 'second-start']);
    });

    it('lets the next read run after a failed one, and the failure stays with its own caller', async () => {
      const first = readRecordSequentially('app/rec@2', () => Promise.reject(new Error('read failed')));
      const second = readRecordSequentially('app/rec@2', () => Promise.resolve('ok'));

      await expect(first).rejects.toThrow('read failed');
      await expect(second).resolves.toBe('ok');
    });

    it('keeps different records independent', async () => {
      let releaseSlow;
      readRecordSequentially('app/slow@1', () => new Promise(resolve => (releaseSlow = resolve)));
      const other = readRecordSequentially('app/fast@1', () => Promise.resolve('fast'));

      await expect(other).resolves.toBe('fast');
      releaseSlow();
    });
  });

  describe('redrawComponents', () => {
    it('redraws only the components whose key changed', () => {
      const changed = { component: { key: 'title' }, redraw: jest.fn() };
      const untouched = { component: { key: 'other' }, redraw: jest.fn() };
      const form = { getAllComponents: () => [changed, untouched] };

      redrawComponents(form, ['title']);

      expect(changed.redraw).toHaveBeenCalledTimes(1);
      expect(untouched.redraw).not.toHaveBeenCalled();
    });

    it('tolerates a missing form, empty keys and a form without getAllComponents', () => {
      expect(() => redrawComponents(null, ['title'])).not.toThrow();
      expect(() => redrawComponents({ getAllComponents: () => [] }, [])).not.toThrow();
      expect(() => redrawComponents({}, ['title'])).not.toThrow();
    });
  });
});
