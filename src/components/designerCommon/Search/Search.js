import React from 'react';
import { t } from '../../../helpers/util';
import styles from './Search.module.scss';

const Search = ({ searchText, setSearchText }) => {
  return (
    <div className={styles.search}>
      <label className="icon-search">
        <input type="text" placeholder={t('bpmn-designer.process-models.find')} value={searchText} onChange={setSearchText} />
      </label>
    </div>
  );
};

export default Search;
