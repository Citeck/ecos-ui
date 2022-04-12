import { connect } from 'react-redux';
import * as queryString from 'query-string';

import { getFormProps, initData, saveModel, saveAndDeployModel, setModel } from '../../../actions/bpmnEditor';

import BPMNEditorPage from './BPMNEditor';

const mapStateToProps = (store, props) => {
  const ownStore = store.bpmnEditor[props.tabId] || {};

  return {
    isMobile: store.view.isMobile,
    title: ownStore.title,
    savedModel: ownStore.model,
    formProps: ownStore.formProps,
    isLoading: ownStore.isLoading
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const stateId = props.tabId;
  const record = queryString.parseUrl(window.location.href).query.recordRef;

  return {
    initData: () => dispatch(initData({ stateId, record })),
    saveModel: (xml, img) => dispatch(saveModel({ stateId, record, xml, img })),
    saveAndDeployModel: (xml, img) => dispatch(saveAndDeployModel({ stateId, record, xml, img })),
    setModel: model => dispatch(setModel({ stateId, model })),
    getFormProps: (formId, element) => dispatch(getFormProps({ stateId, formId, element }))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BPMNEditorPage);
