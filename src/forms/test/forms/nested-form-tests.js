import { comp1 as nestedForm } from 'formiojs/components/form/fixtures';
import { Components } from 'formiojs/formio.form.js';
import sinon from 'sinon';

export default {
  title: 'Nested Form Tests',
  form: { components: [nestedForm] },
  tests: {
    'Nested form should receive new lang through options, when parent form lang changed'(form, done) {
      const constructorFnSpy = sinon.spy(Components.components, 'form');
      const callback = () => {
        try {
          expect(constructorFnSpy.called).toBe(true);
          expect(constructorFnSpy.calledOnce).toBe(true);
          const args = constructorFnSpy.args[0];
          expect(typeof args[1]).toBe('object');
          expect(args[1].language).toBe('us');
        } catch (error) {
          done(error);
        }
        done();
        form.off('languageChanged', callback);
      };

      form.on('languageChanged', callback);
      form.addLanguage('us', {}, true);
    }
  }
};
