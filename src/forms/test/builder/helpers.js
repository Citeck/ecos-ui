import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import Harness from '../harness';
import EventEmitter from '../../EventEmitter';
import { disabledComponents } from '../../utils';

export const basicSectionTest = Component => {
  const type = Component.type || Component.schema().type;

  if (!type || disabledComponents.includes(type)) {
    return;
  }

  const keys = {
    correct: 'component:key',
    incorrect: 'key_#%$#'
  };

  describe(`${Component.name} Builder`, () => {
    beforeEach(done => {
      Harness.builderBefore(() => {}, {
        editForm: {
          events: new EventEmitter({
            wildcard: false,
            maxListeners: 0,
            loadLimit: 250,
            log: true
          })
        }
      });

      done();
    });
    afterEach(() => Harness.builderAfter());

    it('The first tab in the builder must be "Basic"', done => {
      const builder = Harness.buildComponent(type);

      builder.editForm.formReady.then(() => {
        const firstTab = builder.dialog.querySelector('.nav-item');

        expect(firstTab).not.toBeUndefined();
        expect(firstTab.textContent).toBe('Basic');
        done();
      });
    });

    it('The key must be correct', done => {
      const builder = Harness.buildComponent(type, true);

      builder.editForm.formReady.then(() => {
        const component = cloneDeep(builder.editForm.submission);

        set(component, 'data.key', keys.correct);

        builder.off('updateComponent');
        builder.on('updateComponent', () => {
          builder.editForm.checkValidity(builder.editForm.submission.data, true);
          builder.showErrors(builder.editForm.errors, true);

          const error = builder.editForm.element.querySelector('.formio-component-key > .formio-errors');

          expect(builder.editForm.submission.data.key).toBe(keys.correct);
          expect(error).toBeNull();

          done();
        });
        builder.editForm.submission = component;
      });
    });

    it('The key must be incorrect', done => {
      const builder = Harness.buildComponent(type, true);

      builder.editForm.formReady.then(() => {
        const component = cloneDeep(builder.editForm.submission);

        set(component, 'data.key', keys.incorrect);

        builder.off('updateComponent');
        builder.on('updateComponent', () => {
          builder.editForm.checkValidity(builder.editForm.submission.data, true);
          builder.showErrors(builder.editForm.errors, true);

          const error = builder.editForm.element.querySelector('.formio-component-key > .formio-errors');

          expect(builder.editForm.submission.data.key).toBe(keys.incorrect);
          expect(error).not.toBeNull();

          done();
        });
        builder.editForm.submission = component;
      });
    });
  });
};
