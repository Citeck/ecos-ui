import { extractAnswerText } from '../assistantResponse';

// The single reading of a finished answer, shared by the three services that poll the same
// endpoint. Two of them used to hold near-identical copies of it and the third had none at all,
// which is what made a prose answer to a script question disappear (D-G-QA-DROP, case G14).
describe('extractAnswerText', () => {
  it('reads a payload that is itself the text', () => {
    expect(extractAnswerText('Готово')).toBe('Готово');
  });

  it('reads a message that is a plain string', () => {
    expect(extractAnswerText({ message: 'Готово' })).toBe('Готово');
  });

  it.each([
    ['text', { message: { text: 'Готово' } }],
    ['generatedText', { message: { generatedText: 'Готово' } }],
    ['modifiedText', { message: { modifiedText: 'Готово' } }],
    ['content', { message: { content: 'Готово' } }]
  ])('reads an envelope carrying %s', (_field, payload) => {
    expect(extractAnswerText(payload)).toBe('Готово');
  });

  it.each([
    ['text', { text: 'Готово' }],
    ['content', { content: 'Готово' }]
  ])('reads a bare %s field', (_field, payload) => {
    expect(extractAnswerText(payload)).toBe('Готово');
  });

  // The envelope names the answer; the loose fields may name the subject of an edit instead.
  it('prefers the envelope over the loose fields', () => {
    expect(extractAnswerText({ message: { text: 'из конверта' }, text: 'снаружи' })).toBe('из конверта');
  });

  it('prefers text over the other envelope fields', () => {
    expect(extractAnswerText({ message: { text: 'первый', generatedText: 'второй', content: 'третий' } })).toBe('первый');
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['an empty string', ''],
    ['an empty object', {}],
    ['an envelope with no text', { message: { type: 'text_editing' } }],
    ['an empty message string', { message: '' }]
  ])('gives null for %s', (_case, payload) => {
    expect(extractAnswerText(payload)).toBeNull();
  });
});
