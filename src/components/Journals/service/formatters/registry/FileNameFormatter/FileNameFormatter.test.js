import { render } from '@testing-library/react';

import FileIcon from '../../../../../common/FileIcon';

import FileNameFormatter from './FileNameFormatter';

const fileNameFormatterInstance = new FileNameFormatter();

describe('FileNameFormatter', () => {
  it('getType should return correct type', () => {
    expect(fileNameFormatterInstance.getType()).toBe(FileNameFormatter.TYPE);
  });
  describe('format method', () => {
    it('should render file icon', () => {
      const { container } = render(fileNameFormatterInstance.format());
      expect(container.getElementsByClassName('fiv-icon-blank')).toHaveLength(1);
      expect(container).toMatchSnapshot();
    });
  });
});
