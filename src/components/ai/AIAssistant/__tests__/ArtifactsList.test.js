import { IGNORE_TABS_HANDLER_ATTR_NAME } from '@citeck/constants/pageTabs';
import React from 'react';
import { render, screen } from '@testing-library/react';
import ArtifactsList from '../components/messages/ArtifactsList';

jest.mock('@/components/common', () => ({
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
    const artifacts = [{ name: 'Test', url: '/test', type: { displayName: 'Form', icon: 'fa-wpforms' } }];

    render(<ArtifactsList artifacts={artifacts} />);

    expect(screen.getByText('ai-assistant.artifacts.title')).toBeTruthy();
  });

  it('renders artifact name as a plain in-app link with correct href', () => {
    const artifacts = [{ name: 'MyForm', url: '/v2/form/123', type: { displayName: 'Form', icon: 'fa-wpforms' } }];

    render(<ArtifactsList artifacts={artifacts} />);

    const link = screen.getByText('MyForm');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/v2/form/123');
    expect(link.getAttribute('target')).toBeNull();
    expect(link.getAttribute('rel')).toBeNull();
  });

  it('renders artifact type display name', () => {
    const artifacts = [{ name: 'MyType', url: '/type/1', type: { displayName: 'Data Type', icon: 'fa-database' } }];

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
    const artifacts = [{ name: 'NoType', url: '/x' }];

    const { container } = render(<ArtifactsList artifacts={artifacts} />);

    expect(screen.getByText('NoType')).toBeTruthy();
    expect(container.querySelector('.ai-assistant-chat__artifact-type').textContent).toBe('');
  });

  it('handles artifacts with missing type icon gracefully', () => {
    const artifacts = [{ name: 'NoIcon', url: '/y', type: { displayName: 'Custom' } }];

    render(<ArtifactsList artifacts={artifacts} />);

    expect(screen.getByText('NoIcon')).toBeTruthy();
    expect(screen.getByText('Custom')).toBeTruthy();
  });

  it('an artifact of this host is a plain in-app anchor the tabs router decides about', () => {
    const artifacts = [{ name: 'Report', url: '/v2/dashboard?recordRef=emodel/report@1&ws=other', type: { displayName: 'Doc' } }];

    render(<ArtifactsList artifacts={artifacts} />);

    const link = screen.getByText('Report');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('target')).toBeNull();
    expect(link.getAttribute(IGNORE_TABS_HANDLER_ATTR_NAME)).toBeNull();
  });

  it('an artifact on another host opens a new browser tab', () => {
    const artifacts = [
      { name: 'Report', url: 'https://other.example.com/v2/dashboard?recordRef=emodel/report@1', type: { displayName: 'Doc' } }
    ];

    render(<ArtifactsList artifacts={artifacts} />);

    expect(screen.getByText('Report').getAttribute('target')).toBe('_blank');
  });
});
