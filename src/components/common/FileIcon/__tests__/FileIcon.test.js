import { render } from '@testing-library/react';
import React from 'react';

import FileIcon from '../FileIcon';
import { blankFormat } from '../constants';
import { detectFormat } from '../helpers';

console.error = jest.fn();

const mainFormats = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'jpg', 'jpeg', 'bmp', 'png', 'gif', 'tif', 'odf', 'msg'];

describe('FileIcon tests', () => {
  describe('<FileIcon />', () => {
    it('should render FileIcon component', () => {
      const component = render(<FileIcon />);
      expect(component.asFragment(<FileIcon />)).toMatchSnapshot();
    });

    it('should apply className', () => {
      const { container } = render(<FileIcon className="testClass" />);
      expect(container.getElementsByClassName('testClass')).toHaveLength(1);
    });

    describe('should display default icon when file format is invalid', () => {
      const inputs = [undefined, null, true, 1, 'unknown'];

      inputs.forEach(format => {
        it(`case ${format + ''}`, () => {
          const { container } = render(<FileIcon format={format} />);
          expect(container.getElementsByClassName('fiv-icon-blank')).toHaveLength(1);
        });
      });
    });

    describe('should display an icon corresponding to the file format', () => {
      mainFormats.forEach(format => {
        it(`case ${format + ''}`, () => {
          const { container } = render(<FileIcon format={format} />);
          expect(container.getElementsByClassName(`fiv-icon-${format}`)).toHaveLength(1);
        });
      });
    });
  });

  describe('detectFormat helper', () => {
    describe('should return format if filename contains correct extension', () => {
      const testCases = mainFormats.map(format => ({ input: `file.${format}`, output: format }));

      testCases.forEach(testCase => {
        it(`case ${testCase.input}`, () => {
          expect(detectFormat(testCase.input)).toBe(testCase.output);
        });
      });
    });

    describe('should return default format if filename is not a string', () => {
      const inputs = [undefined, null, true, 1, [], {}];
      inputs.forEach(fileName => {
        it(`case ${JSON.stringify(fileName)}`, () => {
          expect(detectFormat(fileName)).toBe(blankFormat);
        });
      });
    });

    it('should return default format if no file extension', () => {
      expect(detectFormat('some file name')).toBe(blankFormat);
    });

    it('should return default format when unknown file extension', () => {
      expect(detectFormat('some file name.unknown')).toBe(blankFormat);
    });

    it('should return format in lower case', () => {
      expect(detectFormat('File.JPG')).toBe('jpg');
    });
  });
});
