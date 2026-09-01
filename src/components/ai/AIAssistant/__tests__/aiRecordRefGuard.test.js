import fs from 'fs';
import path from 'path';

/**
 * Structural guard for D-G-ALIASREF (case G9).
 *
 * A record reference read from a form must never reach the AI services as `options.recordId`: a
 * card opened for editing carries a browser-side alias, the backend resolves it to nothing, and the
 * model then invents the content of a field it cannot see. The rule was written down in AGENTS.md
 * and still missed twice, so it is asserted here rather than trusted — the class had repeated three
 * times by the time it was found.
 *
 * These tests read source, not behaviour. Rendering a formio component in jsdom drags in the whole
 * editor stack, and the point is precisely to catch a *new* call site that no behavioural test
 * would cover yet.
 */
const readSource = relativePath => fs.readFileSync(path.resolve(__dirname, '../../../..', relativePath), 'utf8');

describe('AI record reference is normalized before it leaves a form', () => {
  describe('TextArea.jsx', () => {
    const source = readSource('forms/components/override/textarea/TextArea.jsx');

    it('hands both AI buttons the normalized reference', () => {
      const aiButtons = ['<ScriptEditorAIButton', '<TextAreaAIButton'];

      aiButtons.forEach(tag => {
        const start = source.indexOf(tag);
        expect(start).toBeGreaterThan(-1);
        const props = source.slice(start, source.indexOf('/>', start));
        expect(props).toContain('recordRef={this.aiRecordRef}');
      });
    });

    it('resolves that reference through the shared rule', () => {
      expect(source).toContain('resolveAiRecordRef');
    });

    // The two Lexical usages pass `options.recordId` on purpose — `LexicalEditor` needs the record
    // of the page for uploads as well, and the assistant buttons inside it normalize on their own
    // (`AIAssistantButton`, `AIAssistantFloatingButton`). Anything else taking the raw id straight
    // into an AI component is the defect this guard exists for.
    it('gives the raw options.recordId to no AI component', () => {
      const rawUses = [...source.matchAll(/recordRef=\{this\.root[?.]*\.options[?.]*\.recordId[^}]*\}/g)];
      const componentOfUse = index => source.lastIndexOf('<', index);

      rawUses.forEach(match => {
        const tag = source.slice(componentOfUse(match.index), match.index);
        expect(tag).toMatch(/<LexicalEditor/);
      });
    });
  });

  describe('EcosForm.jsx', () => {
    const source = readSource('components/forms/EcosForm/EcosForm.jsx');

    // Taken from the record, not by cutting the string: the shape of the alias is a private detail
    // of records-core, and every place that open-coded it became a place that could miss it.
    it('publishes the base id next to recordId', () => {
      expect(source).toContain('options.baseRecordId');
      expect(source).toMatch(/options\.baseRecordId\s*=.*getBaseRecord\(\)\.id/);
    });
  });
});
