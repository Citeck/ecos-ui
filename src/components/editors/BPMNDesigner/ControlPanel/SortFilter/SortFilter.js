import { connect } from 'react-redux';

import { setActiveSortFilter } from '@/actions/bpmn';
import SortFilter from '@/components/editors/DesignerCommon/SortFilter';

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
