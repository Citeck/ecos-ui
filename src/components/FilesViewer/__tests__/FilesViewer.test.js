import React from 'react';
import { shallow } from 'enzyme';

import FileIcon from '../../common/FileIcon';

import { file1, folder1, demoItems, demoActions } from '../__fixtures__/FilesViewer.fixtures';
import FilesViewer from '../FilesViewer';
import FilesViewerItem from '../FilesViewerItem';

describe('FilesViewer tests', () => {
  describe('<FilesViewer />', () => {
    it('should render FilesViewer component', () => {
      const component = shallow(<FilesViewer />);
      expect(component).toMatchSnapshot();
    });

    it('should render all items', () => {
      const component = shallow(<FilesViewer items={demoItems} />);
      expect(component.find(FilesViewerItem)).toHaveLength(demoItems.length);
    });

    it('should render selected items', () => {
      const selectedItems = [folder1.id, file1.id];
      const component = shallow(<FilesViewer items={demoItems} selected={selectedItems} />);
      expect(component.find({ isSelected: true })).toHaveLength(selectedItems.length);
    });
  });

  describe('<FilesViewerItem />', () => {
    it('should render FilesViewerItem component', () => {
      const component = shallow(<FilesViewerItem item={{ id: '', title: '' }} />);
      expect(component).toMatchSnapshot();
    });

    it('should render title', () => {
      const component = shallow(<FilesViewerItem item={file1} />);
      const title = component.find('.ecos-files-viewer__item-title');
      expect(title).toHaveLength(1);
      expect(title.text()).toBe(file1.title);
    });

    describe('should render icon', () => {
      it('should render folder icon', () => {
        const component = shallow(<FilesViewerItem item={folder1} />);
        const icon = component.find({ data: { value: 'icon-folder' } });
        expect(icon).toHaveLength(1);
      });

      it('should render file icon', () => {
        const component = shallow(<FilesViewerItem item={file1} />);
        const icon = component.find(FileIcon);
        expect(icon).toHaveLength(1);
      });
    });

    describe('should render modified', () => {
      const empty = '-';
      const emptyCases = [{ input: undefined, output: empty }, { input: null, output: empty }, { input: '', output: empty }];

      emptyCases.forEach((caseItem, idx) => {
        it(`case ${idx + 1}: "${caseItem.input}"`, () => {
          const item = {
            ...folder1,
            modified: caseItem.input
          };
          const component = shallow(<FilesViewerItem item={item} />);
          const modified = component.find('.ecos-files-viewer__item-modified');
          expect(modified.text()).toBe(caseItem.output);
        });
      });

      it(`not empty case: "${folder1.modified}"`, () => {
        const component = shallow(<FilesViewerItem item={folder1} />);
        const modified = component.find('.ecos-files-viewer__item-modified');
        expect(modified.text()).not.toBe(empty);
      });
    });

    it('should render selected', () => {
      const component = shallow(<FilesViewerItem item={file1} isSelected={true} />);
      expect(component.find('.ecos-files-viewer__item_selected')).toHaveLength(1);
    });

    it('should render actions', () => {
      const itemWithActions = {
        ...file1,
        actions: [...demoActions]
      };
      const component = shallow(<FilesViewerItem item={itemWithActions} isSelected={true} />);
      expect(component.find('.ecos-files-viewer__item-actions').children()).toHaveLength(demoActions.length);
    });

    it(`should call 'onClick' when click by item`, () => {
      const onClick = jest.fn();
      const component = shallow(<FilesViewerItem item={file1} onClick={onClick} />);
      component.find('.ecos-files-viewer__item').simulate('click');
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick.mock.calls[0][0]).toEqual(file1);
    });

    it(`should call 'onDoubleClick' when click by item twice`, () => {
      const onDoubleClick = jest.fn();
      const component = shallow(<FilesViewerItem item={file1} onDoubleClick={onDoubleClick} />);
      component.find('.ecos-files-viewer__item').simulate('doubleclick');
      expect(onDoubleClick).toHaveBeenCalledTimes(1);
      expect(onDoubleClick.mock.calls[0][0]).toEqual(file1);
    });
  });
});
