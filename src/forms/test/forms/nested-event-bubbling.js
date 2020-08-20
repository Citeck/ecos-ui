import sinon from 'sinon';
import FormComponent from 'formiojs/components/form/Form';
import Webform from 'formiojs/Webform.js';

export default {
  title: 'Nested Form Event Bubbling',
  form: { components: [{ key: 'form', type: 'form', components: [{ key: 'name', type: 'textfield' }] }] },
  tests: {
    'Event should bubble up to parent form'(form, done) {
      try {
        const EPE = 'Parent events not works';
        const ENE = 'Nested events not works';
        const EBB = 'Events not bubbling up';
        const type1 = 'parent.custom.event';
        const type2 = 'nested.custom.event';
        const type3 = 'bubbling.event';
        const listener1 = sinon.spy();
        const listener2 = sinon.spy();
        const listener3parent = sinon.spy();
        const listener3nested = sinon.spy();
        const [formCmp] = form.components;

        // Check wrapper
        expect(formCmp).toBeInstanceOf(FormComponent);

        formCmp.subFormReady
          .then(subForm => {
            // Check nested form
            expect(subForm).toBeInstanceOf(Webform);

            // Make sure that parent emitter works
            form.on(type1, listener1);
            form.emit(type1);
            expect(listener1.callCount).toBe(1);
            form.emit(type1);
            expect(listener1.callCount).toBe(2);

            // Make sure that nested emitter works
            subForm.on(type2, listener2);
            subForm.emit(type2);
            expect(listener2.callCount).toBe(1);
            subForm.emit(type2);
            expect(listener2.callCount).toBe(2);

            // Check event bubbling;
            form.on(type3, listener3parent);
            subForm.on(type3, listener3nested);
            subForm.emit(type3);
            expect(listener3nested.callCount).toBe(1);
            expect(listener3parent.callCount).toBe(1);
            subForm.emit(type3);
            expect(listener3nested.callCount).toBe(2);
            expect(listener3parent.callCount).toBe(2);
            done();
          }, done)
          .catch(done);
      } catch (error) {
        done(error);
      }
    }
  }
};
