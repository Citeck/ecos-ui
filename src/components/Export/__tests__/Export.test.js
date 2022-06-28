import React from 'react';
import { shallow, mount } from 'enzyme';

import Export from '../Export';

describe('Export component tests', () => {
  test('should render Export component', () => {
    const component = shallow(<Export />);
    expect(component).toMatchSnapshot();
  });

  test('should render Export component with empty className props', () => {
    const component = shallow(<Export />);
    const className = component.find('.ecos-btn-export');
    expect(className).toHaveLength(1);
  });

  test('should render Export component with className props', () => {
    const component = shallow(<Export className={'ecos-journal__settings-bar-export'} />);
    expect(component.hasClass('ecos-journal__settings-bar-export')).toEqual(true);
  });

  test('test equal dropdown source and snapshots data', () => {
    const component = mount(<Export />)
      .find('ul')
      .props();
    const dropdownSource = new Export().dropdownSource;

    component.children.forEach((node, id) => {
      expect(node.props.item.id).toEqual(dropdownSource[id]['id']);
      expect(node.props.item.title).toEqual(dropdownSource[id]['title']);
    });
  });
});
