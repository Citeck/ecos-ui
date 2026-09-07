import { act, fireEvent, render } from '@testing-library/react';
import React from 'react';

import TreeNode, { type TreeNode as TreeNodeType } from '../TreeNode';

jest.mock('@citeck/records-core', () => ({
  __esModule: true,
  default: {
    get: () => ({ watch: jest.fn(), load: jest.fn(() => Promise.resolve(null)) }),
    remove: jest.fn(() => Promise.resolve()),
    getRecordToEdit: jest.fn()
  }
}));

jest.mock('@/helpers/urls', () => ({
  __esModule: true,
  getSearchParams: () => ({}),
  updateCurrentUrl: jest.fn()
}));

jest.mock('@/components/forms/EcosForm/FormManager', () => ({
  __esModule: true,
  default: { openFormModal: jest.fn() }
}));

jest.mock('@/services/notifications', () => ({
  __esModule: true,
  NotificationManager: { success: jest.fn(), error: jest.fn() }
}));

jest.mock('@/helpers/util', () => ({
  ...jest.requireActual('@/helpers/util'),
  isMobileDevice: () => false
}));

const makeNode = (id: string, name: string, children: TreeNodeType[] = []): TreeNodeType => ({
  id,
  name,
  parent: 'emodel/wiki@default$ROOT',
  children
});

const renderNode = (node: TreeNodeType) =>
  render(
    <TreeNode
      node={node}
      recordRef={null}
      rootRecord="emodel/wiki@default$ROOT"
      records={[]}
      onFetchChildren={() => Promise.resolve({ records: [] })}
      updateRootChilds={jest.fn()}
      setRecords={jest.fn()}
      canEdit
    />
  );

const label = (id: string) => document.getElementById(`tree-node-label-${id}`) as HTMLElement;
const tooltip = () => document.querySelector('[role="tooltip"]');

/** Native events: the tooltip wrapper listens with addEventListener, not through React's system. */
const hover = (element: HTMLElement) => element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

/**
 * jsdom has no layout, and the wrapper decides whether a hint is needed at render time — before any
 * element exists to stub — so every label gets the same box: `labelWidth` px wide, 10px per character.
 */
let labelWidth = 300;

const layoutDescriptors = {
  clientWidth: { get: () => labelWidth, configurable: true },
  clientHeight: { get: () => 18, configurable: true },
  getBoundingClientRect: {
    value: () => ({ width: labelWidth, height: 18, top: 0, left: 0, right: labelWidth, bottom: 18, x: 0, y: 0, toJSON: () => ({}) }),
    configurable: true
  }
};

const hoverAndWait = async (element: HTMLElement) => {
  hover(element);
  await act(async () => {
    jest.advanceTimersByTime(500);
  });
};

describe('TreeNode label tooltip', () => {
  const getContext = HTMLCanvasElement.prototype.getContext;

  beforeAll(() => {
    Object.defineProperties(HTMLLabelElement.prototype, layoutDescriptors);
  });

  afterAll(() => {
    Object.keys(layoutDescriptors).forEach(key => {
      // @ts-ignore — restoring jsdom's own (inherited) implementation
      delete HTMLLabelElement.prototype[key];
    });
  });

  beforeEach(() => {
    jest.useFakeTimers();
    labelWidth = 300;
    // @ts-ignore — a measuring stub is all `showAsNeeded` needs
    HTMLCanvasElement.prototype.getContext = () => ({ font: '', measureText: (text: string) => ({ width: text.length * 10 }) });
  });

  afterEach(() => {
    jest.useRealTimers();
    HTMLCanvasElement.prototype.getContext = getContext;
  });

  it('shows the name of a clipped label on hover', async () => {
    labelWidth = 100;
    renderNode(makeNode('child-id', 'A long page title that does not fit'));

    await hoverAndWait(label('child-id'));

    expect(tooltip()).not.toBeNull();
    expect(tooltip()!.textContent).toBe('A long page title that does not fit');
  });

  it('shows no tooltip when the label fits', async () => {
    renderNode(makeNode('root-id', 'Short'));

    await hoverAndWait(label('root-id'));

    expect(tooltip()).toBeNull();
  });

  it('shows only the own name of a nested node, not its path', async () => {
    labelWidth = 60;
    renderNode(makeNode('parent-id', 'Parent', [makeNode('child-id', 'A long nested page title')]));

    await hoverAndWait(label('child-id'));

    expect(tooltip()!.textContent).toBe('A long nested page title');
  });

  // A native drag delivers no mouseout, so the hint would stay on screen for the whole drag
  it('closes the tooltip when a drag starts', async () => {
    labelWidth = 100;
    renderNode(makeNode('child-id', 'A long page title that does not fit'));

    await hoverAndWait(label('child-id'));
    expect(tooltip()).not.toBeNull();

    await act(async () => {
      fireEvent.dragStart(document.querySelector('summary')!, {
        dataTransfer: { setData: jest.fn(), effectAllowed: '' }
      });
      jest.advanceTimersByTime(500);
    });

    expect(tooltip()).toBeNull();
  });

  it('sanitizes the node id so it stays a valid element id', () => {
    renderNode(makeNode('default$ROOT@1', 'Root'));

    expect(document.getElementById('tree-node-label-default_ROOT_1')).not.toBeNull();
  });
});
