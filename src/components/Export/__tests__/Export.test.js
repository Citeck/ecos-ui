import React from 'react';
import { shallow, mount } from 'enzyme';

import Export from '../Export';
import ConfigService from '../../../services/config/ConfigService';

describe('Export component tests', () => {
  test('should render Export component', () => {
    const spy = jest.spyOn(ConfigService, 'getValue').mockImplementation(() => Promise.resolve(true));

    const component = shallow(<Export />);

    expect(spy).toHaveBeenCalled();

    return Promise.resolve(component).then(() => {
      component.update();

      expect(component).toMatchSnapshot();
    });
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

  test('test equal dropdown with alfresco source and snapshots data', async () => {
    const spy = jest.spyOn(ConfigService, 'getValue').mockImplementation(() => Promise.resolve(true));

    const component = mount(<Export />);

    expect(spy).toHaveBeenCalled();

    const dropdownSource = new Export().dropdownSourceWithAlfresco;

    return Promise.resolve(component).then(() => {
      component.update();

      const list = component.find('ul').props();

      list.children.forEach((node, id) => {
        expect(node.props.item.id).toEqual(dropdownSource[id]['id']);
        expect(node.props.item.title).toEqual(dropdownSource[id]['title']);
      });
    });
  });

  test('test equal dropdown withoutAlfresco source and snapshots data', () => {
    const component = mount(<Export />)
      .find('ul')
      .props();

    const dropdownSource = new Export().dropdownSourceWithoutAlfresco;

    component.children.forEach((node, id) => {
      expect(node.props.item.id).toEqual(dropdownSource[id]['id']);
      expect(node.props.item.title).toEqual(dropdownSource[id]['title']);
    });
  });
});
