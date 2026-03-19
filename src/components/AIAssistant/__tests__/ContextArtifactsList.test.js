import React from 'react';
import { render, screen } from '@testing-library/react';
import ContextArtifactsList from '../components/messages/ContextArtifactsList';

jest.mock('../../common', () => ({
  Icon: ({ className }) => <i className={className} data-testid="icon" />
}));

describe('ContextArtifactsList', () => {
  it('returns null when contextArtifacts is null', () => {
    const { container } = render(<ContextArtifactsList contextArtifacts={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when contextArtifacts is undefined', () => {
    const { container } = render(<ContextArtifactsList />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when contextArtifacts is empty array', () => {
    const { container } = render(<ContextArtifactsList contextArtifacts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders header with link icon and correct text', () => {
    const artifacts = [
      { ref: 'emodel/type@employee', displayName: 'Сотрудник', type: 'DATA_TYPE' }
    ];

    const { container } = render(<ContextArtifactsList contextArtifacts={artifacts} />);

    expect(screen.getByText('Связанные артефакты:')).toBeTruthy();
    const headerIcon = container.querySelector('.ai-assistant-chat__context-artifacts-header .fa-link');
    expect(headerIcon).toBeTruthy();
  });

  it('renders DATA_TYPE artifact with database icon', () => {
    const artifacts = [
      { ref: 'emodel/type@employee', displayName: 'Сотрудник', type: 'DATA_TYPE' }
    ];

    const { container } = render(<ContextArtifactsList contextArtifacts={artifacts} />);

    expect(screen.getByText('Сотрудник')).toBeTruthy();
    const itemIcon = container.querySelector('.ai-assistant-chat__context-artifact-item .fa-database');
    expect(itemIcon).toBeTruthy();
  });

  it('renders FORM artifact with file-alt icon', () => {
    const artifacts = [
      { ref: 'uiserv/form@employee', displayName: 'Форма сотрудника', type: 'FORM' }
    ];

    const { container } = render(<ContextArtifactsList contextArtifacts={artifacts} />);

    expect(screen.getByText('Форма сотрудника')).toBeTruthy();
    const itemIcon = container.querySelector('.ai-assistant-chat__context-artifact-item .fa-file-text-o');
    expect(itemIcon).toBeTruthy();
  });

  it('renders BPMN_PROCESS artifact with project-diagram icon', () => {
    const artifacts = [
      { ref: 'eproc/bpmn@my-process', displayName: 'Мой процесс', type: 'BPMN_PROCESS' }
    ];

    const { container } = render(<ContextArtifactsList contextArtifacts={artifacts} />);

    expect(screen.getByText('Мой процесс')).toBeTruthy();
    const itemIcon = container.querySelector('.ai-assistant-chat__context-artifact-item .fa-sitemap');
    expect(itemIcon).toBeTruthy();
  });

  it('renders unknown type with cube icon', () => {
    const artifacts = [
      { ref: 'some/ref@thing', displayName: 'Unknown Thing', type: 'SOMETHING_ELSE' }
    ];

    const { container } = render(<ContextArtifactsList contextArtifacts={artifacts} />);

    expect(screen.getByText('Unknown Thing')).toBeTruthy();
    const itemIcon = container.querySelector('.ai-assistant-chat__context-artifact-item .fa-cube');
    expect(itemIcon).toBeTruthy();
  });

  it('renders artifact as clickable link with correct href', () => {
    const artifacts = [
      { ref: 'emodel/type@employee', displayName: 'Сотрудник', type: 'DATA_TYPE' }
    ];

    render(<ContextArtifactsList contextArtifacts={artifacts} />);

    const link = screen.getByText('Сотрудник');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/v2/dashboard?recordRef=emodel%2Ftype%40employee');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('renders multiple artifacts', () => {
    const artifacts = [
      { ref: 'emodel/type@employee', displayName: 'Сотрудник', type: 'DATA_TYPE' },
      { ref: 'uiserv/form@employee', displayName: 'Форма сотрудника', type: 'FORM' },
      { ref: 'eproc/bpmn@process', displayName: 'Процесс', type: 'BPMN_PROCESS' }
    ];

    render(<ContextArtifactsList contextArtifacts={artifacts} />);

    expect(screen.getByText('Сотрудник')).toBeTruthy();
    expect(screen.getByText('Форма сотрудника')).toBeTruthy();
    expect(screen.getByText('Процесс')).toBeTruthy();
  });

  it('falls back to ref when displayName is missing', () => {
    const artifacts = [
      { ref: 'emodel/type@employee', type: 'DATA_TYPE' }
    ];

    render(<ContextArtifactsList contextArtifacts={artifacts} />);

    expect(screen.getByText('emodel/type@employee')).toBeTruthy();
  });

  it('renders text without link when ref is missing', () => {
    const artifacts = [
      { displayName: 'No Ref', type: 'DATA_TYPE' }
    ];

    render(<ContextArtifactsList contextArtifacts={artifacts} />);

    const element = screen.getByText('No Ref');
    expect(element.tagName).toBe('SPAN');
    expect(element.getAttribute('href')).toBeNull();
  });
});
