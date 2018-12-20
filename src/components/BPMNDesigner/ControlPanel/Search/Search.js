import React from 'react';
import { t } from '../../../../helpers/util';
import styles from './Search.module.scss';

const Search = () => {
  return (
    <div className={styles.search}>
      <label className="icon-search">
        <input type="text" placeholder={t('bpmn-designer.process-models.find')} />
      </label>
    </div>
  );
};

export default Search;
