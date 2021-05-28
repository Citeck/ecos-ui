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
});
