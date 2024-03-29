import { connect } from 'react-redux';
import get from 'lodash/get';

import Search from './Search';
import ViewSwitcher from './ViewSwitcher';
import { createModel } from '../../../actions/dmn';
import { selectCanCreateDef } from '../../../selectors/dmn';

import ControlPanel from '../../designerCommon/ControlPanel';

const mapStateToProps = state => ({
  totalCount: get(state, 'dmn.models.length', 0),
  isReady: state.dmn.isReady,
  createVariants: state.dmn.createVariants,
  canCreateDef: selectCanCreateDef(state),
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
