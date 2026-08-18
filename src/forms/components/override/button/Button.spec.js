import Harness from '../../../test/harness';
import ButtonComponent from './Button';
import Formio from '../../../Formio';
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
