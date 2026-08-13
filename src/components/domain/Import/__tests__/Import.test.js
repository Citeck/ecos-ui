// `FormManager` pulls in EcosForm and with it the record actions, which sit in an import cycle whose
// members instantiate each other at module scope. Import only uses it to open the import dialog, so
// stubbing it keeps the cycle out of this test.
jest.mock('@/components/forms/EcosForm/FormManager', () => ({ __esModule: true, default: { createRecordByVariant: () => {} } }));

jest.mock('@citeck/records-core', () => ({
  __esModule: true,
  default: {
    query: () => Promise.resolve({ records: [{ variantId: 'v1', name: 'Variant', allowedFor: [] }] }),
    get: () => ({ load: () => Promise.resolve([]) })
  }
}));

import { act, render, waitFor } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

import Import from '../Import';

import Tooltip from '@/components/common/Tooltip';

const renderImport = (props, wrap = children => children) =>
  render(
    <Provider store={configureStore([])({ journals: { 'journal-state': { journalConfig: { typeRef: 'emodel/type@x' } } } })}>
      {wrap(<Import stateId="journal-state" {...props} />)}
    </Provider>
  );

describe('<Import />', () => {
  // The journal settings bar hangs a Tooltip on this id, and a tooltip whose target is missing from
  // the DOM never opens — which is what the button had instead of a hint (COREDEV-408).
  it('should put the id it is given on its root element', async () => {
    const { container } = renderImport({ id: 'journal-import' });

    await waitFor(() => expect(container.querySelector('.citeck-import-data')).not.toBeNull());

    expect(container.querySelector('#journal-import')).toBe(container.querySelector('.citeck-import-data'));
  });

  it('should render without an id', async () => {
    const { container } = renderImport();

    await waitFor(() => expect(container.querySelector('.citeck-import-data')).not.toBeNull());

    expect(container.querySelector('.citeck-import-data').getAttribute('id')).toBeNull();
  });

  // The whole point of the id: the button renders only once its variants have arrived, long after the
  // tooltip around it has mounted, and the hint has to work all the same (COREDEV-408).
  it('should show the tooltip wrapped around it once its button has appeared', async () => {
    const { container } = renderImport({ id: 'journal-import' }, children => (
      <Tooltip target="journal-import" text="Импорт" uncontrolled>
        {children}
      </Tooltip>
    ));

    await waitFor(() => expect(container.querySelector('#journal-import')).not.toBeNull());

    await act(async () => {
      container.querySelector('#journal-import').dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(document.querySelector('[role="tooltip"]')).not.toBeNull();
    expect(document.querySelector('[role="tooltip"]').textContent).toEqual('Импорт');
  });
});
