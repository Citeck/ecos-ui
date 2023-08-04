import { mountWithContext } from '../../../helpers/tests';

import { TypePermissionsEditorContext } from '../TypePermissionsEditor/Context';
import ButtonsPanel from '../TypePermissionsEditor/ButtonsPanel';

describe('<ButtonsPanel />', () => {
  it('render buttons', () => {
    const savePermissions = jest.fn();
    const closeEditor = jest.fn();
    const wrapper = mountWithContext(ButtonsPanel, TypePermissionsEditorContext, {
      savePermissions,
      closeEditor
    });
    return Promise.resolve(wrapper)
      .then(() => {
        const buttons = wrapper.find('button');
        expect(buttons.length).toBe(3);

        const cancelButton = buttons.at(0);
        expect(closeEditor.mock.calls.length).toBe(0);
        cancelButton.simulate('click');
        expect(closeEditor.mock.calls.length).toBe(1);

        const saveButton = buttons.at(2);
        expect(savePermissions.mock.calls.length).toBe(0);
        saveButton.simulate('click');
        expect(savePermissions.mock.calls.length).toBe(1);
      })
      .then(() => wrapper.unmount());
  });
});
