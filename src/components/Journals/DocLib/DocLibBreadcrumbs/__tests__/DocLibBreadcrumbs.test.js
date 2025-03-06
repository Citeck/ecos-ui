import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DocLibBreadcrumbs from '../DocLibBreadcrumbs';

const demoItems = [
  {
    id: 'item1',
    disp: 'Folder 1',
  },
  {
    id: 'item2',
    disp: 'Folder 2',
  },
];

describe('DocLibBreadcrumbs tests', () => {
  describe('<DocLibBreadcrumbs />', () => {
    it('should render DocLibBreadcrumbs component', () => {
      const { container } = render(<DocLibBreadcrumbs />);
      expect(container).toMatchSnapshot();
    });

    it('should render all items', () => {
      const { container } = render(<DocLibBreadcrumbs path={demoItems} />);
      expect(container.getElementsByClassName('ecos-doclib__breadcrumbs-link')).toHaveLength(demoItems.length);
      expect(container.getElementsByClassName('ecos-doclib__breadcrumbs-link-separator')).toHaveLength(demoItems.length);
    });

    it('should render item label', () => {
      const { container, asFragment } = render(<DocLibBreadcrumbs path={demoItems} />);
      const link = container.getElementsByClassName('ecos-doclib__breadcrumbs-link');
      expect(link[0].textContent).toBe(demoItems[0].disp);
      expect(asFragment()).toMatchSnapshot();
    });

    it('should render null if empty path', () => {
      const { container, asFragment } = render(<DocLibBreadcrumbs path={[]} />);
      expect(container.outerHTML).toBe('<div></div>');
      expect(asFragment()).toMatchSnapshot();
    });

    it(`should call 'onClick' when click by item`, async () => {
      const user = userEvent.setup();

      const onClick = jest.fn();
      const elementIndex = 0;
      const { container } = render(<DocLibBreadcrumbs path={demoItems} onClick={onClick} />);

      await user.click(container.getElementsByClassName('ecos-doclib__breadcrumbs-link')[0]);

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith(demoItems[elementIndex].id);
    });
  });
});
