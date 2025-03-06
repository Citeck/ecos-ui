import userEvent from '@testing-library/user-event';

import { mountWithContext } from '@/helpers/tests';
import { TYPE_PERM_READ, TYPE_PERM_WRITE } from '../constants';
import { TypePermissionsEditorContext } from '../TypePermissionsEditor/Context';
import TypePermissionsGrid from '../TypePermissionsEditor/TypePermissionsGrid';

describe('<TypePermissionsGrid />', () => {
  it('render grid; switch button READ -> WRITE', async () => {
    const user = userEvent.setup();

    const setPermission = jest.fn();
    const { container } = mountWithContext(TypePermissionsGrid, TypePermissionsEditorContext, {
      setPermission,
      roles: [{ id: 'role1', name: 'Role 1' }],
      statuses: [{ id: 'status1', name: 'Status 1' }],
      matrixConfig: {
        role1: {
          status1: TYPE_PERM_READ,
        },
      },
    });

    const gridContainer = container.getElementsByClassName('type-permissions__grid-container');
    expect(gridContainer).toHaveLength(1);

    const grid = container.getElementsByTagName('table');
    expect(grid).toHaveLength(1);

    const switchButtons = grid[0].getElementsByTagName('button');
    expect(switchButtons).toHaveLength(1);

    const switchButton = switchButtons.item(0);
    expect(switchButton.textContent).toBe('type-permissions.read');

    expect(setPermission).toHaveBeenCalledTimes(0);
    await user.click(switchButton);
    expect(setPermission).toHaveBeenCalledTimes(1);

    const args = setPermission.mock.calls[0];
    expect(args[0]).toBe('role1');
    expect(args[1]).toBe('status1');
    expect(args[2]).toBe(TYPE_PERM_WRITE);
  });
});
