import * as queryString from 'query-string';
import { connect } from 'react-redux';

import DMNEditorPage from './DMNEditor';

import { getFormProps, initData, saveModel, setModel, setFormProps, setIsTableView, getModel } from '@/actions/dmnEditor';
import { changeTab } from '@/actions/pageTabs';

const mapStateToProps = (state, props) => {
  const ownState = state.dmnEditor[props.tabId] || {};

  return {
    isMobile: state.view.isMobile,
    title: ownState.title,
    savedModel: ownState.model,
    formProps: ownState.formProps,
    isLoading: ownState.isLoading,
    hasDeployRights: ownState.hasDeployRights,
    isLoadingProps: ownState.isLoadingProps,
    isTableView: ownState.isTableView
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const stateId = props.tabId;
  const record = queryString.parseUrl(window.location.href).query.recordRef;

  return {
    changeTab: tab => dispatch(changeTab(tab)),
    initData: () => dispatch(initData({ stateId, record })),
    saveModel: (xml, img, definitionAction) => dispatch(saveModel({ stateId, record, xml, img, definitionAction })),
    setModel: model => dispatch(setModel({ stateId, model })),
    getModel: () => dispatch(getModel({ stateId, record })),
    setIsTableView: isHidden => dispatch(setIsTableView({ stateId, isHidden })),
    getFormProps: (formId, element) => dispatch(getFormProps({ stateId, formId, element })),
    clearFormProps: () => dispatch(setFormProps({ stateId, formProps: {} }))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(DMNEditorPage);
