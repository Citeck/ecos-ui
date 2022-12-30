import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

import Harness from '../../../test/harness';
import comp1 from './fixtures/comp1';
import values from './fixtures/values';
import FileComponent from './File';
import { basicSectionTest } from '../../../test/builder/helpers';

basicSectionTest(FileComponent);

describe('File Component', () => {
  it('Should build a file component', done => {
    Harness.testCreate(FileComponent, comp1).then(() => {
      done();
    });
  });

  it('Should create a File Component', () => {
    return Harness.testCreate(FileComponent, comp1).then(component => {
      Harness.testElements(component, 'ul.list-group-striped li.list-group-header', 1);
      Harness.testElements(component, 'ul.list-group-striped li.list-group-item', 1);
      Harness.testElements(component, 'a.browse', 1);
      expect(!!component.checkValidity(component.getValue())).toBe(true);
      component.setValue([
        {
          storage: 'base64',
          name: 'IMG_5235-ce0abe18-5d3e-4ab4-84ca-b3e06684bc86.jpg',
          url: 'data:image/jpg;base64,AAAAIGZ0eXBoZWljAAAAAG1pZjF',
          size: 1159732,
          type: 'image/jpeg',
          originalName: 'IMG_5235.jpg'
        },
        {
          storage: 'base64',
          name: 'IMG_5235-ce0abe18-5d3e-4ab4-84ca-b3e06684bc86.png',
          url: 'data:image/jpg;base64,AAAAIGZ0eXBoZWljAAAAAG1pZjF',
          size: 34533,
          type: 'image/png',
          originalName: 'IMG_5235.png'
        }
      ]);
      Harness.testElements(component, 'ul.list-group-striped li.list-group-header', 1);
      Harness.testElements(component, 'ul.list-group-striped li.list-group-item', 3);
      Harness.testElements(component, 'a.browse', 0);
      expect(!!component.checkValidity(component.getValue())).toBe(true);
    });
  });

  it('Should create a multiple File Component', () => {
    comp1.multiple = true;
    return Harness.testCreate(FileComponent, comp1).then(component => {
      Harness.testElements(component, 'ul.list-group-striped li.list-group-header', 1);
      Harness.testElements(component, 'ul.list-group-striped li.list-group-item', 1);
      Harness.testElements(component, 'a.browse', 1);
      expect(!!component.checkValidity(component.getValue())).toBe(true);
      component.setValue([
        {
          storage: 'base64',
          name: 'IMG_5235-ce0abe18-5d3e-4ab4-84ca-b3e06684bc86.jpg',
          url: 'data:image/jpg;base64,AAAAIGZ0eXBoZWljAAAAAG1pZjF',
          size: 1159732,
          type: 'image/jpeg',
          originalName: 'IMG_5235.jpg'
        },
        {
          storage: 'base64',
          name: 'IMG_5235-ce0abe18-5d3e-4ab4-84ca-b3e06684bc86.png',
          url: 'data:image/jpg;base64,AAAAIGZ0eXBoZWljAAAAAG1pZjF',
          size: 34533,
          type: 'image/png',
          originalName: 'IMG_5235.png'
        }
      ]);
      Harness.testElements(component, 'ul.list-group-striped li.list-group-header', 1);
      Harness.testElements(component, 'ul.list-group-striped li.list-group-item', 3);
      Harness.testElements(component, 'a.browse', 1);
      expect(!!component.checkValidity(component.getValue())).toBe(true);
    });
  });

  it('Should be unreadable value', done => {
    const comp = Object.assign(cloneDeep(comp1), { unreadable: true });

    Harness.testCreate(FileComponent, comp, { readOnly: false }).then(component => Harness.testUnreadableField(component, done));
  });

  it('Should be with error', done => {
    const comp = Object.assign(cloneDeep(comp1), {
      validate: {
        required: true
      }
    });

    Harness.testCreate(FileComponent, comp, { readOnly: false }).then(component => {
      // as if the changes were made by the user
      component.setValue(values);
      // start validation
      component.checkValidity(component.data, true);
      // errors not found
      expect(component.element.className.split(' ').includes('has-error')).toBe(false);
      // clear data
      component.setValue([]);
      // start validation
      component.checkValidity(component.data, true);
      // found an error
      expect(component.element.className.split(' ').includes('has-error')).toBe(true);
      done();
    });
  });

  it('Without error, if form in draft mode', done => {
    const comp = Object.assign(cloneDeep(comp1), {
      validate: {
        required: true
      }
    });

    Harness.testCreate(FileComponent, comp, { readOnly: false }).then(component => {
      // emulate form in draft mode
      set(component, 'root.options.saveDraft', true);
      // as if the changes were made by the user
      component.setValue(values);
      // start validation
      component.checkValidity(component.data, true);
      // errors not found
      expect(component.element.className.split(' ').includes('has-error')).toBe(false);
      // clear data
      component.setValue([]);
      // start validation
      component.checkValidity(component.data, true);
      // errors not found
      expect(component.element.className.split(' ').includes('has-error')).toBe(false);
      done();
    });
  });
});
