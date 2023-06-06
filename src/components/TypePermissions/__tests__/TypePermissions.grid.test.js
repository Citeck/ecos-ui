import { mountWithContext } from '../../../helpers/tests';

import { TYPE_PERM_READ, TYPE_PERM_WRITE } from '../constants';
import { TypePermissionsEditorContext } from '../TypePermissionsEditor/Context';
import TypePermissionsGrid from '../TypePermissionsEditor/TypePermissionsGrid';

describe('<TypePermissionsGrid />', () => {
  it('render grid; switch button READ -> WRITE', () => {
    const setPermission = jest.fn();
    const wrapper = mountWithContext(TypePermissionsGrid, TypePermissionsEditorContext, {
      setPermission,
      roles: [{ id: 'role1', name: 'Role 1' }],
      statuses: [{ id: 'status1', name: 'Status 1' }],
      matrixConfig: {
        role1: {
          status1: TYPE_PERM_READ
        }
      }
    });

    return Promise.resolve(wrapper)
      .then(() => {
        const gridContainer = wrapper.find('.type-permissions__grid-container');
        expect(gridContainer.length).toBe(1);

        const grid = wrapper.find('table');
        expect(grid.length).toBe(1);

        const switchButtons = grid.find('button');
        expect(switchButtons.length).toBe(1);

        const switchButton = switchButtons.at(0);
        expect(switchButton.text()).toBe('type-permissions.read');

        expect(setPermission.mock.calls.length).toBe(0);
        switchButton.simulate('click');
        expect(setPermission.mock.calls.length).toBe(1);

        const args = setPermission.mock.calls[0];
        expect(args[0]).toBe('role1');
        expect(args[1]).toBe('status1');
        expect(args[2]).toBe(TYPE_PERM_WRITE);
      })
      .then(() => wrapper.unmount());
  });
});
