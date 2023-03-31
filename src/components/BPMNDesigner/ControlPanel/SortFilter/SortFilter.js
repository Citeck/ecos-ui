import { connect } from 'react-redux';

import { setActiveSortFilter } from '../../../../actions/bpmn';
import SortFilter from '../../../designerCommon/SortFilter';

const mapStateToProps = state => ({
  activeSortFilter: state.bpmn.sortFilter
});

const mapDispatchToProps = dispatch => ({
  setActiveSortFilter: value => dispatch(setActiveSortFilter(value))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SortFilter);
