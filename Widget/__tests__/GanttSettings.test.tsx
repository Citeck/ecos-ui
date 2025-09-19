import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import GanttSettings from '../GanttSettings';

// Mock the t function for translations
jest.mock('@/helpers/util', () => ({
  t: (key: string) => {
    const translations: Record<string, string> = {
      'gantt.settings.title': 'Gantt Chart Settings',
      'gantt.settings.data-type.label': 'Data Type',
      'gantt.settings.data-type.standalone': 'Standalone - Manual data entry',
      'gantt.settings.data-type.linked': 'Linked - Connected to business object',
      'gantt.settings.data-source.label': 'Data Source',
      'gantt.settings.manual-data-source.label': 'Manual Data Source',
      'gantt.settings.linked-with-type.label': 'Linked With Type',
      'gantt.settings.linked-with-ref.label': 'Linked With Reference',
      'gantt.settings.data-source.placeholder': 'Select data source',
      'gantt.settings.manual-data-source.placeholder': 'Enter data source ID',
      'gantt.settings.data-source.description': 'Select the data source to fetch and store Gantt chart data',
      'gantt.settings.manual-data-source.description': 'Enter the data source ID manually',
      'gantt.settings.linked-with-type.placeholder': 'Enter type of linked data',
      'gantt.settings.linked-with-ref.placeholder': 'Enter reference to linked document',
      'btn.cancel.label': 'Cancel',
      'btn.apply.label': 'Apply'
    };
    return translations[key] || key;
  }
}));

// Mock the EcosModal component
jest.mock('@/components/common', () => ({
  EcosModal: ({ children, title }: any): React.JSX.Element => (
    <div data-testid="ecos-modal">
      <h2>{title}</h2>
      {children}
    </div>
  )
}));

// Mock the Btn component
jest.mock('@/components/common/btns', () => ({
  Btn: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>
}));

// Mock the Select component
jest.mock('@/components/common/form/Select', () => {
  return function MockSelect({ onChange, value, options }: any) {
    return (
      <select
        onChange={e => {
          const selected = options.find((opt: any) => opt.id === e.target.value);
          onChange(selected);
        }}
        value={value?.id || ''}
      >
        {options.map((option: any) => (
          <option key={option.id} value={option.id}>
            {option.displayName}
          </option>
        ))}
      </select>
    );
  };
});

describe('GanttSettings', () => {
  const mockOnSave = jest.fn();
  const mockOnHide = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default STANDALONE settings', () => {
    render(<GanttSettings isOpen={true} settings={{ dataType: 'STANDALONE' }} onHide={mockOnHide} onSave={mockOnSave} />);

    expect(screen.getByText('Gantt Chart Settings')).toBeInTheDocument();
    expect(screen.getByText('Data Type')).toBeInTheDocument();
    expect(screen.getByText('Standalone - Manual data entry')).toBeInTheDocument();
    expect(screen.getByText('Linked - Connected to business object')).toBeInTheDocument();

    // Check that STANDALONE radio is checked
    const standaloneRadio = screen.getByLabelText('Standalone - Manual data entry') as HTMLInputElement;
    expect(standaloneRadio.checked).toBe(true);

    // Check that LINKED radio is not checked
    const linkedRadio = screen.getByLabelText('Linked - Connected to business object') as HTMLInputElement;
    expect(linkedRadio.checked).toBe(false);
  });

  it('switches to LINKED type and shows additional fields', () => {
    render(<GanttSettings isOpen={true} settings={{ dataType: 'STANDALONE' }} onHide={mockOnHide} onSave={mockOnSave} />);

    // Click on LINKED radio button
    const linkedRadio = screen.getByLabelText('Linked - Connected to business object');
    fireEvent.click(linkedRadio);

    // Check that additional fields for LINKED type are visible
    expect(screen.getByText('Data Source')).toBeInTheDocument();
    expect(screen.getByText('Manual Data Source')).toBeInTheDocument();
    expect(screen.getByText('Linked With Type')).toBeInTheDocument();
    expect(screen.getByText('Linked With Reference')).toBeInTheDocument();
  });

  it('calls onSave with correct settings when STANDALONE is selected', () => {
    render(<GanttSettings isOpen={true} settings={{ dataType: 'LINKED' }} onHide={mockOnHide} onSave={mockOnSave} />);

    // Switch back to STANDALONE
    const standaloneRadio = screen.getByLabelText('Standalone - Manual data entry');
    fireEvent.click(standaloneRadio);

    // Click Save button
    const saveButton = screen.getByText('Apply');
    fireEvent.click(saveButton);

    // Check that onSave was called with correct settings
    expect(mockOnSave).toHaveBeenCalledWith({
      dataType: 'STANDALONE'
    });
  });

  it('calls onSave with correct settings when LINKED is selected with manual data source', () => {
    render(<GanttSettings isOpen={true} settings={{ dataType: 'STANDALONE' }} onHide={mockOnHide} onSave={mockOnSave} />);

    // Switch to LINKED
    const linkedRadio = screen.getByLabelText('Linked - Connected to business object');
    fireEvent.click(linkedRadio);

    // Fill in manual data source
    const manualDataSourceInput = screen.getByLabelText('Manual Data Source') as HTMLInputElement;
    fireEvent.change(manualDataSourceInput, { target: { value: 'test-source-id' } });

    // Fill in linked with type
    const linkedWithTypeInput = screen.getByLabelText('Linked With Type') as HTMLInputElement;
    fireEvent.change(linkedWithTypeInput, { target: { value: 'test-type' } });

    // Fill in linked with ref
    const linkedWithRefInput = screen.getByLabelText('Linked With Reference') as HTMLInputElement;
    fireEvent.change(linkedWithRefInput, { target: { value: 'test-ref' } });

    // Click Save button
    const saveButton = screen.getByText('Apply');
    fireEvent.click(saveButton);

    // Check that onSave was called with correct settings
    expect(mockOnSave).toHaveBeenCalledWith({
      dataType: 'LINKED',
      dataSourceId: null,
      manualDataSourceId: 'test-source-id',
      linkedWithType: 'test-type',
      linkedWithRef: 'test-ref'
    });
  });
});
