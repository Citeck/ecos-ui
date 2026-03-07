import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatContextTags from '../components/ChatContextTags';
import { CONTEXT_TYPE_ICONS, getDocumentIcon } from '../components/ChatContextTags';
import { ADDITIONAL_CONTEXT_TYPES } from '../constants';

// Mock Icon component
jest.mock('../../common', () => ({
  Icon: ({ className }) => <i className={className} data-testid="icon" />
}));

describe('ChatContextTags', () => {
  const defaultProps = {
    selectedAdditionalContext: [],
    additionalContext: { records: [], documents: [], attributes: [] },
    onToggleContext: jest.fn(),
    onRemoveSelectedText: jest.fn(),
    onRemoveScriptContext: jest.fn(),
    onRemoveUploadedFile: jest.fn()
  };

  it('returns null when there is no content', () => {
    const { container } = render(<ChatContextTags {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders workspace tag when workspaceContext is provided', () => {
    const workspaceContext = {
      workspaceId: 'ws-test',
      workspaceName: 'Test Workspace',
      artifacts: null
    };

    render(<ChatContextTags {...defaultProps} workspaceContext={workspaceContext} />);

    expect(screen.getByText('Test Workspace')).toBeTruthy();
  });

  it('renders workspace tag with workspaceId when workspaceName is missing', () => {
    const workspaceContext = {
      workspaceId: 'ws-test',
      workspaceName: '',
      artifacts: null
    };

    render(<ChatContextTags {...defaultProps} workspaceContext={workspaceContext} />);

    expect(screen.getByText('ws-test')).toBeTruthy();
  });

  it('renders artifact count badge when artifacts are present', () => {
    const workspaceContext = {
      workspaceId: 'ws-test',
      workspaceName: 'My Workspace',
      artifacts: {
        dataTypes: 3,
        forms: 5,
        processes: 2,
        journals: 1
      }
    };

    render(<ChatContextTags {...defaultProps} workspaceContext={workspaceContext} />);

    expect(screen.getByText('My Workspace')).toBeTruthy();
    expect(screen.getByText('11')).toBeTruthy(); // 3+5+2+1
  });

  it('does not render badge when artifact count is zero', () => {
    const workspaceContext = {
      workspaceId: 'ws-test',
      workspaceName: 'Empty Workspace',
      artifacts: {
        dataTypes: 0,
        forms: 0,
        processes: 0,
        journals: 0
      }
    };

    const { container } = render(<ChatContextTags {...defaultProps} workspaceContext={workspaceContext} />);

    expect(screen.getByText('Empty Workspace')).toBeTruthy();
    expect(container.querySelector('.ai-assistant-chat__context-tag-badge')).toBeNull();
  });

  it('workspace tag is not removable (no remove button)', () => {
    const workspaceContext = {
      workspaceId: 'ws-test',
      workspaceName: 'Test Workspace',
      artifacts: null
    };

    const { container } = render(<ChatContextTags {...defaultProps} workspaceContext={workspaceContext} />);

    const workspaceTag = container.querySelector('.ai-assistant-chat__context-tag--workspace');
    expect(workspaceTag).toBeTruthy();
    expect(workspaceTag.querySelector('.ai-assistant-chat__context-tag-remove')).toBeNull();
  });

  it('workspace tag has briefcase icon', () => {
    const workspaceContext = {
      workspaceId: 'ws-test',
      workspaceName: 'Test Workspace',
      artifacts: null
    };

    const { container } = render(<ChatContextTags {...defaultProps} workspaceContext={workspaceContext} />);

    const workspaceTag = container.querySelector('.ai-assistant-chat__context-tag--workspace');
    expect(workspaceTag.querySelector('.fa-briefcase')).toBeTruthy();
  });

  it('renders workspace tag alongside other context tags', () => {
    const workspaceContext = {
      workspaceId: 'ws-test',
      workspaceName: 'Test Workspace',
      artifacts: { dataTypes: 2, forms: 1, processes: 0, journals: 0 }
    };

    render(
      <ChatContextTags
        {...defaultProps}
        workspaceContext={workspaceContext}
        selectedTextContext={{ text: 'Some selected text', reference: 'ref1' }}
      />
    );

    expect(screen.getByText('Test Workspace')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy(); // 2+1+0+0
    expect(screen.getByText(/Some selected text/)).toBeTruthy();
  });

  it('does not render badge when artifacts is null', () => {
    const workspaceContext = {
      workspaceId: 'ws-test',
      workspaceName: 'Test Workspace',
      artifacts: null
    };

    const { container } = render(<ChatContextTags {...defaultProps} workspaceContext={workspaceContext} />);

    expect(container.querySelector('.ai-assistant-chat__context-tag-badge')).toBeNull();
  });

  describe('context type icons', () => {
    it('CONTEXT_TYPE_ICONS maps all context types to icons', () => {
      expect(CONTEXT_TYPE_ICONS.records).toBe('fa-database');
      expect(CONTEXT_TYPE_ICONS.documents).toBe('fa-file-text');
      expect(CONTEXT_TYPE_ICONS.attributes).toBe('fa-tag');
      expect(CONTEXT_TYPE_ICONS.selected_text).toBe('fa-quote-left');
      expect(CONTEXT_TYPE_ICONS.script).toBe('fa-code');
      expect(CONTEXT_TYPE_ICONS.workspace).toBe('fa-briefcase');
    });

    it('renders database icon for record tags', () => {
      const { container } = render(
        <ChatContextTags
          {...defaultProps}
          selectedAdditionalContext={[ADDITIONAL_CONTEXT_TYPES.CURRENT_RECORD]}
          additionalContext={{ records: [{ displayName: 'Test Record', recordRef: 'ref1' }], documents: [], attributes: [] }}
        />
      );

      const tag = container.querySelector('.ai-assistant-chat__context-tag');
      expect(tag.querySelector('.fa-database')).toBeTruthy();
      expect(screen.getByText('Test Record')).toBeTruthy();
    });

    it('renders file-text icon for document tags by default', () => {
      const { container } = render(
        <ChatContextTags
          {...defaultProps}
          selectedAdditionalContext={[ADDITIONAL_CONTEXT_TYPES.DOCUMENTS]}
          additionalContext={{ records: [], documents: [{ displayName: 'My Doc', recordRef: 'doc1' }], attributes: [] }}
        />
      );

      const tag = container.querySelector('.ai-assistant-chat__context-tag--document');
      expect(tag.querySelector('.fa-file-text')).toBeTruthy();
    });

    it('renders PDF icon for PDF documents', () => {
      const { container } = render(
        <ChatContextTags
          {...defaultProps}
          selectedAdditionalContext={[ADDITIONAL_CONTEXT_TYPES.DOCUMENTS]}
          additionalContext={{ records: [], documents: [{ displayName: 'Report.pdf', typeDisp: 'PDF Document' }], attributes: [] }}
        />
      );

      const tag = container.querySelector('.ai-assistant-chat__context-tag--document');
      expect(tag.querySelector('.fa-file-pdf-o')).toBeTruthy();
    });

    it('renders Word icon for Word documents', () => {
      const { container } = render(
        <ChatContextTags
          {...defaultProps}
          selectedAdditionalContext={[ADDITIONAL_CONTEXT_TYPES.DOCUMENTS]}
          additionalContext={{ records: [], documents: [{ displayName: 'File.docx', typeDisp: 'Word Document' }], attributes: [] }}
        />
      );

      const tag = container.querySelector('.ai-assistant-chat__context-tag--document');
      expect(tag.querySelector('.fa-file-word-o')).toBeTruthy();
    });

    it('renders tag icon for attribute tags', () => {
      const { container } = render(
        <ChatContextTags
          {...defaultProps}
          selectedAdditionalContext={[ADDITIONAL_CONTEXT_TYPES.ATTRIBUTES]}
          additionalContext={{ records: [], documents: [], attributes: [{ displayName: 'Status', attribute: 'status' }] }}
        />
      );

      const tag = container.querySelector('.ai-assistant-chat__context-tag--attribute');
      expect(tag.querySelector('.fa-tag')).toBeTruthy();
    });

    it('renders quote-left icon for selected text tag', () => {
      const { container } = render(
        <ChatContextTags
          {...defaultProps}
          selectedTextContext={{ text: 'Some text', reference: 'ref1' }}
        />
      );

      const tag = container.querySelector('.ai-assistant-chat__context-tag--selected-text');
      expect(tag.querySelector('.fa-quote-left')).toBeTruthy();
    });

    it('renders code icon for script tag', () => {
      const { container } = render(
        <ChatContextTags
          {...defaultProps}
          scriptContext={{ scriptContextType: 'computed_attribute', content: 'code' }}
          getScriptContextLabel={() => 'Script'}
        />
      );

      const tag = container.querySelector('.ai-assistant-chat__context-tag--script');
      expect(tag.querySelector('.fa-code')).toBeTruthy();
    });
  });

  describe('auto context artifacts', () => {
    const autoArtifacts = [
      { ref: 'emodel/type@employee', displayName: 'Сотрудник', type: 'DATA_TYPE' },
      { ref: 'uiserv/form@employee', displayName: 'Форма сотрудника', type: 'FORM' },
      { ref: 'eproc/bpmn@hiring', displayName: 'Найм', type: 'BPMN_PROCESS' }
    ];

    it('renders auto context artifact tags', () => {
      const { container } = render(
        <ChatContextTags
          {...defaultProps}
          autoContextArtifacts={autoArtifacts}
        />
      );

      expect(screen.getByText('Сотрудник')).toBeTruthy();
      expect(screen.getByText('Форма сотрудника')).toBeTruthy();
      expect(screen.getByText('Найм')).toBeTruthy();

      const autoTags = container.querySelectorAll('.ai-assistant-chat__context-tag--auto');
      expect(autoTags).toHaveLength(3);
    });

    it('renders magic icon prefix and type-specific icon for each auto artifact', () => {
      const { container } = render(
        <ChatContextTags
          {...defaultProps}
          autoContextArtifacts={[autoArtifacts[0]]}
        />
      );

      const autoTag = container.querySelector('.ai-assistant-chat__context-tag--auto');
      expect(autoTag.querySelector('.fa-magic')).toBeTruthy();
      expect(autoTag.querySelector('.fa-database')).toBeTruthy();
    });

    it('renders form icon for FORM type', () => {
      const { container } = render(
        <ChatContextTags
          {...defaultProps}
          autoContextArtifacts={[autoArtifacts[1]]}
        />
      );

      const autoTag = container.querySelector('.ai-assistant-chat__context-tag--auto');
      expect(autoTag.querySelector('.fa-file-text-o')).toBeTruthy();
    });

    it('renders project-diagram icon for BPMN_PROCESS type', () => {
      const { container } = render(
        <ChatContextTags
          {...defaultProps}
          autoContextArtifacts={[autoArtifacts[2]]}
        />
      );

      const autoTag = container.querySelector('.ai-assistant-chat__context-tag--auto');
      expect(autoTag.querySelector('.fa-sitemap')).toBeTruthy();
    });

    it('renders cube icon for unknown type', () => {
      const { container } = render(
        <ChatContextTags
          {...defaultProps}
          autoContextArtifacts={[{ ref: 'test/ref', displayName: 'Unknown', type: 'SOMETHING_ELSE' }]}
        />
      );

      const autoTag = container.querySelector('.ai-assistant-chat__context-tag--auto');
      expect(autoTag.querySelector('.fa-cube')).toBeTruthy();
    });

    it('has tooltip "Найдено автоматически"', () => {
      const { container } = render(
        <ChatContextTags
          {...defaultProps}
          autoContextArtifacts={[autoArtifacts[0]]}
        />
      );

      const autoTag = container.querySelector('.ai-assistant-chat__context-tag--auto');
      expect(autoTag.getAttribute('title')).toBe('Найдено автоматически');
    });

    it('calls onRemoveAutoContextArtifact when remove button is clicked', () => {
      const onRemove = jest.fn();
      const { container } = render(
        <ChatContextTags
          {...defaultProps}
          autoContextArtifacts={[autoArtifacts[0]]}
          onRemoveAutoContextArtifact={onRemove}
        />
      );

      const removeBtn = container.querySelector('.ai-assistant-chat__context-tag--auto .ai-assistant-chat__context-tag-remove');
      removeBtn.click();
      expect(onRemove).toHaveBeenCalledWith('emodel/type@employee');
    });

    it('falls back to ref when displayName is missing', () => {
      render(
        <ChatContextTags
          {...defaultProps}
          autoContextArtifacts={[{ ref: 'emodel/type@test', type: 'DATA_TYPE' }]}
        />
      );

      expect(screen.getByText('emodel/type@test')).toBeTruthy();
    });

    it('returns null when autoContextArtifacts is the only content but empty', () => {
      const { container } = render(
        <ChatContextTags {...defaultProps} autoContextArtifacts={[]} />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('getDocumentIcon', () => {
    it('returns fa-file-text for documents without typeDisp', () => {
      expect(getDocumentIcon({})).toBe('fa-file-text');
      expect(getDocumentIcon(null)).toBe('fa-file-text');
      expect(getDocumentIcon({ typeDisp: '' })).toBe('fa-file-text');
    });

    it('returns fa-file-pdf-o for PDF documents', () => {
      expect(getDocumentIcon({ typeDisp: 'PDF Document' })).toBe('fa-file-pdf-o');
      expect(getDocumentIcon({ typeDisp: 'application/pdf' })).toBe('fa-file-pdf-o');
    });

    it('returns fa-file-word-o for Word documents', () => {
      expect(getDocumentIcon({ typeDisp: 'Word Document' })).toBe('fa-file-word-o');
      expect(getDocumentIcon({ typeDisp: 'file.docx' })).toBe('fa-file-word-o');
    });

    it('returns fa-file-excel-o for Excel documents', () => {
      expect(getDocumentIcon({ typeDisp: 'Excel Spreadsheet' })).toBe('fa-file-excel-o');
      expect(getDocumentIcon({ typeDisp: 'file.xlsx' })).toBe('fa-file-excel-o');
    });

    it('returns fa-file-image-o for image documents', () => {
      expect(getDocumentIcon({ typeDisp: 'Image File' })).toBe('fa-file-image-o');
      expect(getDocumentIcon({ typeDisp: 'photo.jpg' })).toBe('fa-file-image-o');
      expect(getDocumentIcon({ typeDisp: 'icon.png' })).toBe('fa-file-image-o');
    });

    it('returns fa-file-powerpoint-o for PowerPoint documents', () => {
      expect(getDocumentIcon({ typeDisp: 'PowerPoint Presentation' })).toBe('fa-file-powerpoint-o');
      expect(getDocumentIcon({ typeDisp: 'slides.pptx' })).toBe('fa-file-powerpoint-o');
    });

    it('returns fa-file-text for unknown document types', () => {
      expect(getDocumentIcon({ typeDisp: 'Unknown Type' })).toBe('fa-file-text');
    });
  });
});
