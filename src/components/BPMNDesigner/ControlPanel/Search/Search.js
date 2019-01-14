import React from 'react';
import { connect } from 'react-redux';
import { setSearchText } from '../../../../actions/bpmn';
import { t } from '../../../../helpers/util';
import styles from './Search.module.scss';

const mapStateToProps = state => ({
  searchText: state.bpmn.searchText
});

const mapDispatchToProps = dispatch => ({
  setSearchText: e => dispatch(setSearchText(e.target.value))
});

const Search = ({ searchText, setSearchText }) => {
  return (
    <div className={styles.search}>
      <label className="icon-search">
        <input type="text" placeholder={t('bpmn-designer.process-models.find')} value={searchText} onChange={setSearchText} />
      </label>
    </div>
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Search);
