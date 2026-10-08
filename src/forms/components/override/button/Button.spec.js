import Harness from '../../../test/harness';
import ButtonComponent from './Button';
import Formio from '../../../Formio';
import '../../../Webform'; // ecos overrides of the form itself, `ecosButtonSubmit` among them
import { basicSectionTest } from '../../../test/builder/helpers';

import comp1 from './fixtures/comp1';
import comp2 from './fixtures/comp2';

basicSectionTest(ButtonComponent);

describe('Button Component', () => {
  it('Should build a button component', done => {
    Harness.testCreate(ButtonComponent, comp1).then(component => {
      const buttons = Harness.testElements(component, 'button[type="submit"]', 1);
      for (const button of buttons) {
        expect(button.name).toBe(`data[${comp1.key}]`);
        expect(button.innerHTML).toBe(comp1.label);
      }
      done();
    });
  });

  it('Should build a button component with ML label', done => {
    Harness.testCreate(ButtonComponent, comp2).then(component => {
      const buttons = Harness.testElements(component, 'button[type="submit"]', 1);

      for (const button of buttons) {
        expect(button.name).toBe(`data[${comp2.key}]`);
        expect(button.innerHTML).toBe(comp2.label.en);
      }
      done();
    });
  });

  it('Loader should be displayed', done => {
    Harness.testCreate(ButtonComponent, comp1).then(component => {
      component.loading = true;
      Harness.testAttribute(component, 'button', 'disabled', true, true);
      Harness.testElement(component, '.glyphicon-refresh', true);

      component.loading = false;
      Harness.testAttribute(component, 'button', 'disabled', false, true);
      Harness.testElement(component, '.glyphicon-refresh', false);

      done();
    });
  });

  it('POST to URL button should pass URL and headers', done => {
    const formJson = {
      type: 'form',
      components: [
        {
          label: 'Some Field',
          type: 'textfield',
          input: true,
          key: 'someField'
        },
        {
          label: 'POST to URL',
          action: 'url',
          url: 'someUrl',
          headers: [
            {
              header: 'testHeader',
              value: 'testValue'
            }
          ],
          type: 'button',
          input: true,
          key: 'postToUrl'
        }
      ]
    };
    const element = document.createElement('div');
    Formio.createForm(element, formJson)
      .then(form => {
        const fn = jest.spyOn(Formio, 'makeStaticRequest').mockResolvedValue();
        form.getComponent('postToUrl').buttonElement.click();
        const passedUrl = fn.mock.calls[0][0];
        const passedHeaders = fn.mock.calls[0][3].headers;
        fn.mockClear();

        expect(passedHeaders).toEqual({ testHeader: 'testValue' });
        expect(passedUrl).toBe('someUrl');
        done();
      })
      .catch(done);
  });

  it('POST to URL button should perform URL interpolation', done => {
    const formJson = {
      type: 'form',
      components: [
        {
          label: 'Some Field',
          type: 'textfield',
          input: true,
          key: 'someField'
        },
        {
          label: 'URL',
          type: 'textfield',
          input: true,
          key: 'url'
        },
        {
          label: 'POST to URL',
          action: 'url',
          url: '{{data.url}}/submission',
          type: 'button',
          input: true,
          key: 'postToUrl'
        }
      ]
    };
    const element = document.createElement('div');
    Formio.createForm(element, formJson)
      .then(form => {
        form.submission = {
          data: {
            url: 'someUrl'
          }
        };
        return form.submissionReady.then(() => {
          const fn = jest.spyOn(Formio, 'makeStaticRequest').mockResolvedValue();
          form.getComponent('postToUrl').buttonElement.click();
          const passedUrl = fn.mock.calls[0][0];
          fn.mockClear();

          expect(passedUrl).toBe('someUrl/submission');
          done();
        });
      })
      .catch(done);
  });

  it('POST to URL button should perform headers interpolation', done => {
    const formJson = {
      type: 'form',
      components: [
        {
          label: 'Some Field',
          type: 'textfield',
          input: true,
          key: 'someField'
        },
        {
          label: 'Header',
          type: 'textfield',
          input: true,
          key: 'header'
        },
        {
          label: 'POST to URL',
          action: 'url',
          url: 'someUrl',
          headers: [
            {
              header: 'testHeader',
              value: 'Value {{data.header}}'
            }
          ],
          type: 'button',
          input: true,
          key: 'postToUrl'
        }
      ]
    };
    const element = document.createElement('div');
    Formio.createForm(element, formJson)
      .then(form => {
        form.submission = {
          data: {
            someField: 'some value',
            header: 'some header'
          }
        };
        return form.submissionReady.then(() => {
          const fn = jest.spyOn(Formio, 'makeStaticRequest').mockResolvedValue();
          form.getComponent('postToUrl').buttonElement.click();
          const passedHeaders = fn.mock.calls[0][3].headers;
          fn.mockClear();

          expect(passedHeaders).toEqual({
            testHeader: 'Value some header'
          });
          done();
        });
      })
      .catch(done);
  });

  describe('custom action', () => {
    const customButton = custom => ({ label: 'Custom', action: 'custom', custom, type: 'button', input: true, key: 'customBtn' });

    // An unhandled rejection needs no assertion here: jest fails the whole run on one. It is reported once the
    // microtask queue has drained, hence the timer.
    const settle = () => new Promise(resolve => setTimeout(resolve, 10));
    let consoleError;

    beforeEach(() => {
      consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleError.mockRestore();
      delete window.__customButtonArgs;
    });

    it('should run the script against the form itself, not a copy of it', done => {
      const formJson = {
        type: 'form',
        components: [
          { label: 'Some Field', type: 'textfield', input: true, key: 'someField' },
          customButton('window.__customButtonArgs = { form, flattened, components, instance, data };')
        ]
      };

      Formio.createForm(document.createElement('div'), formJson)
        .then(form => {
          const button = form.getComponent('customBtn');
          button.buttonElement.click();

          // Identity checks as booleans: a failed `toBe` would try to print the whole form tree
          const args = window.__customButtonArgs;
          expect(args.form === form).toBe(true);
          expect(args.instance === button).toBe(true);
          expect(args.data === form.data).toBe(true);
          expect(args.components.someField === form.getComponent('someField')).toBe(true);
          expect(Object.keys(args.flattened)).toEqual(['someField', 'customBtn']);
          done();
        })
        .catch(done);
    });

    it('should keep the fields bound to the form after a submit rejected by validation', done => {
      const formJson = {
        type: 'form',
        components: [
          {
            label: 'Attributes',
            type: 'datagrid',
            input: true,
            key: 'attributes',
            components: [{ label: 'Id', type: 'textfield', input: true, key: 'id', validate: { pattern: '[a-z]*' } }]
          },
          customButton('return form.ecosButtonSubmit();')
        ]
      };

      Formio.createForm(document.createElement('div'), formJson)
        .then(form => {
          form.setValue({ data: { attributes: [{ id: 'x.y' }] } });

          return new Promise(resolve => {
            // `submit` defers the call by a timer and rejects on a validation error
            form.on('error', resolve);
            form.getComponent('customBtn').buttonElement.click();
          }).then(() => {
            const input = form.element.querySelector('.formio-component-id input');
            input.value = 'xy';
            input.dispatchEvent(new Event('input'));

            expect(form.getValue().data.attributes).toEqual([{ id: 'xy' }]);
            done();
          });
        })
        .catch(done);
    });

    it('should report a failing script and go on', done => {
      const formJson = { type: 'form', components: [customButton('throw new Error("broken script");')] };

      Formio.createForm(document.createElement('div'), formJson)
        .then(form => {
          const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

          expect(() => form.getComponent('customBtn').buttonElement.click()).not.toThrow();
          expect(warn).toHaveBeenCalledWith('An error occured within custom function for customBtn', expect.any(Error));

          warn.mockRestore();
          done();
        })
        .catch(done);
    });

    describe('script returning a promise', () => {
      it('should leave a submit rejected by validation to the form, which shows the errors', done => {
        const formJson = {
          type: 'form',
          components: [
            { label: 'Id', type: 'textfield', input: true, key: 'id', validate: { pattern: '[a-z]*' } },
            customButton('return form.ecosButtonSubmit();')
          ]
        };

        Formio.createForm(document.createElement('div'), formJson)
          .then(form => {
            form.setValue({ data: { id: 'x.y' } });

            return new Promise(resolve => {
              form.on('error', resolve);
              form.getComponent('customBtn').buttonElement.click();
            })
              .then(settle)
              .then(() => {
                expect(consoleError).not.toHaveBeenCalled();
                expect(form.getComponent('customBtn').buttonElement.disabled).toBe(false);
                done();
              });
          })
          .catch(done);
      });

      it('should report a rejection of the script itself', done => {
        const formJson = { type: 'form', components: [customButton('return Promise.reject(new Error("request failed"));')] };

        Formio.createForm(document.createElement('div'), formJson)
          .then(form => {
            form.getComponent('customBtn').buttonElement.click();

            return settle().then(() => {
              expect(consoleError).toHaveBeenCalledWith('An error occured within custom function for customBtn', expect.any(Error));
              expect(form.getComponent('customBtn').buttonElement.disabled).toBe(false);
              done();
            });
          })
          .catch(done);
      });
    });
  });

  describe('failed submit', () => {
    const submitButton = (key, extra = {}) => ({ label: key, action: 'submit', type: 'button', input: true, key, ...extra });
    const buttonOf = (form, key) => form.getComponent(key).buttonElement;
    const classesOf = (form, key) => buttonOf(form, key).className.split(' ');
    // A freshly built form still has a `change` to emit — debounced by TRIGGER_CHANGE_DEBOUNCE_WAIT (500 ms,
    // override/misc.js) — and any `change` enables the buttons (see `bindEvents`). Landing after the click, it would
    // unlock them by itself, so neither the lock during the request nor the unlock after the error would be tested.
    const INITIAL_CHANGES_MS = 600;
    const afterInitialChanges = form => new Promise(resolve => setTimeout(() => resolve(form), INITIAL_CHANGES_MS));
    let consoleLog;

    // formio's `submitButton` handler logs the rejection of every failed submit (`console.log(e)`, a stack trace for
    // the server error) — expected here, and noise in the test output.
    beforeEach(() => {
      consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLog.mockRestore();
    });

    it('should hand the buttons back with their own themes after a submit rejected by validation', done => {
      const formJson = {
        type: 'form',
        components: [
          { label: 'Name', type: 'textfield', input: true, key: 'name', validate: { required: true } },
          submitButton('submit', { theme: 'primary' }),
          submitButton('outcome_Reject', { theme: 'danger' }),
          submitButton('draft', { state: 'draft' })
        ]
      };

      Formio.createForm(document.createElement('div'), formJson)
        .then(afterInitialChanges)
        .then(form => {
          return new Promise(resolve => {
            form.on('error', resolve);
            buttonOf(form, 'submit').click();

            // the click locks every submit button of the form until the outcome is known
            expect(buttonOf(form, 'outcome_Reject').disabled).toBe(true);
          }).then(() => {
            ['submit', 'outcome_Reject', 'draft'].forEach(key => {
              expect(buttonOf(form, key).disabled).toBe(false);
              expect(classesOf(form, key)).not.toContain('submit-fail');
            });

            expect(classesOf(form, 'submit')).not.toContain('btn-danger');
            expect(classesOf(form, 'outcome_Reject')).toContain('btn-danger');
            done();
          });
        })
        .catch(done);
    });

    it('should keep disabled the buttons that are disabled on purpose', done => {
      const formJson = {
        type: 'form',
        components: [
          { label: 'Name', type: 'textfield', input: true, key: 'name', validate: { required: true } },
          submitButton('submit'),
          submitButton('guarded', { disableOnFormInvalid: true }),
          submitButton('locked', { disabled: true })
        ]
      };

      Formio.createForm(document.createElement('div'), formJson)
        .then(afterInitialChanges)
        .then(form => {
          return new Promise(resolve => {
            form.on('error', resolve);
            buttonOf(form, 'submit').click();
          }).then(() => {
            expect(buttonOf(form, 'submit').disabled).toBe(false);
            expect(buttonOf(form, 'guarded').disabled).toBe(true);
            expect(buttonOf(form, 'locked').disabled).toBe(true);
            expect(classesOf(form, 'guarded')).not.toContain('submit-fail');
            expect(classesOf(form, 'locked')).not.toContain('submit-fail');
            done();
          });
        })
        .catch(done);
    });

    it('should keep the buttons locked while the record is saved and hand them back once the server rejects it', done => {
      const formJson = {
        type: 'form',
        components: [
          { label: 'Comment', type: 'textarea', input: true, key: 'comment' },
          submitButton('outcome_Approve', { theme: 'success' }),
          submitButton('outcome_Reject', { theme: 'danger' })
        ]
      };
      const serverError = new Error('Required fields are not filled: Planned payment date');

      Formio.createForm(document.createElement('div'), formJson)
        .then(afterInitialChanges)
        .then(form => {
          let lockedWhileSaving;

          // What EcosForm does with a failed `Record.save()`: it shows the error itself and rejects the submission,
          // which formio reports once more through `onSubmissionError` — two `error` events for one failure.
          form.ecos = { form: {} };
          form.on('submit', (submission, resolve, reject) => {
            lockedWhileSaving = ['outcome_Approve', 'outcome_Reject'].map(key => buttonOf(form, key).disabled);

            setTimeout(() => {
              form.showErrors(serverError, true);
              reject(serverError);
            });
          });

          return new Promise(resolve => {
            let errors = 0;
            form.on('error', () => {
              errors += 1;

              if (errors === 2) {
                resolve();
              }
            });
            buttonOf(form, 'outcome_Approve').click();
          }).then(() => {
            expect(lockedWhileSaving).toEqual([true, true]);

            ['outcome_Approve', 'outcome_Reject'].forEach(key => {
              expect(buttonOf(form, key).disabled).toBe(false);
              expect(classesOf(form, key)).not.toContain('submit-fail');
            });

            expect(classesOf(form, 'outcome_Approve')).toContain('btn-success');
            expect(classesOf(form, 'outcome_Approve')).not.toContain('btn-danger');
            expect(classesOf(form, 'outcome_Reject')).toContain('btn-danger');
            done();
          });
        })
        .catch(done);
    });
  });

  describe('outcome buttons', () => {
    const outcomesFormJson = {
      type: 'form',
      components: [
        { label: 'Comment', type: 'textarea', input: true, key: 'comment' },
        { label: 'Reject', action: 'event', event: 'reject', type: 'button', input: true, key: 'outcome_Repeal' },
        { label: 'Request info', action: 'event', event: 'requestInfo', type: 'button', input: true, key: 'outcome_RequestInfo' },
        { label: 'Save', action: 'event', event: 'save', type: 'button', input: true, key: 'save' }
      ]
    };

    it('should drop the verdict of a click that never reached a submit', done => {
      Formio.createForm(document.createElement('div'), outcomesFormJson)
        .then(form => {
          // verdict abandoned: the button opened a dialog and the user closed it, nothing was submitted
          form.getComponent('outcome_Repeal').buttonElement.click();
          expect(form.data.outcome_Repeal).toBe(true);

          form.getComponent('outcome_RequestInfo').buttonElement.click();

          expect(form.data.outcome_Repeal).toBeUndefined();
          expect(form.data.outcome_RequestInfo).toBe(true);
          done();
        })
        .catch(done);
    });

    it('should drop the abandoned verdict when the form is submitted by another button', done => {
      Formio.createForm(document.createElement('div'), outcomesFormJson)
        .then(form => {
          // verdict abandoned: validation rejected the submit, then the user saved the form as is
          form.getComponent('outcome_Repeal').buttonElement.click();
          expect(form.data.outcome_Repeal).toBe(true);

          form.getComponent('save').buttonElement.click();

          expect(form.data.outcome_Repeal).toBeUndefined();
          expect(form.data.save).toBe(true);
          done();
        })
        .catch(done);
    });

    it('should keep values of buttons which are not outcomes', done => {
      Formio.createForm(document.createElement('div'), outcomesFormJson)
        .then(form => {
          form.getComponent('save').buttonElement.click();
          form.getComponent('outcome_Repeal').buttonElement.click();

          expect(form.data.save).toBe(true);
          expect(form.data.outcome_Repeal).toBe(true);
          done();
        })
        .catch(done);
    });
  });
});
