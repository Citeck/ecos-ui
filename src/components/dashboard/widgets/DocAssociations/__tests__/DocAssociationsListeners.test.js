import Records from '@citeck/records-core';
import { render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

import DocAssociations from '../DocAssociations';

import { EVENTS } from '@/components/dashboard/widgets/BaseWidget';

jest.mock('../AssociationGrid', () => () => null);
jest.mock('@/components/common/form/SelectJournal', () => () => null);
jest.mock('@/components/forms/EcosForm/FormManager', () => ({}));

// Records.get(ref) is a global cache: the record (and its EventEmitter) outlives every widget
// mounted on it, so a listener that is never removed piles up on each re-open (COREDEV-522).
describe('DocAssociations record event listeners', () => {
  const record = 'emodel/doc@doc-associations-listeners';
  const store = configureStore()({ view: { isMobile: false }, app: { dashboardEditable: false }, docAssociations: {} });
  const mount = () =>
    render(
      <Provider store={store}>
        <DocAssociations id="widget-1" record={record} tabId="tab-1" dashboardId="dash-1" />
      </Provider>
    );
  const count = () => Records.get(record).events.listenerCount(EVENTS.UPDATE_ASSOCIATIONS);

  it('listens while mounted and stops listening on unmount', () => {
    expect(count()).toBe(0);

    const wrapper = mount();
    expect(count()).toBe(1);

    wrapper.unmount();
    expect(count()).toBe(0);
  });

  it('does not pile up listeners when the same record is opened again and again', () => {
    for (let i = 0; i < 5; i++) {
      mount().unmount();
    }

    expect(count()).toBe(0);
  });
});
