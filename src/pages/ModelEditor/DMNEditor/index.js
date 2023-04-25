import { connect } from 'react-redux';
import * as queryString from 'query-string';

import { getFormProps, initData, saveModel, setModel, setFormProps, setIsAnyConfigButtonHidden } from '../../../actions/dmnEditor';
import DMNEditorPage from './DMNEditor';

const mapStateToProps = (state, props) => {
  const ownState = state.dmnEditor[props.tabId] || {};

  return {
    isMobile: state.view.isMobile,
    title: ownState.title,
    savedModel: ownState.model,
    formProps: ownState.formProps,
    isLoading: ownState.isLoading,
    isLoadingProps: ownState.isLoadingProps,
    isAnyConfigButtonHidden: ownState.isAnyConfigButtonHidden
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const stateId = props.tabId;
  const record = queryString.parseUrl(window.location.href).query.recordRef;

  return {
    initData: () => dispatch(initData({ stateId, record })),
    saveModel: (xml, img, deploy) => dispatch(saveModel({ stateId, record, xml, img, deploy })),
    setModel: model => dispatch(setModel({ stateId, model })),
    setIsAnyConfigButtonHidden: isHidden => dispatch(setIsAnyConfigButtonHidden({ stateId, isHidden })),
    getFormProps: (formId, element) => dispatch(getFormProps({ stateId, formId, element })),
    clearFormProps: () => dispatch(setFormProps({ stateId, formProps: {} }))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DMNEditorPage);
