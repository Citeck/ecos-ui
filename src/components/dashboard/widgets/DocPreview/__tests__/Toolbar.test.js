import { render } from '@testing-library/react';
import React from 'react';

import Toolbar from '../Toolbar';

jest.mock('@/components/common/btns/index', () => ({
  IcoBtn: ({ icon, ...rest }) => <button data-icon={icon} {...rest} />
}));

jest.mock('@/components/common/form/index', () => ({
  Dropdown: ({ children }) => <div data-testid="dropdown">{children}</div>,
  Input: () => null
}));

jest.mock('@/helpers/util', () => ({
  t: key => key,
  getScaleModes: () => []
}));

describe('Toolbar download button', () => {
  const renderExtraBtns = downloadData => {
    const toolbar = new Toolbar({ ...Toolbar.defaultProps, downloadData, kind: 'image', totalPages: 1, onChangeSettings: () => null });

    return toolbar.renderExtraBtns();
  };

  it('is not rendered when there is nothing to download', () => {
    expect(renderExtraBtns({})).toBeNull();
    expect(renderExtraBtns(undefined)).toBeNull();
    expect(renderExtraBtns({ fileName: 'report.pdf' })).toBeNull();
  });

  it('links to the download url with the file name when there is something to download', () => {
    const { container } = render(renderExtraBtns({ link: '/content?ref=doc@1&download=true', fileName: 'report.pdf' }));
    const link = container.querySelector('a');

    expect(link.getAttribute('href')).toEqual('/content?ref=doc@1&download=true');
    expect(link.getAttribute('download')).toEqual('report.pdf');
  });
});

/**
 * Which controls make sense is a property of what is on screen: only a paginated document has
 * pages, only something laid out has a scale, and everything can be made full screen.
 */
describe('Toolbar controls by kind', () => {
  const renderToolbar = kind => render(<Toolbar {...Toolbar.defaultProps} kind={kind} totalPages={3} onChangeSettings={() => null} />);

  const pager = container => container.querySelector('.ecos-doc-preview__toolbar-pager');
  const zoomControls = container => container.querySelectorAll('[data-icon="icon-small-plus"]');
  const fullscreen = container => container.querySelector('.ecos-doc-preview__toolbar-zoom-fullscreen');

  it('pages only a pdf', () => {
    expect(pager(renderToolbar('pdf').container)).not.toBeNull();

    ['image', 'text', 'markdown', 'video', 'audio', 'none'].forEach(kind => {
      expect(pager(renderToolbar(kind).container)).toBeNull();
    });
  });

  it('zooms what is laid out and not what is played', () => {
    ['image', 'pdf', 'text', 'markdown'].forEach(kind => {
      expect(zoomControls(renderToolbar(kind).container)).toHaveLength(1);
    });

    ['video', 'audio', 'none'].forEach(kind => {
      expect(zoomControls(renderToolbar(kind).container)).toHaveLength(0);
    });
  });

  it('keeps full screen for every kind, including the ones with no scale', () => {
    ['image', 'pdf', 'text', 'markdown', 'video', 'audio', 'none'].forEach(kind => {
      expect(fullscreen(renderToolbar(kind).container)).not.toBeNull();
    });
  });
});
