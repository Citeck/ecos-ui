import { connect } from 'react-redux';
import CommonBar from '../CommonBar';

function mapStateToProps(state) {
  return {
    noPagination: true,
    noCreateBtn: true,
    journalConfig: {},
    grid: {},
    isFilterOn: {},
    settingsData: {},
    settingsFiltersData: {},
    settingsColumnsData: {},
    settingsGroupingData: {}
  };
}

function mapDispatchToProps(dispatch) {
  return {
    applySettings: _ => _,
    resetFiltering: _ => _,
    reloadGrid: _ => _,
    clearSearch: _ => _,
    runSearch: _ => _
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CommonBar);
