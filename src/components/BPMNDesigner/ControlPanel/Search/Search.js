import React from 'react';
import { setSearchText } from '../../../../actions/bpmn';
import { t } from '../../../../helpers/util';
import styles from './Search.module.scss';
import connect from 'react-redux/es/connect/connect';

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
