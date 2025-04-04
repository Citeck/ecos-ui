import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import FileIcon from '../../common/FileIcon';
import FilesViewer from '../FilesViewer';
import FilesViewerItem from '../FilesViewerItem';
import { file1, folder1, demoItems, demoActions } from '../__fixtures__/FilesViewer.fixtures';

describe('FilesViewer tests', () => {
  describe('<FilesViewer />', () => {
    it('should render FilesViewer component', () => {
      const { container } = render(<FilesViewer />);
      expect(container).toMatchSnapshot();
    });

    it('should render all items', () => {
      const { container } = render(<FilesViewer items={demoItems} />);
      expect(container.getElementsByClassName('ecos-files-viewer__item')).toHaveLength(demoItems.length);
    });

    it('should render selected items', () => {
      const selectedItems = [folder1.id, file1.id];
      const { container } = render(<FilesViewer items={demoItems} selected={selectedItems} />);
      expect(container.getElementsByClassName('ecos-files-viewer__item_selected')).toHaveLength(selectedItems.length);
    });
  });

  describe('<FilesViewerItem />', () => {
    it('should render FilesViewerItem component', () => {
      const { container } = render(<FilesViewerItem item={{ id: '', title: '' }} />);
      expect(container).toMatchSnapshot();
    });

    it('should render title', () => {
      const { container } = render(<FilesViewerItem item={file1} />);
      const title = container.getElementsByClassName('ecos-files-viewer__item-title');
      expect(title).toHaveLength(1);
      expect(title[0].textContent).toBe(file1.title);
    });

    describe('should render icon', () => {
      it('should render folder icon', () => {
        const { container } = render(<FilesViewerItem item={folder1} />);
        const icon = container.getElementsByClassName('icon-folder');
        expect(icon).toHaveLength(1);
      });

      it('should render file icon', () => {
        const { container } = render(<FilesViewerItem item={file1} />);
        expect(container.getElementsByClassName('ecos-file-icon')).toHaveLength(1);
      });
    });

    describe('should render modified', () => {
      const empty = '-';
      const emptyCases = [
        { input: undefined, output: empty },
        { input: null, output: empty },
        { input: '', output: empty }
      ];

      emptyCases.forEach((caseItem, idx) => {
        it(`case ${idx + 1}: "${caseItem.input}"`, () => {
          const item = {
            ...folder1,
            modified: caseItem.input
          };
          const { container } = render(<FilesViewerItem item={item} />);
          const modified = container.getElementsByClassName('ecos-files-viewer__item-modified');
          expect(modified[0].textContent).toBe(caseItem.output);
        });
      });

      it(`not empty case: "${folder1.modified}"`, () => {
        const { container } = render(<FilesViewerItem item={folder1} />);
        const modified = container.getElementsByClassName('ecos-files-viewer__item-modified');
        expect(modified[0].textContent).not.toBe(empty);
      });
    });

    it('should render selected', () => {
      const { container } = render(<FilesViewerItem item={file1} isSelected={true} />);
      expect(container.getElementsByClassName('ecos-files-viewer__item_selected')).toHaveLength(1);
    });

    it('should render actions', () => {
      const itemWithActions = {
        ...file1,
        actions: [...demoActions]
      };
      const { container } = render(<FilesViewerItem item={itemWithActions} isSelected={true} />);
      const actions = container.getElementsByClassName('ecos-files-viewer__item-actions')[0];
      expect(actions.children).toHaveLength(demoActions.length);
    });

    it(`should call 'onClick' when click by item`, async () => {
      const user = userEvent.setup();

      const onClick = jest.fn();
      const { container } = render(<FilesViewerItem item={file1} onClick={onClick} />);
      await user.click(container.getElementsByClassName('ecos-files-viewer__item')[0]);

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick.mock.calls[0][0]).toEqual(file1);
    });

    it(`should call 'onDoubleClick' when click by item twice`, async () => {
      const user = userEvent.setup();

      const onDoubleClick = jest.fn();
      const { container } = render(<FilesViewerItem item={file1} onDoubleClick={onDoubleClick} />);
      await user.dblClick(container.getElementsByClassName('ecos-files-viewer__item')[0]);

      expect(onDoubleClick).toHaveBeenCalledTimes(1);
      expect(onDoubleClick.mock.calls[0][0]).toEqual(file1);
    });
  });
});
