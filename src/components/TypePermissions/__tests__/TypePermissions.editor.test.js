import { TypePermissionsEditorContext } from '../TypePermissionsEditor/Context';
import TypePermissionsEditor from '../TypePermissionsEditor/TypePermissionsEditor';

import { mountWithContext } from '@/helpers/tests';

describe('<TypePermissionsEditor />', () => {
  it('fetching data (show loader)', () => {
    const { container } = mountWithContext(TypePermissionsEditor, TypePermissionsEditorContext, {
      isReady: false
    });

    const loader = container.getElementsByClassName('ecos-loader');
    expect(loader).toHaveLength(1);
  });

  it('failure to fetch data (show error)', () => {
    const errorText = 'Some error';

    const { container } = mountWithContext(TypePermissionsEditor, TypePermissionsEditorContext, {
      error: errorText
    });

    const error = container.getElementsByClassName('type-permissions-editor__error');
    expect(error).toHaveLength(1);
    expect(error.item(0).textContent).toBe(errorText);
  });

  it('data fetched successfully', () => {
    const { container } = mountWithContext(TypePermissionsEditor, TypePermissionsEditorContext, {
      error: null,
      isReady: true,
      matrixConfig: { id: 'fakeId', permissions: [] },
      roles: [],
      statuses: []
    });

    const loader = container.getElementsByClassName('ecos-loader');
    expect(loader).toHaveLength(0);

    const error = container.getElementsByClassName('type-permissions-editor__error');
    expect(error).toHaveLength(0);
  });
});
