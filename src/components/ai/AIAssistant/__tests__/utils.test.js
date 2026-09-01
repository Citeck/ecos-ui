import { ADDITIONAL_CONTEXT_TYPES } from '../constants';
import {
  applyAgentSwitch,
  generateUUID,
  getStageStatus,
  formatMessageTime,
  truncateText,
  fileSaveActionTempRef,
  isContextRemoval,
  isFileSaveActionSet,
  isGateStale,
  isSameRecordRef,
  resolveAiRecordRef,
  stripRecordRefAlias
} from '../utils';

describe('utils', () => {
  describe('generateUUID', () => {
    it('returns a string matching UUID v4 format', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('generates unique values on each call', () => {
      const uuids = new Set(Array.from({ length: 100 }, () => generateUUID()));
      expect(uuids.size).toBe(100);
    });
  });

  describe('getStageStatus', () => {
    const range = { min: 20, max: 60 };

    it('returns "pending" when no progressRange provided', () => {
      expect(getStageStatus('stage1', 50, null)).toBe('pending');
      expect(getStageStatus('stage1', 50, undefined)).toBe('pending');
    });

    it('returns "pending" when progress is below min', () => {
      expect(getStageStatus('stage1', 10, range)).toBe('pending');
      expect(getStageStatus('stage1', 0, range)).toBe('pending');
    });

    it('returns "completed" when progress is above max', () => {
      expect(getStageStatus('stage1', 61, range)).toBe('completed');
      expect(getStageStatus('stage1', 100, range)).toBe('completed');
    });

    it('returns "active" when progress is within range', () => {
      expect(getStageStatus('stage1', 20, range)).toBe('active');
      expect(getStageStatus('stage1', 40, range)).toBe('active');
      expect(getStageStatus('stage1', 60, range)).toBe('active');
    });
  });

  describe('formatMessageTime', () => {
    it('formats time as HH:MM in 24-hour format', () => {
      const date = new Date(2024, 0, 1, 14, 30, 0);
      const result = formatMessageTime(date);
      expect(result).toMatch(/14:30/);
    });

    it('pads single-digit hours and minutes', () => {
      const date = new Date(2024, 0, 1, 9, 5, 0);
      const result = formatMessageTime(date);
      expect(result).toMatch(/09:05/);
    });
  });

  describe('truncateText', () => {
    it('returns text unchanged when shorter than maxLength', () => {
      expect(truncateText('short', 50)).toBe('short');
    });

    it('returns text unchanged when equal to maxLength', () => {
      const text = 'a'.repeat(50);
      expect(truncateText(text, 50)).toBe(text);
    });

    it('truncates and adds ellipsis when text exceeds maxLength', () => {
      const text = 'a'.repeat(60);
      const result = truncateText(text, 50);
      expect(result).toBe('a'.repeat(50) + '...');
      expect(result.length).toBe(53);
    });

    it('uses default maxLength of 50', () => {
      const text = 'a'.repeat(60);
      const result = truncateText(text);
      expect(result).toBe('a'.repeat(50) + '...');
    });

    it('returns falsy values as-is', () => {
      expect(truncateText(null)).toBe(null);
      expect(truncateText(undefined)).toBe(undefined);
      expect(truncateText('')).toBe('');
    });
  });

  describe('fileSaveActionTempRef', () => {
    it.each([
      ['main_content|temp-file@abc', 'temp-file@abc'],
      ['new_record|temp-file@abc', 'temp-file@abc'],
      ['file_cancel|temp-file@abc', 'temp-file@abc'],
      ['attr:content|temp-file@abc', 'temp-file@abc']
    ])('extracts tempRef from %s', (actionId, expected) => {
      expect(fileSaveActionTempRef(actionId)).toBe(expected);
    });

    it.each([['CONFIRM'], ['deploy_confirm'], ['main_content'], ['main_content|'], ['unknown|temp-file@abc'], [null], [undefined], [42]])(
      'returns null for %s',
      actionId => {
        expect(fileSaveActionTempRef(actionId)).toBeNull();
      }
    );
  });

  describe('isFileSaveActionSet', () => {
    it('is true when every action is a file-save action', () => {
      expect(isFileSaveActionSet([{ id: 'main_content|temp-file@a' }, { id: 'file_cancel|temp-file@a' }])).toBe(true);
    });

    it('is false for a mixed set', () => {
      expect(isFileSaveActionSet([{ id: 'main_content|temp-file@a' }, { id: 'CONFIRM' }])).toBe(false);
    });

    it('is false for an empty or non-array value', () => {
      expect(isFileSaveActionSet([])).toBe(false);
      expect(isFileSaveActionSet(null)).toBe(false);
      expect(isFileSaveActionSet(undefined)).toBe(false);
    });
  });

  describe('isGateStale', () => {
    const gate = actions => ({ messageData: { actions } });
    const CONFIRM_GATE = [{ id: 'CONFIRM' }, { id: 'REJECT' }];
    const FILE_SAVE_GATE = [{ id: 'main_content|temp-file@a' }, { id: 'file_cancel|temp-file@a' }];
    const errorNotice = () => ({ text: 'request failed', isError: true });
    const fileActionNotice = () => ({ text: 'Файл «a.png» сохранён.', isFileActionNotice: true });
    const cancelledNotice = () => ({ text: 'Запрос отменён', isCancelled: true });
    const failedSend = () => ({ sender: 'user', text: 'no, do it differently', isFailedSend: true });

    it.each([
      ['last message without actions is not stale', [{ messageData: {} }], 0, false],
      [
        'gate without actions is stale once the dialog moved past it (its hint must go too)',
        [{ messageData: { agentStatus: 'FAILED' } }, { messageData: {} }],
        0,
        true
      ],
      ['message with an empty action list is stale when superseded', [gate([]), gate(CONFIRM_GATE)], 0, true],
      ['last message with a regular gate is not stale', [gate(CONFIRM_GATE)], 0, false],
      ['message before the last one with a regular gate is stale', [gate(CONFIRM_GATE), { messageData: {} }], 0, true],
      [
        'message flagged actionsResolved is stale even when last',
        [{ messageData: { actions: CONFIRM_GATE, actionsResolved: true } }],
        0,
        true
      ],
      ['file-save set in the middle of the list is not stale', [gate(FILE_SAVE_GATE), { messageData: {} }], 0, false],
      [
        'resolved file-save set is stale',
        [{ messageData: { actions: FILE_SAVE_GATE, actionsResolved: true } }, { messageData: {} }],
        0,
        true
      ],
      [
        'mixed set in the middle of the list is stale (the file-save half stays live per button)',
        [gate([{ id: 'main_content|temp-file@a' }, { id: 'CONFIRM' }]), { messageData: {} }],
        0,
        true
      ],
      // A failed action POST appends nothing but a client-side error notice; the gate must stay
      // live so the very same button can be pressed again.
      ['a trailing error notice does not supersede a gate', [gate(CONFIRM_GATE), errorNotice()], 0, false],
      ['several trailing error notices do not supersede a gate', [gate(CONFIRM_GATE), errorNotice(), errorNotice()], 0, false],
      ['a real message after an error notice does supersede the gate', [gate(CONFIRM_GATE), errorNotice(), { messageData: {} }], 0, true],
      // A free-text send that never reached the backend leaves its user message in the history;
      // `handleSubmit` stamps it `isFailedSend`, so the turn that did not happen does not retire
      // the gate the user was answering — the same rule as for the error notice next to it.
      ['a failed free-text send does not supersede the gate', [gate(CONFIRM_GATE), failedSend(), errorNotice()], 0, false],
      ['a delivered user reply does supersede the gate', [gate(CONFIRM_GATE), { sender: 'user', text: 'no, do it differently' }], 0, true],
      [
        'a retry delivered after a failed send supersedes the gate',
        [gate(CONFIRM_GATE), failedSend(), errorNotice(), { sender: 'user', text: 'no, do it differently' }],
        0,
        true
      ],
      // Answering the file half of a mixed set (`[CONFIRM, REJECT, new_record|ref, file_cancel|ref]`)
      // appends a system notice about that file only — the backend never routed the request to the
      // agent, so the `CONFIRM` it is still waiting for must keep its button.
      ['a trailing file-action notice does not supersede a gate', [gate(CONFIRM_GATE), fileActionNotice()], 0, false],
      [
        'a real message after a file-action notice does supersede the gate',
        [gate(CONFIRM_GATE), fileActionNotice(), { messageData: {} }],
        0,
        true
      ],
      [
        'mixed notices (file answer then failed retry) do not supersede a gate',
        [gate(CONFIRM_GATE), fileActionNotice(), errorNotice()],
        0,
        false
      ],
      // Aborting a request converts the processing message into a cancelled notice. The turn was
      // called off, not completed, so the gate behind it is exactly as unanswered as it was — the
      // same reasoning as for the error notice.
      ['a trailing cancelled notice does not supersede a gate', [gate(CONFIRM_GATE), cancelledNotice()], 0, false],
      [
        'a real message after a cancelled notice does supersede the gate',
        [gate(CONFIRM_GATE), cancelledNotice(), { messageData: {} }],
        0,
        true
      ],
      [
        'a user reply before the cancelled notice supersedes the gate (aborted free-text send)',
        [gate(CONFIRM_GATE), { sender: 'user', text: 'no, do it differently' }, cancelledNotice()],
        0,
        true
      ],
      [
        'a gate answered from its own card stays stale after the request is aborted',
        [{ messageData: { actions: CONFIRM_GATE, actionsResolved: true } }, cancelledNotice()],
        0,
        true
      ],
      ['empty message list does not throw', [], 0, false],
      ['index beyond the end does not throw', [gate(CONFIRM_GATE)], 5, false],
      ['negative index does not throw', [gate(CONFIRM_GATE)], -1, false],
      ['missing message list does not throw', null, 0, false]
    ])('%s', (_title, messages, index, expected) => {
      expect(isGateStale(messages, index)).toBe(expected);
    });

    it('keeps every pending file-save gate live while regular gates go stale', () => {
      const messages = [gate(FILE_SAVE_GATE), gate([{ id: 'main_content|temp-file@b' }]), gate(CONFIRM_GATE), { messageData: {} }];
      expect(messages.map((_, index) => isGateStale(messages, index))).toEqual([false, false, true, false]);
    });
  });

  describe('isSameRecordRef', () => {
    it('matches identical references', () => {
      expect(isSameRecordRef('emodel/contract@1a2b', 'emodel/contract@1a2b')).toBe(true);
      expect(isSameRecordRef('contract@1a2b', 'contract@1a2b')).toBe(true);
    });

    it('matches references differing only by the application prefix', () => {
      expect(isSameRecordRef('emodel/contract@1a2b', 'contract@1a2b')).toBe(true);
      expect(isSameRecordRef('contract@1a2b', 'emodel/contract@1a2b')).toBe(true);
    });

    it('tells apart different records of the same type', () => {
      expect(isSameRecordRef('emodel/contract@1a2b', 'emodel/contract@3c4d')).toBe(false);
      expect(isSameRecordRef('emodel/contract@1a2b', 'emodel/invoice@1a2b')).toBe(false);
      expect(isSameRecordRef('contract@1a2b', 'contract@1a2B')).toBe(false);
    });

    // Only the application prefix may be cut off. Trimming at the LAST `/` instead left a bare
    // `1a2b` for both references below, so two records in different stores compared equal and one
    // of them silently disappeared from the `@` autocomplete list.
    it('keeps the slashes that belong to the local id itself', () => {
      expect(isSameRecordRef('alfresco/@workspace://SpacesStore/1a2b', 'alfresco/@archive://SpacesStore/1a2b')).toBe(false);
      expect(isSameRecordRef('alfresco/@workspace://SpacesStore/1a2b', '@workspace://SpacesStore/1a2b')).toBe(true);
      expect(isSameRecordRef('alfresco/@workspace://SpacesStore/1a2b', 'alfresco/@workspace://SpacesStore/1a2b')).toBe(true);
    });

    it('does not strip a prefix from a reference that has none', () => {
      // No `@` at all: nothing here identifies an application, so the string is compared whole.
      expect(isSameRecordRef('some/path/value', 'other/path/value')).toBe(false);
    });

    it('returns false for empty and undefined values without throwing', () => {
      expect(isSameRecordRef('', '')).toBe(false);
      expect(isSameRecordRef('', 'contract@1a2b')).toBe(false);
      expect(isSameRecordRef('contract@1a2b', '')).toBe(false);
      expect(isSameRecordRef(undefined, undefined)).toBe(false);
      expect(isSameRecordRef(null, 'contract@1a2b')).toBe(false);
      expect(isSameRecordRef('contract@1a2b', undefined)).toBe(false);
      expect(isSameRecordRef(42, 42)).toBe(false);
      expect(isSameRecordRef({ recordRef: 'contract@1a2b' }, 'contract@1a2b')).toBe(false);
    });

    // Both prefixes stripped, these reduced to the same `sourceId@localId` and compared equal — and
    // every caller turns that into a silent drop: the record disappears from the `@` list, is
    // refused entry to the context, or is filtered out of the auto-context chips.
    it('tells apart records of different applications', () => {
      expect(isSameRecordRef('emodel/contract@1a2b', 'alfresco/contract@1a2b')).toBe(false);
      expect(isSameRecordRef('alfresco/@workspace://SpacesStore/1a2b', 'emodel/@workspace://SpacesStore/1a2b')).toBe(false);
    });

    it('does not treat two prefix-only references as the same record', () => {
      // Both local parts are empty — unknown must never compare equal to unknown.
      expect(isSameRecordRef('emodel/', 'alfresco/')).toBe(false);
      expect(isSameRecordRef('emodel/', 'emodel/contract@1a2b')).toBe(false);
    });
  });

  describe('stripRecordRefAlias', () => {
    it('cuts the alias suffix the page address adds', () => {
      expect(stripRecordRefAlias('emodel/contract@rec-1-alias-abc')).toBe('emodel/contract@rec-1');
    });

    it('leaves a reference with no alias untouched', () => {
      expect(stripRecordRefAlias('emodel/contract@rec-1')).toBe('emodel/contract@rec-1');
    });

    // A hyphen is a perfectly ordinary character in a local id; only the whole separator counts.
    it('does not cut on a bare hyphen or on a partial separator', () => {
      expect(stripRecordRefAlias('emodel/contract@rec-1-alias')).toBe('emodel/contract@rec-1-alias');
      expect(stripRecordRefAlias('emodel/contract@rec-alias')).toBe('emodel/contract@rec-alias');
    });

    // Documents the behaviour rather than endorsing it: the cut is made at the FIRST separator, so a
    // local id that contains one of its own loses everything after it. Same as every copy of the
    // rule this helper replaced — an id in that shape has never been supported.
    it('cuts at the first separator when the id itself contains one', () => {
      expect(stripRecordRefAlias('emodel/contract@my-alias-holder-alias-x')).toBe('emodel/contract@my');
    });

    it('reports a reference that is nothing but an alias suffix as absent', () => {
      expect(stripRecordRefAlias('-alias-abc')).toBeNull();
    });

    it('reports anything that is not a non-empty string as absent', () => {
      expect(stripRecordRefAlias('')).toBeNull();
      expect(stripRecordRefAlias(null)).toBeNull();
      expect(stripRecordRefAlias(undefined)).toBeNull();
      expect(stripRecordRefAlias(42)).toBeNull();
      expect(stripRecordRefAlias({ recordRef: 'emodel/contract@1' })).toBeNull();
    });
  });

  describe('resolveAiRecordRef', () => {
    it('prefers the base id the form publishes', () => {
      expect(resolveAiRecordRef({ baseRecordId: 'emodel/contract@1', recordId: 'emodel/contract@1-alias-3' })).toBe('emodel/contract@1');
    });

    // The net for a form host that publishes no base id: a cut reference beats a broken request.
    it('falls back to cutting the alias off recordId', () => {
      expect(resolveAiRecordRef({ recordId: 'emodel/contract@1-alias-3' })).toBe('emodel/contract@1');
    });

    it('leaves a reference with no alias alone', () => {
      expect(resolveAiRecordRef({ recordId: 'emodel/contract@1' })).toBe('emodel/contract@1');
    });

    // An empty string, not undefined: the components spread it straight into a `recordRef` prop.
    it('gives an empty string when there is no reference at all', () => {
      expect(resolveAiRecordRef({})).toBe('');
      expect(resolveAiRecordRef(null)).toBe('');
      expect(resolveAiRecordRef(undefined)).toBe('');
      expect(resolveAiRecordRef({ recordId: '-alias-3' })).toBe('');
    });
  });

  describe('isContextRemoval', () => {
    const context = {
      records: [{ recordRef: 'emodel/contract@1a2b' }],
      documents: [{ recordRef: 'emodel/doc@7' }]
    };

    it('reports a toggle of an entry that is in the context as a removal', () => {
      expect(isContextRemoval(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD, { recordRef: 'emodel/contract@1a2b' }, context)).toBe(true);
      expect(isContextRemoval(ADDITIONAL_CONTEXT_TYPES.DOCUMENTS, { recordRef: 'emodel/doc@7' }, context)).toBe(true);
    });

    it('reports a toggle of an entry that is not in the context as an addition', () => {
      expect(isContextRemoval(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD, { recordRef: 'emodel/contract@other' }, context)).toBe(false);
    });

    // The chip holds the reference as its own source wrote it, which is not always how the
    // collection holds it — the whole point of comparing with isSameRecordRef.
    it('matches across the application prefix', () => {
      expect(isContextRemoval(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD, { recordRef: 'contract@1a2b' }, context)).toBe(true);
    });

    it('does not look for a record in the documents collection or the other way round', () => {
      expect(isContextRemoval(ADDITIONAL_CONTEXT_TYPES.DOCUMENTS, { recordRef: 'emodel/contract@1a2b' }, context)).toBe(false);
      expect(isContextRemoval(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD, { recordRef: 'emodel/doc@7' }, context)).toBe(false);
    });

    it('reports false for attributes, an empty context and a missing reference', () => {
      expect(isContextRemoval(ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES, { attribute: 'title' }, context)).toBe(false);
      expect(isContextRemoval(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD, { recordRef: 'emodel/contract@1a2b' }, {})).toBe(false);
      expect(isContextRemoval(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD, null, context)).toBe(false);
      expect(isContextRemoval(ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD, { displayName: 'no ref' }, context)).toBe(false);
    });
  });

  describe('applyAgentSwitch', () => {
    const agent = { id: 'agent-1', name: 'Config' };
    let originalConfirm;

    beforeEach(() => {
      originalConfirm = window.confirm;
      window.confirm = jest.fn(() => true);
    });

    afterEach(() => {
      window.confirm = originalConfirm;
    });

    it('clears the conversation before applying the selection', async () => {
      const calls = [];
      const clearConversation = jest.fn(() => {
        calls.push('clear');
        return Promise.resolve(true);
      });
      const selectAgent = jest.fn(() => calls.push('select'));

      await expect(applyAgentSwitch({ agent, hasConversation: true, clearConversation, selectAgent })).resolves.toBe(true);

      expect(calls).toEqual(['clear', 'select']);
      expect(selectAgent).toHaveBeenCalledWith(agent);
    });

    // The backend stores the agent on the conversation, so a chip changed over a conversation that
    // is still there both contradicts the error the user has just been shown and sends the next
    // question into the old dialog under a new agent.
    it('leaves the selection untouched when a live conversation could not be cleared', async () => {
      const selectAgent = jest.fn();

      await expect(
        applyAgentSwitch({ agent, hasConversation: true, clearConversation: () => Promise.resolve(false), selectAgent })
      ).resolves.toBe(false);

      expect(selectAgent).not.toHaveBeenCalled();
    });

    it('applies the selection on a chat with nothing to lose even when the clearing was refused', async () => {
      const selectAgent = jest.fn();

      await expect(
        applyAgentSwitch({ agent, hasConversation: false, clearConversation: () => Promise.resolve(false), selectAgent })
      ).resolves.toBe(true);

      expect(selectAgent).toHaveBeenCalledWith(agent);
    });

    // The welcome-screen shortcut omits the callback when there is no conversation: no DELETE goes
    // out, and the context staged before the first question stays where the user put it.
    it('applies the selection with no clear callback at all', async () => {
      const selectAgent = jest.fn();

      await expect(applyAgentSwitch({ agent: null, hasConversation: false, clearConversation: null, selectAgent })).resolves.toBe(true);

      expect(selectAgent).toHaveBeenCalledWith(null);
    });

    // Asking and clearing are one rule, so the confirmation lives here rather than at the call
    // sites: stated separately by each of them, a new entry point would silently omit it.
    it('asks before losing a live conversation and clears nothing when the answer is no', async () => {
      window.confirm = jest.fn(() => false);
      const clearConversation = jest.fn(() => Promise.resolve(true));
      const selectAgent = jest.fn();

      await expect(applyAgentSwitch({ agent, hasConversation: true, clearConversation, selectAgent })).resolves.toBe(false);

      expect(window.confirm).toHaveBeenCalledWith('ai-agent.confirm-switch');
      expect(clearConversation).not.toHaveBeenCalled();
      expect(selectAgent).not.toHaveBeenCalled();
    });

    it('asks before clearing, not after', async () => {
      const calls = [];
      window.confirm = jest.fn(() => {
        calls.push('confirm');
        return true;
      });
      const clearConversation = jest.fn(() => {
        calls.push('clear');
        return Promise.resolve(true);
      });

      await applyAgentSwitch({ agent, hasConversation: true, clearConversation, selectAgent: () => calls.push('select') });

      expect(calls).toEqual(['confirm', 'clear', 'select']);
    });

    // Nothing to lose, nothing to warn about: the conversation id has never been to the backend.
    it('asks nothing on a chat with no conversation behind it', async () => {
      const selectAgent = jest.fn();

      await expect(applyAgentSwitch({ agent, hasConversation: false, clearConversation: null, selectAgent })).resolves.toBe(true);

      expect(window.confirm).not.toHaveBeenCalled();
      expect(selectAgent).toHaveBeenCalledWith(agent);
    });
  });
});
