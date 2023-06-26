import { mountWithContext } from '../../../helpers/tests';

import { TypePermissionsEditorContext } from '../TypePermissionsEditor/Context';
import TypePermissionsEditor from '../TypePermissionsEditor/TypePermissionsEditor';

describe('<TypePermissionsEditor />', () => {
  it('fetching data (show loader)', () => {
    const wrapper = mountWithContext(TypePermissionsEditor, TypePermissionsEditorContext, {
      isReady: false
    });
    return Promise.resolve(wrapper)
      .then(() => {
        const loader = wrapper.find('.ecos-loader');
        expect(loader.length).toBe(1);
      })
      .then(() => wrapper.unmount());
  });

  it('failure to fetch data (show error)', () => {
    const errorText = 'Some error';
    const wrapper = mountWithContext(TypePermissionsEditor, TypePermissionsEditorContext, {
      error: errorText
    });
    return Promise.resolve(wrapper)
      .then(() => {
        const error = wrapper.find('.type-permissions-editor__error');
        expect(error.length).toBe(1);
        expect(error.text()).toBe(errorText);
      })
      .then(() => wrapper.unmount());
  });

  it('data fetched successfully', () => {
    const wrapper = mountWithContext(TypePermissionsEditor, TypePermissionsEditorContext, {
      error: null,
      isReady: true,
      matrixConfig: { id: 'fakeId', permissions: [] },
      roles: [],
      statuses: []
    });
    return Promise.resolve(wrapper)
      .then(() => {
        const loader = wrapper.find('.ecos-loader');
        expect(loader.length).toBe(0);

        const error = wrapper.find('.type-permissions-editor__error');
        expect(error.length).toBe(0);
      })
      .then(() => wrapper.unmount());
  });
});
