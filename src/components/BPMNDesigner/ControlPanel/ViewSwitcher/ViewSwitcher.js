import { connect } from 'react-redux';

import { setViewType } from '../../../../actions/bpmn';

import ViewSwitcher from '../../../designerCommon/ViewSwitcher';

const mapStateToProps = state => ({
  viewType: state.bpmn.viewType,
  isMobile: state.view.isMobile
});

const mapDispatchToProps = dispatch => ({
  setViewType: type => dispatch(setViewType(type))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ViewSwitcher);
