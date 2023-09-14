import { connect } from 'react-redux';

import Search from './Search';
import ViewSwitcher from './ViewSwitcher';
import { createModel, getTotalCount } from '../../../actions/bpmn';

import ControlPanel from '../../designerCommon/ControlPanel';

const mapStateToProps = state => ({
  totalCount: state.bpmn.totalCount,
  isReady: state.bpmn.isReady,
  createVariants: state.bpmn.createVariants,
  SearchComponent: Search,
  ViewSwitcherComponent: ViewSwitcher
});

const mapDispatchToProps = dispatch => ({
  getTotalCount: () => dispatch(getTotalCount()),
  createModel: createVariant => dispatch(createModel({ createVariant }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ControlPanel);
