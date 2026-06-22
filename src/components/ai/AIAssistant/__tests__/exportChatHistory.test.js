import { buildChatMarkdown, buildChatHtml, exportChat } from '../exportChatHistory';

// Mock t() to return the key as-is for predictable assertions
jest.mock('@/helpers/export/util', () => ({
  t: (key) => key
}));

// Mock formatMessageTime
jest.mock('../utils', () => ({
  formatMessageTime: () => '14:30'
}));

// Mock marked
jest.mock('marked', () => ({
  marked: {
    parse: (md) => `<p>${md}</p>`
  }
}));

const createMessage = (overrides = {}) => ({
  id: 'msg-1',
  text: 'Hello',
  sender: 'user',
  timestamp: new Date('2026-04-15T14:30:00'),
  ...overrides
});

describe('buildChatMarkdown', () => {
  it('returns header with date for empty messages', () => {
    const result = buildChatMarkdown([]);
    expect(result).toContain('# Citeck AI');
    expect(result).toContain('ai-assistant.export.title');
    expect(result).not.toContain('###');
  });

  it('formats user message with role and time', () => {
    const messages = [createMessage({ sender: 'user', text: 'Hello world' })];
    const result = buildChatMarkdown(messages);
    expect(result).toContain('### ai-assistant.export.role-user (14:30)');
    expect(result).toContain('Hello world');
  });

  it('formats AI message with default role', () => {
    const messages = [createMessage({ sender: 'ai', text: 'Hi there' })];
    const result = buildChatMarkdown(messages);
    expect(result).toContain('### ai-assistant.export.role-ai (14:30)');
    expect(result).toContain('Hi there');
  });

  it('uses agent name instead of AI when selectedAgent provided', () => {
    const messages = [createMessage({ sender: 'ai', text: 'Agent reply' })];
    const result = buildChatMarkdown(messages, { name: 'Бизнес-аналитик', id: 'agent-1' });
    expect(result).toContain('### Бизнес-аналитик (14:30)');
    expect(result).not.toContain('ai-assistant.export.role-ai');
  });

  it('skips processing messages', () => {
    const messages = [createMessage({ isProcessing: true, text: 'Loading...' })];
    const result = buildChatMarkdown(messages);
    expect(result).not.toContain('Loading...');
    expect(result).not.toContain('###');
  });

  it('skips cancelled messages', () => {
    const messages = [createMessage({ isCancelled: true, text: 'Cancelled' })];
    const result = buildChatMarkdown(messages);
    expect(result).not.toContain('Cancelled');
    expect(result).not.toContain('###');
  });

  it('formats error messages with warning prefix', () => {
    const messages = [createMessage({ sender: 'ai', isError: true, text: 'Something went wrong' })];
    const result = buildChatMarkdown(messages);
    expect(result).toContain('> ⚠ ai-assistant.export.error: Something went wrong');
  });

  it('formats email messages with subject, to, body', () => {
    const messages = [
      createMessage({
        sender: 'ai',
        isEmailContent: true,
        text: 'Email body text',
        messageData: { subject: 'Test Subject', to: 'user@example.com', body: 'Email body content' }
      })
    ];
    const result = buildChatMarkdown(messages);
    expect(result).toContain('**ai-assistant.export.email-subject:** Test Subject');
    expect(result).toContain('**ai-assistant.export.email-to:** user@example.com');
    expect(result).toContain('Email body content');
  });

  it('formats text diff messages with original and modified', () => {
    const messages = [
      createMessage({
        sender: 'ai',
        isTextDiffContent: true,
        text: 'Proposed changes:',
        messageData: {
          originalPlainText: 'Old text',
          modifiedPlainText: 'New text',
          attributeName: 'description'
        }
      })
    ];
    const result = buildChatMarkdown(messages);
    expect(result).toContain('Proposed changes:');
    expect(result).toContain('**description**');
    expect(result).toContain('Old text');
    expect(result).toContain('New text');
    expect(result).toContain('ai-assistant.export.original');
    expect(result).toContain('ai-assistant.export.modified');
  });

  it('formats script diff messages with code blocks', () => {
    const messages = [
      createMessage({
        sender: 'ai',
        isScriptDiffContent: true,
        text: 'Script changes:',
        messageData: {
          originalScript: 'var x = 1;',
          modifiedScript: 'const x = 1;',
          contextType: 'computed_attribute'
        }
      })
    ];
    const result = buildChatMarkdown(messages);
    expect(result).toContain('Script changes:');
    expect(result).toContain('```js\nvar x = 1;\n```');
    expect(result).toContain('```js\nconst x = 1;\n```');
    expect(result).toContain('computed_attribute');
  });

  it('formats agent plan messages with text and error', () => {
    const messages = [
      createMessage({
        sender: 'ai',
        isAgentPlanContent: true,
        text: 'Plan description',
        messageData: { agentStatus: 'FAILED', error: 'Timeout occurred' }
      })
    ];
    const result = buildChatMarkdown(messages);
    expect(result).toContain('Plan description');
    expect(result).toContain('> ⚠ ai-assistant.export.error: Timeout occurred');
  });

  it('formats agent plan messages with artifacts', () => {
    const messages = [
      createMessage({
        sender: 'ai',
        isAgentPlanContent: true,
        text: 'Completed',
        messageData: {
          agentStatus: 'COMPLETED',
          artifacts: [{ name: 'report.pdf' }, { name: 'data.csv' }]
        }
      })
    ];
    const result = buildChatMarkdown(messages);
    expect(result).toContain('ai-assistant.export.artifacts');
    expect(result).toContain('- report.pdf');
    expect(result).toContain('- data.csv');
  });

  it('formats agent progress planning messages', () => {
    const messages = [
      createMessage({
        sender: 'ai',
        isAgentProgressContent: true,
        text: 'Planning...',
        messageData: { type: 'agent_planning' }
      })
    ];
    const result = buildChatMarkdown(messages);
    expect(result).toContain('Planning...');
  });

  it('formats agent progress execution with step checklist', () => {
    const messages = [
      createMessage({
        sender: 'ai',
        isAgentProgressContent: true,
        text: '',
        messageData: {
          type: 'agent_execution',
          completedSteps: 2,
          totalSteps: 3,
          steps: [
            { id: '1', status: 'COMPLETED', description: 'Step one', executionTime: '1.2s' },
            { id: '2', status: 'COMPLETED', description: 'Step two', executionTime: '0.8s' },
            { id: '3', status: 'FAILED', description: 'Step three', error: 'Connection lost' }
          ]
        }
      })
    ];
    const result = buildChatMarkdown(messages);
    expect(result).toContain('2/3');
    expect(result).toContain('- [x] Step one (1.2s)');
    expect(result).toContain('- [x] Step two (0.8s)');
    expect(result).toContain('- [ ] Step three — ai-assistant.export.error: Connection lost');
  });

  it('formats business app messages with detailedStatus', () => {
    const messages = [
      createMessage({
        sender: 'ai',
        isBusinessAppContent: true,
        text: 'Generating...',
        messageData: {
          detailedStatus: 'Creating data model...',
          stage: 'IN_PROGRESS'
        }
      })
    ];
    const result = buildChatMarkdown(messages);
    expect(result).toContain('Creating data model...');
  });

  it('preserves message order and adds separators', () => {
    const messages = [
      createMessage({ sender: 'user', text: 'First' }),
      createMessage({ sender: 'ai', text: 'Second' }),
      createMessage({ sender: 'user', text: 'Third' })
    ];
    const result = buildChatMarkdown(messages);
    const firstIdx = result.indexOf('First');
    const secondIdx = result.indexOf('Second');
    const thirdIdx = result.indexOf('Third');
    expect(firstIdx).toBeLessThan(secondIdx);
    expect(secondIdx).toBeLessThan(thirdIdx);
    expect(result.match(/---/g).length).toBeGreaterThanOrEqual(3);
  });
});

