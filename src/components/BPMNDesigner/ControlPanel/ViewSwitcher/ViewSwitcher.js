import React from 'react';
import cn from 'classnames';
import styles from './ViewSwitcher.module.scss';

const ViewSwitcher = () => {
  return (
    <div className={styles.wrapper}>
      <div className={cn('icon-tiles', styles.item, { [styles.itemActive]: true })} />
      <div className={cn('icon-list', styles.item)} />
    </div>
  );
};

export default ViewSwitcher;
