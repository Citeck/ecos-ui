import { connect } from 'react-redux';

import { getFormProps, initData, saveScenario, setScenario } from '../../../actions/cmmnEditor';

import CMMNEditorPage from './CMMNEditor';

const mapStateToProps = store => {
  const ownStore = store.cmmnEditor[CMMNEditorPage.getStateId()] || {};

  return {
    isMobile: store.view.isMobile,
    title: ownStore.title,
    savedModel: ownStore.scenario,
    formProps: ownStore.formProps,
    isLoading: ownStore.isLoading
  };
};

const mapDispatchToProps = dispatch => ({
  initData: (stateId, record) => dispatch(initData({ stateId, record })),
  saveModel: (stateId, record, xml, img) => dispatch(saveScenario({ stateId, record, xml, img })),
  setModel: (stateId, scenario) => dispatch(setScenario({ stateId, scenario })),
  getFormProps: (stateId, formId, element) => dispatch(getFormProps({ stateId, formId, element }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CMMNEditorPage);
