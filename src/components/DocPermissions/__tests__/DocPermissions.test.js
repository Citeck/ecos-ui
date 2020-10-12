import React from 'react';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import { switchDocPerm } from '../helpers/switchDocPerm';
import { DOC_PERM_NONE, DOC_PERM_READ, DOC_PERM_WRITE } from '../constants';
import { DocPermissionsEditorContext } from '../DocPermissionsEditor/DocPermissionsEditorContext';
import DocPermissionsEditor from '../DocPermissionsEditor/DocPermissionsEditor';
import DocPermissionsGrid from '../DocPermissionsEditor/DocPermissionsGrid';
import ButtonsPanel from '../DocPermissionsEditor/ButtonsPanel';

configure({ adapter: new Adapter() });

const mountComponentWithContext = (Component, contextValue) => {
  return mount(<Component />, {
    wrappingComponent: DocPermissionsEditorContext.Provider,
    wrappingComponentProps: {
      value: contextValue
    }
  });
};

describe('DocPermissions tests', () => {
  describe('switchDocPerm helper', () => {
    it('switch DOC_PERM_NONE -> DOC_PERM_READ', () => {
      expect(switchDocPerm(DOC_PERM_NONE)).toEqual(DOC_PERM_READ);
    });
    it('switch DOC_PERM_READ -> DOC_PERM_WRITE', () => {
      expect(switchDocPerm(DOC_PERM_READ)).toEqual(DOC_PERM_WRITE);
    });
    it('switch DOC_PERM_WRITE -> DOC_PERM_NONE', () => {
      expect(switchDocPerm(DOC_PERM_WRITE)).toEqual(DOC_PERM_NONE);
    });
    it('switch UNKNOWN -> DOC_PERM_READ', () => {
      expect(switchDocPerm(undefined)).toEqual(DOC_PERM_READ);
      expect(switchDocPerm(null)).toEqual(DOC_PERM_READ);
      expect(switchDocPerm('')).toEqual(DOC_PERM_READ);
      expect(switchDocPerm('UNKNOWN')).toEqual(DOC_PERM_READ);
    });
  });

  describe('<DocPermissionsEditor />', () => {
    it('fetching data (show loader)', () => {
      const wrapper = mountComponentWithContext(DocPermissionsEditor, {
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
      const wrapper = mountComponentWithContext(DocPermissionsEditor, {
        error: errorText
      });
      return Promise.resolve(wrapper)
        .then(() => {
          const error = wrapper.find('.doc-permissions-editor__error');
          expect(error.length).toBe(1);
          expect(error.text()).toBe(errorText);
        })
        .then(() => wrapper.unmount());
    });

    it('data fetched successfully', () => {
      const wrapper = mountComponentWithContext(DocPermissionsEditor, {
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

          const error = wrapper.find('.doc-permissions-editor__error');
          expect(error.length).toBe(0);
        })
        .then(() => wrapper.unmount());
    });
  });

  describe('<ButtonsPanel />', () => {
    it('render buttons', () => {
      const savePermissions = jest.fn();
      const closeEditor = jest.fn();
      const wrapper = mountComponentWithContext(ButtonsPanel, {
        savePermissions,
        closeEditor
      });
      return Promise.resolve(wrapper)
        .then(() => {
          const buttons = wrapper.find('button');
          expect(buttons.length).toBe(2);

          const cancelButton = buttons.at(0);
          expect(closeEditor.mock.calls.length).toBe(0);
          cancelButton.simulate('click');
          expect(closeEditor.mock.calls.length).toBe(1);

          const saveButton = buttons.at(1);
          expect(savePermissions.mock.calls.length).toBe(0);
          saveButton.simulate('click');
          expect(savePermissions.mock.calls.length).toBe(1);
        })
        .then(() => wrapper.unmount());
    });
  });

  describe('<DocPermissionsGrid />', () => {
    it('render grid; switch button READ -> WRITE', () => {
      const setPermission = jest.fn();
      const wrapper = mountComponentWithContext(DocPermissionsGrid, {
        setPermission,
        roles: [{ roleid: 'role1', name: 'Role 1' }],
        statuses: [{ id: 'status1', name: 'Status 1' }],
        matrixConfig: {
          id: 'config-id-123',
          permissions: [{ role: 'role1', statuses: { status1: DOC_PERM_READ } }]
        }
      });

      return Promise.resolve(wrapper)
        .then(() => {
          const gridContainer = wrapper.find('.doc-permissions__grid-container');
          expect(gridContainer.length).toBe(1);

          const grid = wrapper.find('table');
          expect(grid.length).toBe(1);

          const switchButtons = grid.find('button');
          expect(switchButtons.length).toBe(1);

          const switchButton = switchButtons.at(0);
          expect(switchButton.text()).toBe('doc-permissions.read');

          expect(setPermission.mock.calls.length).toBe(0);
          switchButton.simulate('click');
          expect(setPermission.mock.calls.length).toBe(1);

          const args = setPermission.mock.calls[0];
          expect(args[0]).toBe('role1');
          expect(args[1]).toBe('status1');
          expect(args[2]).toBe(DOC_PERM_WRITE);
        })
        .then(() => wrapper.unmount());
    });
  });
});
