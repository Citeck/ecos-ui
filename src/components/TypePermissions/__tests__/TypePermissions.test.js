import { mountWithContext } from '../../../helpers/tests';

import { switchTypePerm } from '../helpers/switchTypePerm';
import { TYPE_PERM_NONE, TYPE_PERM_READ, TYPE_PERM_WRITE } from '../constants';
import { TypePermissionsEditorContext } from '../TypePermissionsEditor/Context';
import TypePermissionsEditor from '../TypePermissionsEditor/TypePermissionsEditor';
import TypePermissionsGrid from '../TypePermissionsEditor/TypePermissionsGrid';
import ButtonsPanel from '../TypePermissionsEditor/ButtonsPanel';

describe('TypePermissions tests', () => {
  describe('switchDocPerm helper', () => {
    it('switch DOC_PERM_NONE -> DOC_PERM_READ', () => {
      expect(switchTypePerm(TYPE_PERM_NONE)).toEqual(TYPE_PERM_READ);
    });
    it('switch DOC_PERM_READ -> DOC_PERM_WRITE', () => {
      expect(switchTypePerm(TYPE_PERM_READ)).toEqual(TYPE_PERM_WRITE);
    });
    it('switch DOC_PERM_WRITE -> DOC_PERM_NONE', () => {
      expect(switchTypePerm(TYPE_PERM_WRITE)).toEqual(TYPE_PERM_NONE);
    });
    it('switch UNKNOWN -> DOC_PERM_READ', () => {
      expect(switchTypePerm(undefined)).toEqual(TYPE_PERM_READ);
      expect(switchTypePerm(null)).toEqual(TYPE_PERM_READ);
      expect(switchTypePerm('')).toEqual(TYPE_PERM_READ);
      expect(switchTypePerm('UNKNOWN')).toEqual(TYPE_PERM_READ);
    });
  });

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
});
