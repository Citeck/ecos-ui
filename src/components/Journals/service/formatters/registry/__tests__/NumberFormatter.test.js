import NumberFormatter from '../NumberFormatter';

// console.error = jest.fn();

describe('NumberFormatter', () => {
  it('type should be "number"', () => {
    expect(NumberFormatter.TYPE).toEqual('number');
  });

  it('no data', () => {
    const nf = new NumberFormatter();
    const formatted = nf.format();
    expect(formatted).toEqual('');
  });

  it('two-digit', () => {
    const nf = new NumberFormatter();
    const formatted = nf.format({ cell: 10 });
    expect(formatted).toEqual('10');
  });

  it('four-digit', () => {
    const nf = new NumberFormatter();
    const formatted = nf.format({ cell: 1000 });
    expect(formatted).toEqual('1 000');
  });

  it('seven-digit', () => {
    const nf = new NumberFormatter();
    const formatted = nf.format({ cell: 1000000 });
    expect(formatted).toEqual('1 000 000');
  });

  it('two-digit with floating', () => {
    const nf = new NumberFormatter();
    const formatted = nf.format({ cell: 10.5 });
    expect(formatted).toEqual('10,5');
  });

  it('seven-digit with floating', () => {
    const nf = new NumberFormatter();
    const formatted = nf.format({ cell: 1000000.5 });
    expect(formatted).toEqual('1 000 000,5');
  });
});
