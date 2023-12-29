import React from 'react';
import { Provider } from 'react-redux';
import { render } from 'enzyme';
import configureStore from '../../../store';
import { getIncidentsTableColumns, getInstancesTableColumns, getProcessJobDefs } from '../ProcessJournalWidget/VersionTable/constants';
import { ProcessContextProvider } from '../ProcessContext';
import InfoPanel from '../InfoPanel';
import { PROCESS_TABS_TYPES } from '../../../constants/processAdmin';

const initialState = {};

const tableProps = {
  documentJournalId: 'document-journal-id'
};

const renderWithRedux = Component => {
  const store = configureStore(null, { bpmnAdmin: initialState });

  return (
    <Provider store={store}>
      <ProcessContextProvider>
        <Component />
      </ProcessContextProvider>
    </Provider>
  );
};
describe('', () => {
  describe('', () => {
    it('should render InfoPanel component', () => {
      const component = render(renderWithRedux(() => <InfoPanel processId="test-process-id" />));
      expect(component).toMatchSnapshot();
    });

    it('should render corrent columns for instances', () => {
      const columns = getInstancesTableColumns({ ...tableProps, tabId: PROCESS_TABS_TYPES.INSTANCES });
      expect(columns).toMatchSnapshot();
    });

    it('should render corrent columns for incidents', () => {
      const columns = getIncidentsTableColumns({ ...tableProps, tabId: PROCESS_TABS_TYPES.INCIDENTS });
      expect(columns).toMatchSnapshot();
    });

    it('should render corrent columns for job definitions', () => {
      const columns = getProcessJobDefs({ ...tableProps, tabId: PROCESS_TABS_TYPES.JOB_DEFINITIONS });
      expect(columns).toMatchSnapshot();
    });
  });
});
