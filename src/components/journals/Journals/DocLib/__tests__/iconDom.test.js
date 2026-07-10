import { render } from '@testing-library/react';
import React from 'react';

import FileListRow from '@/components/journals/Journals/DocLib/Files/FileListRow';
import { FileItemIcon } from '@/components/journals/Journals/DocLib/Files/utils';

const noop = () => {};

describe('DocLib icons DOM smoke', () => {
  it('renders folder icon markup for DIR item', () => {
    const { container } = render(<FileItemIcon item={{ id: 'a$1', title: 'Folder', type: 'DIR' }} className="x" />);
    const i = container.querySelector('i');
    expect(i).not.toBeNull();
    expect(i.className).toContain('ecos-icon');
  });

  it('renders file-type icon markup for FILE item', () => {
    const { container } = render(<FileItemIcon item={{ id: 'a$2', title: 'doc.pdf', type: 'FILE' }} className="x" />);
    const span = container.querySelector('span.ecos-file-icon');
    expect(span).not.toBeNull();
    expect(span.className).toContain('fiv-icon-pdf');
  });

  it('renders full row with icon, checkbox glyph and title', () => {
    const item = { id: 'a$3', title: 'report.docx', type: 'FILE', modified: '2026-07-01T10:00:00Z', actions: [] };
    const { container } = render(
      <FileListRow
        item={item}
        isSelected={false}
        isLastClicked={false}
        isMobile={false}
        onClick={noop}
        onToggle={noop}
        onDoubleClick={noop}
        onDrop={noop}
        setParentItem={noop}
      />
    );
    expect(container.querySelector('.citeck-doclib-files__row')).not.toBeNull();
    expect(container.querySelector('.ecos-files-viewer__item')).not.toBeNull();
    expect(container.querySelector('i.icon-custom-checkbox-outline-unchecked')).not.toBeNull();
    expect(container.querySelector('span.ecos-file-icon')).not.toBeNull();
    expect(container.textContent).toContain('report.docx');
  });
});
