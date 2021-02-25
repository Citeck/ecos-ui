import React from 'react';
import { shallow } from 'enzyme';

import DocLibBreadcrumbs from '../DocLibBreadcrumbs';

const demoItems = [
  {
    id: 'item1',
    disp: 'Folder 1'
  },
  {
    id: 'item2',
    disp: 'Folder 2'
  }
];

describe('DocLibBreadcrumbs tests', () => {
  describe('<DocLibBreadcrumbs />', () => {
    it('should render DocLibBreadcrumbs component', () => {
      const component = shallow(<DocLibBreadcrumbs />);
      expect(component).toMatchSnapshot();
    });

    it('should render all items', () => {
      const component = shallow(<DocLibBreadcrumbs path={demoItems} />);
      expect(component.find('.ecos-doclib__breadcrumbs-link')).toHaveLength(demoItems.length);
      expect(component.find('.ecos-doclib__breadcrumbs-link-separator')).toHaveLength(demoItems.length);
    });

    it('should render item label', () => {
      const component = shallow(<DocLibBreadcrumbs path={demoItems} />);
      const elementIndex = 0;
      const link = component.find('.ecos-doclib__breadcrumbs-link').at(elementIndex);
      expect(link.text()).toBe(demoItems[elementIndex].disp);
    });

    it('should render null if empty path', () => {
      const component = shallow(<DocLibBreadcrumbs path={[]} />);
      expect(component.isEmptyRender()).toBe(true);
    });

    it(`should call 'onClick' when click by item`, () => {
      const onClick = jest.fn();
      const elementIndex = 0;
      const component = shallow(<DocLibBreadcrumbs path={demoItems} onClick={onClick} />);
      component
        .find('.ecos-doclib__breadcrumbs-link')
        .at(elementIndex)
        .simulate('click', {
          preventDefault: () => {}
        });
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith(demoItems[elementIndex].id);
    });
  });
});
