import {
  generateUUID,
  getStageStatus,
  formatMessageTime,
  truncateText,
  fileSaveActionTempRef,
  isFileSaveActionSet,
  isGateStale
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
});
