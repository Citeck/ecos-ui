import { connect } from 'react-redux';

import Search from './Search';
import ViewSwitcher from './ViewSwitcher';
import { createModel } from '../../../actions/dmn';

import ControlPanel from '../../designerCommon/ControlPanel';

const mapStateToProps = state => ({
  totalModels: state.dmn.models.length,
  isReady: state.dmn.isReady,
  createVariants: state.dmn.createVariants,
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
