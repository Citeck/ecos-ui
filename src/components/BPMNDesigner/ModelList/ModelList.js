import React from 'react';
import { Col } from 'reactstrap';
import cn from 'classnames';
import styles from './ModelList.module.scss';

const ModelCard = () => {
  const dragNDropIconClasses = cn('icon-drag', styles.dndActionIcon);
  const editIconClasses = cn('icon-edit', styles.editActionIcon);

  return (
    <Col xs={12} className={styles.itemWrapper}>
      <div className={styles.item}>
        <div className={styles.leftPart}>
          <p className={styles.label}>Название модели</p>
          <p className={styles.authorAndDatetime}>
            <span className={styles.author}>admin</span>
            <span className={styles.datetime}>Today at 2:10 PM</span>
          </p>
        </div>

        <div className={styles.actions}>
          <a href="#" className={styles.viewCard}>
            Просмотр
          </a>

          <span className={editIconClasses} />
          <span className={dragNDropIconClasses} />
        </div>
      </div>
    </Col>
  );
};

export default ModelCard;
