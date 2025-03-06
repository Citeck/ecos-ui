import userEvent from '@testing-library/user-event';

import { mountWithContext } from '@/helpers/tests';
import { TypePermissionsEditorContext } from '../TypePermissionsEditor/Context';
import ButtonsPanel from '../TypePermissionsEditor/ButtonsPanel';

describe('<ButtonsPanel />', () => {
  it('render buttons', async () => {
    const user = userEvent.setup();

    const savePermissions = jest.fn();
    const closeEditor = jest.fn();
    const { container } = mountWithContext(ButtonsPanel, TypePermissionsEditorContext, {
      savePermissions,
      closeEditor,
    });

    const buttons = container.getElementsByTagName('button');
    expect(buttons).toHaveLength(3);

    const cancelButton = buttons.item(0);
    expect(closeEditor).toHaveBeenCalledTimes(0);
    await user.click(cancelButton);
    expect(closeEditor).toHaveBeenCalledTimes(1);

    const saveButton = buttons.item(2);
    expect(savePermissions).toHaveBeenCalledTimes(0);
    await user.click(saveButton);
    expect(savePermissions).toHaveBeenCalledTimes(1);
  });
});
