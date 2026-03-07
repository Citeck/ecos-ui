import React from 'react';
import { render, screen } from '@testing-library/react';
import ArtifactsList from '../components/messages/ArtifactsList';

jest.mock('../../common', () => ({
  Icon: ({ className }) => <i className={className} data-testid="icon" />
}));

describe('ArtifactsList', () => {
  it('returns null when artifacts is null', () => {
    const { container } = render(<ArtifactsList artifacts={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when artifacts is undefined', () => {
    const { container } = render(<ArtifactsList />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when artifacts is empty array', () => {
    const { container } = render(<ArtifactsList artifacts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders header with check-circle icon', () => {
    const artifacts = [
      { name: 'Test', url: '/test', type: { displayName: 'Form', icon: 'fa-wpforms' } }
    ];

    render(<ArtifactsList artifacts={artifacts} />);

    expect(screen.getByText('Артефакты:')).toBeTruthy();
  });

  it('renders artifact name as link with correct href and target', () => {
    const artifacts = [
      { name: 'MyForm', url: '/v2/form/123', type: { displayName: 'Form', icon: 'fa-wpforms' } }
    ];

    render(<ArtifactsList artifacts={artifacts} />);

    const link = screen.getByText('MyForm');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/v2/form/123');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('renders artifact type display name', () => {
    const artifacts = [
      { name: 'MyType', url: '/type/1', type: { displayName: 'Data Type', icon: 'fa-database' } }
    ];

    render(<ArtifactsList artifacts={artifacts} />);

    expect(screen.getByText('Data Type')).toBeTruthy();
  });

  it('renders multiple artifacts', () => {
    const artifacts = [
      { name: 'Form1', url: '/form/1', type: { displayName: 'Form', icon: 'fa-wpforms' } },
      { name: 'Type1', url: '/type/1', type: { displayName: 'Data Type', icon: 'fa-database' } },
      { name: 'Process1', url: '/proc/1', type: { displayName: 'BPMN', icon: 'fa-sitemap' } }
    ];

    render(<ArtifactsList artifacts={artifacts} />);

    expect(screen.getByText('Form1')).toBeTruthy();
    expect(screen.getByText('Type1')).toBeTruthy();
    expect(screen.getByText('Process1')).toBeTruthy();
    expect(screen.getByText('Form')).toBeTruthy();
    expect(screen.getByText('Data Type')).toBeTruthy();
    expect(screen.getByText('BPMN')).toBeTruthy();
  });

  it('handles artifacts with missing type gracefully', () => {
    const artifacts = [
      { name: 'NoType', url: '/x' }
    ];

    const { container } = render(<ArtifactsList artifacts={artifacts} />);

    expect(screen.getByText('NoType')).toBeTruthy();
    expect(container.querySelector('.ai-assistant-chat__artifact-type').textContent).toBe('');
  });

  it('handles artifacts with missing type icon gracefully', () => {
    const artifacts = [
      { name: 'NoIcon', url: '/y', type: { displayName: 'Custom' } }
    ];

    render(<ArtifactsList artifacts={artifacts} />);

    expect(screen.getByText('NoIcon')).toBeTruthy();
    expect(screen.getByText('Custom')).toBeTruthy();
  });
});
