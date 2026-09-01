jest.mock('@/components/ai/AIAssistant/TextAIService', () => ({
  generateText: jest.fn(() => Promise.resolve({ generatedText: 'ok', explanation: '', originalText: '' }))
}));

jest.mock('@/components/ai/AIAssistant/AdditionalContextService', () => ({
  __esModule: true,
  default: { loadCurrentRecordData: jest.fn(() => Promise.resolve(null)) }
}));

import { generateText } from '@/components/ai/AIAssistant/TextAIService';

import { lexicalAIGenerateRequest } from '../hooks/useLexicalAIGenerate';

const generateTextMock = generateText as jest.Mock;

const context = {
  recordRef: 'emodel/type@doc',
  attribute: 'richNotes',
  conversationId: 'conv-1'
};

const params = { prompt: 'сократи', currentValue: '<p>текст</p>' };

const sentField = () => generateTextMock.mock.calls[0][0].field;

// D-G-LEXICAL-FIELDNAME (regr-20260816-r1, G3/G7): the rich-text path sent
// `{"id":"richNotes","name":"richNotes"}` where the plain textarea path sends
// `{"id":"notes","name":"Заметка"}`. The backend uses `field.name` as the human-readable name of
// the field, so the raw attribute id could reach text written for the user.
describe('lexicalAIGenerateRequest field identity', () => {
  beforeEach(() => {
    generateTextMock.mockClear();
  });

  it('sends the field label as the field name', async () => {
    await lexicalAIGenerateRequest({ ...context, attributeLabel: 'Форматированный текст' }, params);

    expect(sentField()).toMatchObject({ id: 'richNotes', name: 'Форматированный текст' });
  });

  it('falls back to the attribute id when the editor was given no label', async () => {
    await lexicalAIGenerateRequest(context, params);

    expect(sentField()).toMatchObject({ id: 'richNotes', name: 'richNotes' });
  });

  it('keeps the default attribute when none is given', async () => {
    await lexicalAIGenerateRequest({ recordRef: 'emodel/type@doc', conversationId: 'conv-1', attributeLabel: 'Комментарий' }, params);

    expect(sentField()).toMatchObject({ id: 'text', name: 'Комментарий' });
  });
});
