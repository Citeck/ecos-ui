import * as queryString from 'query-string';
import { connect } from 'react-redux';

import CMMNEditorPage from './CMMNEditor';

import { getFormProps, initData, saveScenario, setScenario } from '@/actions/cmmnEditor';
import { changeTab } from '@/actions/pageTabs';

const mapStateToProps = (store, props) => {
  const ownStore = store.cmmnEditor[props.tabId] || {};

  return {
    isMobile: store.view.isMobile,
    title: ownStore.title,
    savedModel: ownStore.scenario,
    formProps: ownStore.formProps,
    isLoading: ownStore.isLoading
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const stateId = props.tabId;
  const record = queryString.parseUrl(window.location.href).query.recordRef;

  return {
    changeTab: tab => dispatch(changeTab(tab)),
    initData: () => dispatch(initData({ stateId, record })),
    saveModel: (xml, img) => dispatch(saveScenario({ stateId, record, xml, img })),
    setModel: scenario => dispatch(setScenario({ stateId, scenario })),
    getFormProps: (formId, element) => dispatch(getFormProps({ stateId, formId, element }))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(CMMNEditorPage);
