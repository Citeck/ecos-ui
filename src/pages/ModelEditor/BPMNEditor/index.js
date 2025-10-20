import * as queryString from 'query-string';
import { connect } from 'react-redux';

import BPMNEditorPage from './BPMNEditor';

import { getFormProps, getModel, initData, saveModel, setFormProps, setModel } from '@/actions/bpmnEditor';
import { changeTab } from '@/actions/pageTabs';

const mapStateToProps = (store, props) => {
  const ownStore = store.bpmnEditor[props.tabId] || {};

  return {
    isMobile: store.view.isMobile,
    title: ownStore.title,
    savedModel: ownStore.model,
    sectionPath: ownStore.sectionPath,
    hasDeployRights: ownStore.hasDeployRights,
    formProps: ownStore.formProps,
    isLoading: ownStore.isLoading,
    isLoadingProps: ownStore.isLoadingProps
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const stateId = props.tabId;
  const record = queryString.parseUrl(window.location.href).query.recordRef;

  return {
    changeTab: tab => dispatch(changeTab(tab)),
    initData: () => dispatch(initData({ stateId, record })),
    saveModel: (xml, img, definitionAction, processDefId) =>
      dispatch(saveModel({ stateId, record, xml, img, definitionAction, processDefId })),
    setModel: model => dispatch(setModel({ stateId, model })),
    getModel: () => dispatch(getModel({ stateId, record })),
    getFormProps: (formId, element, cacheLabels) => dispatch(getFormProps({ stateId, formId, element, cacheLabels })),
    clearFormProps: () => dispatch(setFormProps({ stateId, formProps: {} }))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(BPMNEditorPage);
