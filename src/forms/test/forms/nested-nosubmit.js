import FormComponent from 'formiojs/components/form/Form';
import Webform from 'formiojs/Webform.js';

export default {
  title: 'Nested Form nosubmit flag',
  form: { components: [{ key: 'form', type: 'form', components: [{ key: 'name', type: 'textfield' }] }] },
  tests: {
    'Should set nosubmit flag for nested forms'(form, done) {
      try {
        const EINIT = 'Initial value mismatch';
        const EPNOC = 'Parent flag not changed';
        const ECNOC = 'Child flag not changed';
        const [formCmp] = form.components;

        // Check wrapper
        expect(formCmp).toBeInstanceOf(FormComponent);

        formCmp.subFormReady
          .then(subForm => {
            expect(subForm).toBeInstanceOf(Webform);
            expect(form.nosubmit).toBe(false); // EINIT
            expect(subForm.nosubmit).toBe(false); // EINIT
            form.nosubmit = true;
            expect(form.nosubmit).toBe(true); // EPNOC
            expect(subForm.nosubmit).toBe(true); // ECNOC
            form.nosubmit = false;
            expect(form.nosubmit).toBe(false); // EPNOC
            expect(subForm.nosubmit).toBe(false); // ECNOC
            done();
          }, done)
          .catch(done);
      } catch (error) {
        done(error);
      }
    }
  }
};
