import { connect } from 'react-redux';
import { setSearchText } from '../../../../actions/bpmn';
import Search from '../../../designerCommon/Search';

const mapStateToProps = state => ({
  searchText: state.bpmn.searchText
});

const mapDispatchToProps = dispatch => ({
  setSearchText: e => dispatch(setSearchText(e.target.value))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Search);
