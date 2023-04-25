import { connect } from 'react-redux';

import Search from './Search';
import ViewSwitcher from './ViewSwitcher';
import { createModel } from '../../../actions/bpmn';

import ControlPanel from '../../designerCommon/ControlPanel';

const mapStateToProps = state => ({
  totalModels: state.bpmn.models.length,
  isReady: state.bpmn.isReady,
  createVariants: state.bpmn.createVariants,
  SearchComponent: Search,
  ViewSwitcherComponent: ViewSwitcher
});

const mapDispatchToProps = dispatch => ({
  createModel: createVariant => dispatch(createModel({ createVariant }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ControlPanel);
