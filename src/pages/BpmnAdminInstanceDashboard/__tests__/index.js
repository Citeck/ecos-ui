import React from 'react';
import { Provider } from 'react-redux';
import { render } from 'enzyme';
import configureStore from '../../../store';
import {
  getCalledProcessesColumns,
  getExternalTasksColumns,
  getIncidentsColumns,
  getJobDefinitionsColumns,
  getVariableColumns
} from '../JournalsTabs/columns';
import { INSTANCE_TABS_TYPES } from '../../../constants/instanceAdmin';
import { InstanceContextProvider } from '../InstanceContext';
import MetaInfo from '../MetaInfo';

const initialState = {};

const tableProps = {
  instanceId: 'test-instance-id',
  actions: []
};

const renderWithRedux = Component => {
  const store = configureStore(null, { bpmnAdmin: initialState });

  return (
    <Provider store={store}>
      <InstanceContextProvider>
        <Component />
      </InstanceContextProvider>
    </Provider>
  );
};
describe('', () => {
  describe('', () => {
    it('should render MetaInfo component', () => {
      const component = render(renderWithRedux(() => <MetaInfo instanceId="test-instance-id" />));
      expect(component).toMatchSnapshot();
    });

    it('should render corrent columns for variables', () => {
      const columns = getVariableColumns({ ...tableProps, tabId: INSTANCE_TABS_TYPES.VARIABLES });
      expect(columns).toMatchSnapshot();
    });

    it('should render corrent columns for incidents', () => {
      const columns = getIncidentsColumns({ ...tableProps, tabId: INSTANCE_TABS_TYPES.INCIDENTS });
      expect(columns).toMatchSnapshot();
    });

    it('should render corrent columns for called processes', () => {
      const columns = getCalledProcessesColumns({ ...tableProps, tabId: INSTANCE_TABS_TYPES.CALLED_PROCESS });
      expect(columns).toMatchSnapshot();
    });

    it('should render corrent columns for job definitions', () => {
      const columns = getJobDefinitionsColumns({ ...tableProps, tabId: INSTANCE_TABS_TYPES.JOB_DEFINITIONS });
      expect(columns).toMatchSnapshot();
    });

    it('should render corrent columns for external tasks', () => {
      const columns = getExternalTasksColumns({ ...tableProps, tabId: INSTANCE_TABS_TYPES.EXTERNAL_TASKS });
      expect(columns).toMatchSnapshot();
    });
  });
});
