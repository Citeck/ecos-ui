import React from 'react';
// import { NavLink } from 'react-router-dom';
import { Col } from 'reactstrap';
import cn from 'classnames';
import { t } from '../../../helpers/util';
import styles from './ModelList.module.scss';

const ModelList = ({ label, author, datetime, viewLink, editLink, onViewLinkClick, onEditLinkClick, canWrite }) => {
  const dragNDropIconClasses = cn('icon-drag', styles.dndActionIcon, styles.hiddenIcon);

  let editButton = <div className={styles.emptyActionIcon} />;
  if (canWrite) {
    editButton = (
      <a href={editLink} className={styles.editActionIcon} onClick={onEditLinkClick}>
        <span className={'icon-edit'} />
      </a>
    );
  }

  return (
    <Col xs={12} className={styles.itemWrapper}>
      <div className={styles.item}>
        <div className={styles.leftPart}>
          <p className={styles.label}>{label}</p>
          <p className={styles.authorAndDatetime}>
            <span className={styles.author}>{author}</span>
            <span className={styles.datetime}>{datetime}</span>
          </p>
        </div>

        <div className={styles.actions}>
          {/*<NavLink to={viewLink} className={styles.viewCard}>*/}
          {/*{t('bpmn-designer.view-button')}*/}
          {/*</NavLink>*/}
          <a href={viewLink} onClick={onViewLinkClick} className={styles.viewCard}>
            {t('bpmn-designer.view-button')}
          </a>
          {editButton}
          <span className={dragNDropIconClasses} />
        </div>
      </div>
    </Col>
  );
};

export default ModelList;
