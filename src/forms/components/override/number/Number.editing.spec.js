import _ from 'lodash';

import Harness from '../../../test/harness';
import NumberComponent from './Number';

import { comp3 } from './fixtures';

// Cause: https://citeck.atlassian.net/browse/COREDEV-573
// Emulates real keystrokes on the masked input: the browser edits the value and moves the caret, then fires
// an `input` event whose inputType the component reads through window.event. text-mask conforms the value
// and our debounced setCaretPosition corrects the caret, so every step waits for the timers to settle.

const settle = () => new Promise(resolve => setTimeout(resolve, 5));

const fireInput = (input, inputType, data) => input.dispatchEvent(new InputEvent('input', { inputType, data, bubbles: true }));

const state = input => `${input.value.slice(0, input.selectionStart)}|${input.value.slice(input.selectionStart)}`;

async function typeText(input, text) {
  for (const char of text) {
    const { value, selectionStart, selectionEnd } = input;

    input.value = value.slice(0, selectionStart) + char + value.slice(selectionEnd);
    input.setSelectionRange(selectionStart + 1, selectionStart + 1);
    fireInput(input, 'insertText', char);
    await settle();
  }
}

async function pressBackspace(input) {
  const { value, selectionStart } = input;

  input.value = value.slice(0, selectionStart - 1) + value.slice(selectionStart);
  input.setSelectionRange(selectionStart - 1, selectionStart - 1);
  fireInput(input, 'deleteContentBackward');
  await settle();
}

async function pressDelete(input) {
  const { value, selectionStart } = input;

  input.value = value.slice(0, selectionStart) + value.slice(selectionStart + 1);
  input.setSelectionRange(selectionStart, selectionStart);
  fireInput(input, 'deleteContentForward');
  await settle();
}

async function createInput(settings) {
  const component = await Harness.testCreate(NumberComponent, {
    ..._.cloneDeep(comp3),
    defaultValue: '',
    decimalValue: ',',
    decimalLimit: 2,
    ...settings
  });

  document.body.appendChild(component.element);

  const input = component.inputs[0];

  input.focus();

  return { component, input };
}

async function typeAndPlaceCaret(input, text, position) {
  await typeText(input, text);
  input.setSelectionRange(position, position);
}

async function backspaceFromEnd(input, times) {
  input.setSelectionRange(input.value.length, input.value.length);

  const steps = [state(input)];

  for (let i = 0; i < times; i++) {
    await pressBackspace(input);
    steps.push(state(input));
  }

  return steps;
}

describe('Number Component editing', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe.each([
    ['without delimiter', { requireDecimal: false, delimiter: false }],
    ['with required decimal', { requireDecimal: true, delimiter: false }]
  ])('%s', (title, settings) => {
    it('keeps typed digits in order', async () => {
      const { input } = await createInput(settings);

      await typeText(input, '123,45');

      expect(state(input)).toBe('123,45|');
    });

    it('deletes one character per Backspace from the end', async () => {
      const { input } = await createInput(settings);

      await typeText(input, '123,45');

      expect(await backspaceFromEnd(input, 7)).toEqual(['123,45|', '123,4|', '123,|', '123|', '12|', '1|', '|', '|']);
    });

    it('edits in the middle of the value', async () => {
      let { input } = await createInput(settings);

      await typeAndPlaceCaret(input, '123,45', 2);
      await pressBackspace(input);
      expect(state(input)).toBe('1|3,45');

      await typeAndPlaceCaret(input, '', 4);
      await pressBackspace(input);
      expect(state(input)).toBe('13,|5');

      ({ input } = await createInput(settings));
      await typeAndPlaceCaret(input, '123,45', 4);
      await pressBackspace(input);
      expect(state(input)).toBe('123|45');

      ({ input } = await createInput(settings));
      await typeAndPlaceCaret(input, '123,45', 1);
      await pressDelete(input);
      expect(state(input)).toBe('1|3,45');

      ({ input } = await createInput(settings));
      await typeAndPlaceCaret(input, '123,45', 2);
      await typeText(input, '9');
      expect(state(input)).toBe('129|3,45');
    });

    it('keeps the caret in place when a second decimal separator is rejected', async () => {
      const { input } = await createInput(settings);

      await typeAndPlaceCaret(input, '123,45', 3);
      await typeText(input, ',');

      expect(state(input)).toBe('123|,45');
    });
  });

  describe.each([
    ['with delimiter', { requireDecimal: false, delimiter: true }],
    ['with delimiter and required decimal', { requireDecimal: true, delimiter: true }]
  ])('%s', (title, settings) => {
    it('keeps typed digits in order', async () => {
      const { input } = await createInput(settings);

      await typeText(input, '1234,56');

      expect(state(input)).toBe('1 234,56|');
    });

    it('deletes one character per Backspace from the end', async () => {
      const { input } = await createInput(settings);

      await typeText(input, '1234,56');

      expect(await backspaceFromEnd(input, 8)).toEqual(['1 234,56|', '1 234,5|', '1 234,|', '1 234|', '123|', '12|', '1|', '|', '|']);
    });

    it('edits next to the thousands separator', async () => {
      let { input } = await createInput(settings);

      await typeAndPlaceCaret(input, '1234,56', 3);
      await pressBackspace(input);
      expect(state(input)).toBe('1|34,56');

      ({ input } = await createInput(settings));
      await typeAndPlaceCaret(input, '1234,56', 2);
      await pressBackspace(input);
      expect(state(input)).toBe('1| 234,56');

      ({ input } = await createInput(settings));
      await typeAndPlaceCaret(input, '1234,56', 1);
      await pressDelete(input);
      expect(state(input)).toBe('1 |234,56');

      ({ input } = await createInput(settings));
      await typeAndPlaceCaret(input, '1234,56', 5);
      await typeText(input, '7');
      expect(state(input)).toBe('12 347|,56');
    });
  });

  describe('with required decimal', () => {
    it.each([
      [{ delimiter: false }, '123,4', '123,40'],
      [{ delimiter: false }, '123', '123,00'],
      [{ delimiter: true }, '1234', '1 234,00'],
      [{ delimiter: true }, '1234,5', '1 234,50']
    ])('%j pads "%s" with zeros on blur', async (settings, typed, expected) => {
      const { component, input } = await createInput({ requireDecimal: true, ...settings });

      await typeText(input, typed);
      input.dispatchEvent(new Event('blur'));

      expect(input.value).toBe(expected);
      expect(component.getValue()).toBe(parseFloat(typed.replace(',', '.')));
    });

    it('does not pad the value while typing', async () => {
      const { component, input } = await createInput({ requireDecimal: true });

      await typeText(input, '5');
      expect(input.value).toBe('5');

      await typeText(input, ',');
      expect(input.value).toBe('5,');

      await typeText(input, '1');
      expect(input.value).toBe('5,1');
      expect(input.value).not.toContain('_');
      expect(component.getValue()).toBe(5.1);
    });
  });
});
