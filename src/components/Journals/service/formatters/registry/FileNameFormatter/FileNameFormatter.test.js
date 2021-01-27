import { shallow } from 'enzyme';

import FileIcon from '../../../../../common/FileIcon';

import FileNameFormatter from './FileNameFormatter';

const fileNameFormatterInstance = new FileNameFormatter();

describe('FileNameFormatter', () => {
  it('getType should return correct type', () => {
    expect(fileNameFormatterInstance.getType()).toBe(FileNameFormatter.TYPE);
  });
  describe('format method', () => {
    it('should render file icon', () => {
      const result = fileNameFormatterInstance.format();
      const component = shallow(result);
      expect(component.find(FileIcon)).toHaveLength(1);
    });
  });
});
