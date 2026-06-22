import { isLikelyMarkdown } from '../index';

describe('isLikelyMarkdown', () => {
  it('should detect markdown with heading and list', () => {
    expect(isLikelyMarkdown('# Title\n\n- item 1\n- item 2')).toBe(true);
  });

  it('should detect markdown with bold and link', () => {
    expect(isLikelyMarkdown('**bold text** and [link](http://example.com)')).toBe(true);
  });

  it('should detect markdown with code block and heading', () => {
    expect(isLikelyMarkdown('# Title\n\n```js\nconst x = 1;\n```')).toBe(true);
  });

  it('should detect markdown with blockquote and italic', () => {
    expect(isLikelyMarkdown('> quote\n\n*italic text*')).toBe(true);
  });

  it('should detect markdown with table and heading', () => {
    expect(isLikelyMarkdown('# Data\n\n| col1 | col2 |\n| --- | --- |\n| a | b |')).toBe(true);
  });

  it('should detect markdown with horizontal rule and bold', () => {
    expect(isLikelyMarkdown('some **bold** text\n\n---\n\nmore text')).toBe(true);
  });

  it('should detect ordered list with bold', () => {
    expect(isLikelyMarkdown('1. First **item**\n2. Second item')).toBe(true);
  });

  it('should return false for plain text', () => {
    expect(isLikelyMarkdown('Hello, this is a plain text message')).toBe(false);
  });

  it('should require at least 2 markdown patterns', () => {
    expect(isLikelyMarkdown('# Just a heading')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isLikelyMarkdown('')).toBe(false);
  });

  it('should return false for text with # but not markdown heading', () => {
    expect(isLikelyMarkdown('Price is #100 per item')).toBe(false);
  });
});