describe('buildChatHtml', () => {
  it('returns full HTML document with DOCTYPE', () => {
    const result = buildChatHtml([]);
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<html');
    expect(result).toContain('</html>');
  });

  it('contains style block', () => {
    const result = buildChatHtml([]);
    expect(result).toContain('<style>');
    expect(result).toContain('</style>');
  });

  it('contains converted markdown content', () => {
    const messages = [createMessage({ sender: 'user', text: 'Test message' })];
    const result = buildChatHtml(messages);
    expect(result).toContain('Test message');
  });

  it('has correct charset and title', () => {
    const result = buildChatHtml([]);
    expect(result).toContain('<meta charset="utf-8">');
    expect(result).toContain('<title>Citeck AI');
  });
});

describe('exportChat', () => {
  let createObjectURLMock;
  let revokeObjectURLMock;
  let appendChildSpy;
  let removeChildSpy;
  let clickSpy;

  beforeEach(() => {
    createObjectURLMock = jest.fn(() => 'blob:mock-url');
    revokeObjectURLMock = jest.fn();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    clickSpy = jest.fn();
    const mockLink = {
      href: '',
      download: '',
      click: clickSpy,
      set setAttribute(val) {}
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
    appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('downloads markdown file with correct mime type', () => {
    const messages = [createMessage({ text: 'Test' })];
    exportChat(messages, 'markdown');

    expect(createObjectURLMock).toHaveBeenCalledWith(expect.any(Blob));
    const blob = createObjectURLMock.mock.calls[0][0];
    expect(blob.type).toBe('text/markdown');
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
  });

  it('downloads html file with correct mime type', () => {
    const messages = [createMessage({ text: 'Test' })];
    exportChat(messages, 'html');

    expect(createObjectURLMock).toHaveBeenCalledWith(expect.any(Blob));
    const blob = createObjectURLMock.mock.calls[0][0];
    expect(blob.type).toBe('text/html');
    expect(clickSpy).toHaveBeenCalled();
  });

  it('generates filename with correct extension', () => {
    const messages = [createMessage({ text: 'Test' })];
    exportChat(messages, 'markdown');

    const link = document.createElement.mock.results[0].value;
    expect(link.download).toMatch(/^chat-export-\d{4}-\d{2}-\d{2}-\d{4}\.md$/);
  });

  it('generates html filename with correct extension', () => {
    const messages = [createMessage({ text: 'Test' })];
    exportChat(messages, 'html');

    const link = document.createElement.mock.results[0].value;
    expect(link.download).toMatch(/^chat-export-\d{4}-\d{2}-\d{2}-\d{4}\.html$/);
  });
});
