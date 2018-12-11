import React from 'react';
import styles from './Search.module.scss';

const Search = () => {
  return (
    <div className={styles.search}>
      <label>
        <i className="fa fa-search" />
        <input type="text" placeholder="Найти процесс" />
      </label>
    </div>
  );
};

export default Search;
