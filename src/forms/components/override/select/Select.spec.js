import cloneDeep from 'lodash/cloneDeep';

import Harness from '../../../test/harness';
import SelectComponent from './Select';
import { basicSectionTest } from '../../../test/builder/helpers';

import { comp1, comp2 } from './fixtures';

basicSectionTest(SelectComponent);

describe('Select Component', () => {
  it('Should build a Select component', done => {
    Harness.testCreate(SelectComponent, comp1).then(component => {
      Harness.testElements(component, 'select', 1);
      done();
    });
  });

  it('Should preserve the tabindex', done => {
    Harness.testCreate(SelectComponent, comp2).then(component => {
      const element = component.element.getElementsByClassName('choices__list choices__list--single')[0];
      Harness.testElementAttribute(element, 'tabindex', '10');
      done();
    });
  });

  it('Should default to 0 when tabindex is not specified', done => {
    Harness.testCreate(SelectComponent, comp1).then(component => {
      const element = component.element.getElementsByClassName('choices__list choices__list--single')[0];
      Harness.testElementAttribute(element, 'tabindex', '0');
      done();
    });
  });

  it('Should allow to override threshold option of fuzzy search', () => {
    try {
      const c1 = Object.assign(cloneDeep(comp1), { searchThreshold: 0.2 });
      const c2 = Object.assign(cloneDeep(comp1), { searchThreshold: 0.4 });
      const c3 = Object.assign(cloneDeep(comp1), { searchThreshold: 0.8 });
      const comps = [
        Harness.testCreate(SelectComponent, c1),
        Harness.testCreate(SelectComponent, c2),
        Harness.testCreate(SelectComponent, c3)
      ];

      return Promise.all(comps).then(([a, b, c]) => {
        expect(a.choices.config.fuseOptions.threshold).toBe(0.2);
        expect(b.choices.config.fuseOptions.threshold).toBe(0.4);
        expect(c.choices.config.fuseOptions.threshold).toBe(0.8);
      });
    } catch (error) {
      return Promise.reject(error);
    }
  });

  describe('#setValue', () => {
    it('should set component value', done => {
      Harness.testCreate(SelectComponent, comp1).then(component => {
        expect(component.dataValue).toBe('');
        component.setValue('red');
        expect(component.dataValue).toBe('red');
        done();
      });
    });

    it('should reset input value when called with empty value', done => {
      const comp = Object.assign({}, comp1);
      delete comp.placeholder;

      Harness.testCreate(SelectComponent, comp).then(component => {
        expect(component.dataValue).toBe('');
        expect(component.inputs[0].value).toBe('');
        component.setValue('red');
        expect(component.dataValue).toBe('red');
        // expect(component.inputs[0].value).toBe('red'); // TODO check
        component.setValue('');
        expect(component.dataValue).toBe('');
        expect(component.inputs[0].value).toBe('');
        done();
      });
    });
  });
});

/**
 * The stock `select` renders its option labels through the same choices.js templates (as markup)
 * and its view-mode value with `innerHTML`, so a label is data escaped once in `itemTemplate`, like
 * in EcosSelect. COREDEV-546
 */
describe('Select option labels (COREDEV-546)', () => {
  const PAYLOAD = '<img src=x onerror="window.__coredev546 = 1">Evil';

  const selectComp = extra =>
    Object.assign(cloneDeep(comp1), {
      template: '',
      placeholder: '',
      data: {
        values: [
          { label: PAYLOAD, value: 'evil' },
          { label: 'Alpha', value: 'alpha' }
        ]
      },
      ...extra
    });

  // the list is filled on a debounced update; run it now
  const create = comp =>
    Harness.testCreate(SelectComponent, comp).then(component => {
      component.updateItems();
      return component;
    });

  const expectNoInjectedMarkup = root => {
    expect(root.querySelector('img, script')).toBeNull();
    root.querySelectorAll('*').forEach(element => {
      Array.from(element.attributes).forEach(attribute => expect(attribute.name).not.toMatch(/^on/i));
    });
  };

  it('renders a markup label of a choice and of the selected item as text', async () => {
    const component = await create(selectComp());
    const root = component.choices.containerOuter.element;

    component.setValue('evil');

    const choice = root.querySelector('.choices__list--dropdown [data-choice][data-value="evil"]');
    const item = root.querySelector('.choices__list--single [data-item]');

    expectNoInjectedMarkup(root);
    expect(choice.textContent.trim()).toBe(PAYLOAD);
    expect(item.firstChild.textContent.trim()).toBe(PAYLOAD);
  });

  it('still renders a plain label', async () => {
    const component = await create(selectComp());
    const choice = component.choices.containerOuter.element.querySelector('[data-choice][data-value="alpha"]');

    expect(choice.textContent.trim()).toBe('Alpha');
  });

  it('keeps the markup of the component template, sanitized, with the label as text', async () => {
    const component = await create(selectComp({ template: '<b class="tpl">{{ item.label }}</b>' }));
    const root = component.choices.containerOuter.element;
    const choice = root.querySelector('.choices__list--dropdown [data-choice][data-value="evil"]');

    expectNoInjectedMarkup(root);
    expect(choice.querySelector('b.tpl').textContent).toBe(PAYLOAD);
  });

  it('renders the view-mode value as text', async () => {
    const component = await Harness.testCreate(SelectComponent, selectComp(), { readOnly: true, viewAsHtml: true });
    const element = document.createElement('dd');

    component.dataValue = 'evil';
    component.setupValueElement(element);

    expect(element.querySelector('img')).toBeNull();
    expect(element.textContent).toBe(PAYLOAD);
  });

  it('renders a bare string value in view mode as text', async () => {
    const component = await Harness.testCreate(SelectComponent, selectComp({ dataSrc: 'url', data: { url: '' } }), {
      readOnly: true,
      viewAsHtml: true
    });
    const element = document.createElement('dd');

    component.dataValue = PAYLOAD;
    component.setupValueElement(element);

    expect(element.querySelector('img')).toBeNull();
    expect(element.textContent).toBe(PAYLOAD);
  });
});
