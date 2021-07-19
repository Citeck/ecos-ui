import Harness from '../harness';
import EventEmitter from '../../EventEmitter';
import { disabledComponents } from '../../utils';

export const basicSectionTest = Component => {
  if (!Component.type || disabledComponents.includes(Component.type)) {
    return;
  }

  describe(`${Component.name} Builder`, () => {
    let builder = null;

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

    it('The first tab in the builder must be "Basic"', done => {
      builder = Harness.buildComponent(Component.type);
      builder.editForm.formReady.then(() => {
        const firstTab = builder.dialog.querySelector('.nav-item');

        expect(firstTab).not.toBeUndefined();
        expect(firstTab.textContent).toBe('Basic');
        done();

        Harness.builderAfter();
      });
    });
  });
};