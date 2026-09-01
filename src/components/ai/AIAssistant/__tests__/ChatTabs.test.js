import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import ChatTabs from '../components/ChatTabs';
import { TAB_TYPES } from '../constants';

jest.mock('@/components/common', () => ({
  Icon: ({ className }) => <i className={className} data-testid="icon" />
}));

jest.mock('@/helpers/export/util', () => ({
  t: key => key
}));

const STAGES = [
  { key: 'ANALYZING_REQUIREMENTS', label: 'Анализ', progressRange: { min: 0, max: 25 } },
  { key: 'GENERATING_DATA_TYPES', label: 'Тип данных', progressRange: { min: 25, max: 55 } },
  { key: 'GENERATING_FORMS', label: 'Форма', progressRange: { min: 55, max: 75 } },
  { key: 'DEPLOYING_ARTIFACTS', label: 'Развертывание', progressRange: { min: 75, max: 100 } }
];

describe('ChatTabs', () => {
  const baseProps = {
    activeTab: TAB_TYPES.UNIVERSAL,
    onTabChange: jest.fn()
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders nothing when there is no context and no business-app progress', () => {
    const { container } = render(<ChatTabs {...baseProps} hasContext={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the contextual tab when hasContext is set', () => {
    render(<ChatTabs {...baseProps} hasContext contextTitle="Договор" />);
    expect(screen.getByText('Договор')).toBeTruthy();
  });

  it('does not render the stage timeline without generationStages', () => {
    const { container } = render(
      <ChatTabs {...baseProps} businessAppProgress={{ progress: 40 }} generationStages={null} />
    );
    expect(container.querySelector('.ai-assistant-chat__stage-timeline')).toBeNull();
  });

  it('renders the stage timeline when business-app progress and stages are present on the universal tab', () => {
    const { container } = render(
      <ChatTabs {...baseProps} businessAppProgress={{ progress: 40 }} generationStages={STAGES} />
    );
    expect(container.querySelector('.ai-assistant-chat__stage-timeline')).not.toBeNull();
    STAGES.forEach(stage => expect(screen.getByText(stage.label)).toBeTruthy());
  });

  it('hides the timeline on the contextual tab even with progress + stages', () => {
    const { container } = render(
      <ChatTabs
        {...baseProps}
        activeTab={TAB_TYPES.CONTEXTUAL}
        hasContext
        businessAppProgress={{ progress: 40 }}
        generationStages={STAGES}
      />
    );
    expect(container.querySelector('.ai-assistant-chat__stage-timeline')).toBeNull();
  });

  it('gates stage marker status by progress (completed / active / pending)', () => {
    const { container } = render(
      <ChatTabs {...baseProps} businessAppProgress={{ progress: 40 }} generationStages={STAGES} />
    );
    const items = container.querySelectorAll('.ai-assistant-chat__stage-timeline-item');
    expect(items).toHaveLength(STAGES.length);
    // progress 40: range 0-25 done, 25-55 active, 55-75 & 75-100 pending
    expect(items[0].className).toContain('completed');
    expect(items[1].className).toContain('active');
    expect(items[2].className).toContain('pending');
    expect(items[3].className).toContain('pending');
  });

  it('fires onTabChange when the universal tab is clicked', () => {
    render(<ChatTabs {...baseProps} hasContext contextTitle="Договор" />);
    fireEvent.click(screen.getByText('ai-assistant.tabs.universal'));
    expect(baseProps.onTabChange).toHaveBeenCalledWith(TAB_TYPES.UNIVERSAL);
  });
});
