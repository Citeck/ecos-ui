import React from 'react';
import styles from './Search.module.scss';

const Search = () => {
  return (
    <div className={styles.search}>
      <label className="icon-search">
        <input type="text" placeholder="Найти процесс" />
      </label>
    </div>
  );
};

export default Search;
