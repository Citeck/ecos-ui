import { comp1 as nestedForm } from 'formiojs/components/form/fixtures';
import { Components } from 'formiojs/formio.form.js';
import sinon from 'sinon';

import { COOKIE_KEY_LOCALE } from '../../../constants/alfresco';

export default {
  title: 'Nested Form Tests',
  form: { components: [nestedForm] },
  tests: {
    'Nested form should receive new lang through options, when parent form lang changed'(form, done) {
      const constructorFnSpy = sinon.spy(Components.components, 'form');
      const callback = () => {
        try {
          document.cookie = `${COOKIE_KEY_LOCALE}=us`;
          expect(constructorFnSpy.called).toBe(true);
          expect(constructorFnSpy.calledOnce).toBe(true);
          const args = constructorFnSpy.args[0];
          args[1].language = 'us';
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
