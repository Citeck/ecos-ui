import { render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

import Header from '@/components/dashboard/Dashlet/Header';

const store = () =>
  configureStore([])({
    view: { isMobile: false },
    app: { widgetEditable: false, appEdition: 'enterprise' },
    user: { isAdmin: false }
  });

const renderHeader = props => {
  const { container } = render(
    <Provider store={store()}>
      <Header title="Категории" measurer={{}} noActions {...props} />
    </Provider>
  );

  return container.querySelector('.dashlet__caption');
};

/**
 * With `disableCollapse` the header does not render the chevron, so the title used to start 7px
 * from the widget's outer edge (6px header padding + 1px panel border) while every other widget's
 * title started where its body content does. The modifier puts the missing inset back
 * (COREDEV-482); the chevron itself provides it in the collapsible case, so the modifier must not
 * appear there or the title would shift right.
 */
describe('Dashlet header caption inset for non-collapsible widgets', () => {
  it('marks the caption when there is no collapser', () => {
    const caption = renderHeader({ disableCollapse: true });

    expect(caption).not.toBeNull();
    expect(caption.classList.contains('dashlet__caption_no-collapser')).toBe(true);
    expect(caption.querySelector('.dashlet__caption-collapser')).toBeNull();
  });

  it('leaves the caption unmarked when the collapser is rendered', () => {
    const caption = renderHeader();

    expect(caption).not.toBeNull();
    expect(caption.classList.contains('dashlet__caption_no-collapser')).toBe(false);
    expect(caption.querySelector('.dashlet__caption-collapser')).not.toBeNull();
  });

  it('keeps a custom titleClassName alongside the modifier', () => {
    const caption = renderHeader({ disableCollapse: true, titleClassName: 'my-title' });

    expect(caption.classList.contains('my-title')).toBe(true);
    expect(caption.classList.contains('dashlet__caption_no-collapser')).toBe(true);
  });
});
