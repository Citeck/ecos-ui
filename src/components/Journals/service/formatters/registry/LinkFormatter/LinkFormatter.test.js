import { render, screen } from '@testing-library/react';
import React from 'react';

import '@testing-library/jest-dom';

import LinkFormatter from './LinkFormatter';

jest.mock('@/services/PageService', () => ({
  changeUrlLink: jest.fn()
}));

describe('LinkFormatter', () => {
  const formatter = new LinkFormatter();

  const props = {
    row: { id: '123' },
    cell: 'click here'
  };

  it('renders a link correctly', () => {
    render(<div>{formatter.format(props)}</div>);
    const linkElement = screen.getByRole('link');
    expect(linkElement).toBeInTheDocument();
  });

  it('should log a warning if config.target is not a valid JSON string', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const mockProps = {
      ...props,
      config: {
        target: 'invalid_json_string'
      }
    };

    const result = formatter.format(mockProps);

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('LinkFormatter: Unsupported config "invalid_json_string"'));

    consoleWarnSpy.mockRestore();
  });
});
