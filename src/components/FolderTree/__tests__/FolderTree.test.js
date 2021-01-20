import React from 'react';
import { shallow } from 'enzyme';

import { item1, item1111, item1112, demoItems } from '../__fixtures__/FolderTree.fixtures';
import FolderTree from '../FolderTree';
import FolderTreeItem from '../FolderTreeItem';

describe('FolderTree tests', () => {
  describe('<FolderTree />', () => {
    it('should render FolderTree component', () => {
      const component = shallow(<FolderTree />);
      expect(component).toMatchSnapshot();
    });

    it('should render all visible items', () => {
      const component = shallow(<FolderTree items={demoItems} />);
      const visibleItems = demoItems.filter(item => {
        if (item.parent) {
          const parent = demoItems.find(i => i.id === item.parent);
          if (parent && !parent.isUnfolded) {
            return false;
          }
        }
        return true;
      });
      expect(component.find(FolderTreeItem)).toHaveLength(visibleItems.length);
    });
  });

  describe('<FolderTreeItem />', () => {
    it('should render FolderTreeItem component', () => {
      const component = shallow(<FolderTreeItem item={{ id: '', title: '' }} />);
      expect(component).toMatchSnapshot();
    });

    it('should render title', () => {
      const component = shallow(<FolderTreeItem item={item1} />);
      const title = component.find('.ecos-folder-tree__item-title');
      expect(title).toHaveLength(1);
      expect(title.text()).toBe(item1.title);
    });

    it('should render children', () => {
      const childText = 'Child text';
      const child = <div className="child-class">{childText}</div>;
      const component = shallow(<FolderTreeItem item={item1}>{child}</FolderTreeItem>);
      const children = component.find('.ecos-folder-tree__item-children');
      expect(children.find('.child-class')).toHaveLength(1);
      expect(children.text()).toBe(childText);
    });

    it('should render selected', () => {
      const component = shallow(<FolderTreeItem item={item1} isSelected={true} />);
      expect(component.find('.ecos-folder-tree__folder-image_selected')).toHaveLength(1);
      expect(component.find('.ecos-folder-tree__item-title_selected')).toHaveLength(1);
    });

    it('should render switch icon if has children', () => {
      const component = shallow(<FolderTreeItem item={item1} />);
      const switchIcon = component.find('.ecos-folder-tree__fold-switch-icon');
      expect(switchIcon).toHaveLength(1);
    });

    it(`shouldn't render switch icon if has not children`, () => {
      const component = shallow(<FolderTreeItem item={item1111} />);
      const switchIcon = component.find('.ecos-folder-tree__fold-switch-icon');
      expect(switchIcon).toHaveLength(0);
    });

    it(`should render 'icon-small-down' switch icon if unfolded`, () => {
      const component = shallow(<FolderTreeItem item={item1} />);
      const switchIcon = component.find({ data: { value: 'icon-small-down' } });
      expect(switchIcon).toHaveLength(1);
    });

    it(`should render 'icon-small-right' switch icon if folded`, () => {
      const component = shallow(<FolderTreeItem item={item1112} />);
      const switchIcon = component.find({ data: { value: 'icon-small-right' } });
      expect(switchIcon).toHaveLength(1);
    });

    it(`should call 'onSelect' when click by item`, () => {
      const onSelect = jest.fn();
      const component = shallow(<FolderTreeItem item={item1} onSelect={onSelect} />);
      component.find('.ecos-folder-tree__item-body').simulate('click');
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(item1.id);
    });

    it(`should call 'onUnfold' when click by folded switch icon`, () => {
      const onUnfold = jest.fn();
      const component = shallow(<FolderTreeItem item={item1112} onUnfold={onUnfold} />);
      component.find('.ecos-folder-tree__fold-switch-icon').simulate('click');
      expect(onUnfold).toHaveBeenCalledTimes(1);
      expect(onUnfold).toHaveBeenCalledWith(item1112.id);
    });

    it(`should call 'onFold' when click by unfolded switch icon`, () => {
      const onFold = jest.fn();
      const component = shallow(<FolderTreeItem item={item1} onFold={onFold} />);
      component.find('.ecos-folder-tree__fold-switch-icon').simulate('click');
      expect(onFold).toHaveBeenCalledTimes(1);
      expect(onFold).toHaveBeenCalledWith(item1.id);
    });
  });
});
