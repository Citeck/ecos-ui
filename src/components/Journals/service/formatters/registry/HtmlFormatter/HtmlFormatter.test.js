import { shallow } from 'enzyme';

import HtmlFormatter from './HtmlFormatter';

console.error = jest.fn();

const htmlFormatterInstance = new HtmlFormatter();

describe('HtmlFormatter', () => {
  it('getType should return correct type', () => {
    expect(htmlFormatterInstance.getType()).toBe(HtmlFormatter.TYPE);
  });
  describe('format method', () => {
    it('should render an html content', () => {
      const result = htmlFormatterInstance.format({
        config: {
          html: '<strong>Test</strong>'
        }
      });
      const component = shallow(result);
      expect(component.html()).toBe('<div><strong>Test</strong></div>');
    });
    it('should throw Error if config.html is not specified', () => {
      const format = () => {
        htmlFormatterInstance.format({
          config: {}
        });
      };
      expect(format).toThrow('mandatory');
    });
  });
});
