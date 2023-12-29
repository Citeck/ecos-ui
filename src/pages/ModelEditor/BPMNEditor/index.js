import { connect } from 'react-redux';
import * as queryString from 'query-string';

import { getFormProps, initData, saveModel, setFormProps, setModel } from '../../../actions/bpmnEditor';

import BPMNEditorPage from './BPMNEditor';

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
    initData: () => dispatch(initData({ stateId, record })),
    saveModel: (xml, img, definitionAction, processDefId) =>
      dispatch(saveModel({ stateId, record, xml, img, definitionAction, processDefId })),
    setModel: model => dispatch(setModel({ stateId, model })),
    getFormProps: (formId, element) => dispatch(getFormProps({ stateId, formId, element })),
    clearFormProps: () => dispatch(setFormProps({ stateId, formProps: {} }))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BPMNEditorPage);
