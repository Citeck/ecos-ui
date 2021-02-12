import { connect } from 'react-redux';

import { getFormProps, initData, saveModel, setModel } from '../../../actions/bpmnEditor';

import BPMNEditorPage from './BPMNEditor';

const mapStateToProps = store => {
  const ownStore = store.bpmnEditor[BPMNEditorPage.getStateId()] || {};

  return {
    isMobile: store.view.isMobile,
    title: ownStore.title,
    savedModel: ownStore.model,
    formProps: ownStore.formProps,
    isLoading: ownStore.isLoading
  };
};

const mapDispatchToProps = dispatch => ({
  initData: (stateId, record) => dispatch(initData({ stateId, record })),
  saveModel: (stateId, record, xml, img) => dispatch(saveModel({ stateId, record, xml, img })),
  setModel: (stateId, scenario) => dispatch(setModel({ stateId, scenario })),
  getFormProps: (stateId, formId, element) => dispatch(getFormProps({ stateId, formId, element }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BPMNEditorPage);
