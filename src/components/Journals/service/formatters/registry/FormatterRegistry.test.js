import { getAllFormattersModules, requireContextNodeJS } from './utils';

describe('FormatterRegistry', () => {
  it('should skip not extended from BaseModule', () => {
    const modules = requireContextNodeJS('../__mocks__/skipUtils', true, /Formatter.js$/);
    const formatterModules = getAllFormattersModules(modules);
    expect(formatterModules.length).toEqual(0);
  });

  it('should add formatter from folder and not', () => {
    const modules = requireContextNodeJS('../__mocks__', true, /Formatter.js$/);
    const formatterModules = getAllFormattersModules(modules);
    expect(formatterModules.length).toEqual(2);
    expect(formatterModules).toMatchSnapshot();
  });
});
