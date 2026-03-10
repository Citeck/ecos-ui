import { render, screen } from '@testing-library/react';
import React from 'react';

import ConfigService from '../../../services/config/ConfigService';
import Export from '../Export';

describe('Export component tests', () => {
  test('should render Export component', () => {
    const { container } = render(<Export />);
    expect(container).toMatchSnapshot();
  });

  test('should render Export component with empty className props', () => {
    const { container } = render(<Export />);
    expect(container.getElementsByClassName('ecos-btn-export')).toHaveLength(1);
  });

  test('should render Export component with className props', () => {
    const { container } = render(<Export className={'ecos-journal__settings-bar-export'} />);
    expect(container.getElementsByClassName('ecos-journal__settings-bar-export')).toHaveLength(1);
  });

  test('test equal dropdown source and snapshots data', async () => {
    const { container } = render(<Export />);

    const dropdownSource = new Export().dropdownSourceVariants();
    const list = container.getElementsByTagName('ul').item(0);

    expect(list.children.length).toBe(5);
  });
});
