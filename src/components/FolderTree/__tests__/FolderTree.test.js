import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import FolderTree from '../FolderTree';
import FolderTreeItem from '../FolderTreeItem';
import { item1, item1111, item1112, demoItems } from '../__fixtures__/FolderTree.fixtures';

describe('FolderTree tests', () => {
  describe('<FolderTree />', () => {
    it('should render FolderTree component', () => {
      const { container, asFragment } = render(<FolderTree />);
      expect(container).toMatchSnapshot();
      expect(asFragment()).toMatchSnapshot();
    });

    it('should render all visible items', () => {
      const { container } = render(<FolderTree items={demoItems} />);

      const visibleItems = demoItems.filter(item => {
        if (item.parent) {
          const parent = demoItems.find(i => i.id === item.parent);
          if (parent && !parent.isUnfolded) {
            return false;
          }
        }
        return true;
      });

      expect(container.getElementsByClassName('ecos-folder-tree__item')).toHaveLength(visibleItems.length);
    });
  });

  describe('<FolderTreeItem />', () => {
    it('should render FolderTreeItem component', () => {
      const { container, asFragment } = render(<FolderTreeItem item={{ id: '', title: '' }} />);
      expect(container).toMatchSnapshot();
      expect(asFragment()).toMatchSnapshot();
    });

    it('should render title', () => {
      const { container } = render(<FolderTreeItem item={item1} />);
      const title = container.getElementsByClassName('ecos-folder-tree__item-title');
      expect(title).toHaveLength(1);
      expect(title[0].textContent).toBe(item1.title);
    });

    it('should render children', () => {
      const childText = 'Child text';
      const child = <div className="child-class">{childText}</div>;
      const { container } = render(<FolderTreeItem item={item1}>{child}</FolderTreeItem>);
      const children = container.getElementsByClassName('ecos-folder-tree__item-children');
      expect(children[0].getElementsByClassName('child-class')).toHaveLength(1);
      expect(children[0].textContent).toBe(childText);
    });

    it('should render selected', () => {
      const { container } = render(<FolderTreeItem item={item1} isSelected={true} />);
      expect(container.getElementsByClassName('ecos-folder-tree__folder-image_selected')).toHaveLength(1);
      expect(container.getElementsByClassName('ecos-folder-tree__item-title_selected')).toHaveLength(1);
    });

    it('should render switch icon if has children', () => {
      const { container } = render(<FolderTreeItem item={item1} />);
      const switchIcon = container.getElementsByClassName('ecos-folder-tree__fold-switch-icon');
      expect(switchIcon).toHaveLength(1);
    });

    it(`shouldn't render switch icon if has not children`, () => {
      const { container } = render(<FolderTreeItem item={item1111} />);
      const switchIcon = container.getElementsByClassName('ecos-folder-tree__fold-switch-icon');
      expect(switchIcon).toHaveLength(0);
    });

    it(`should render 'icon-small-down' switch icon if unfolded`, () => {
      const { container } = render(<FolderTreeItem item={item1} />);
      const switchIcon = container.getElementsByClassName('icon-small-down');
      expect(switchIcon).toHaveLength(1);
    });

    it(`should render 'icon-small-right' switch icon if folded`, () => {
      const { container } = render(<FolderTreeItem item={item1112} />);
      const switchIcon = container.getElementsByClassName('icon-small-right');
      expect(switchIcon).toHaveLength(1);
    });

    it(`should call 'onSelect' when click by item`, async () => {
      const user = userEvent.setup();

      const onSelect = jest.fn();
      const { container } = render(<FolderTreeItem item={item1} onSelect={onSelect} />);

      await user.click(container.getElementsByClassName('ecos-folder-tree__item-body')[0]);

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(item1.id);
    });

    it(`should call 'onUnfold' when click by folded switch icon`, async () => {
      const user = userEvent.setup();

      const onUnfold = jest.fn();
      const { container } = render(<FolderTreeItem item={item1112} onUnfold={onUnfold} />);

      await user.click(container.getElementsByClassName('ecos-folder-tree__fold-switch-icon')[0]);

      expect(onUnfold).toHaveBeenCalledTimes(1);
      expect(onUnfold).toHaveBeenCalledWith(item1112.id);
    });

    it(`should call 'onFold' when click by unfolded switch icon`, async () => {
      const user = userEvent.setup();

      const onFold = jest.fn();
      const { container } = render(<FolderTreeItem item={item1} onFold={onFold} />);

      await user.click(container.getElementsByClassName('ecos-folder-tree__fold-switch-icon')[0]);

      expect(onFold).toHaveBeenCalledTimes(1);
      expect(onFold).toHaveBeenCalledWith(item1.id);
    });
  });
});
