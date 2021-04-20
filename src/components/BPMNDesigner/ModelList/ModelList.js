import React from 'react';
// import { NavLink } from 'react-router-dom';
import { Col } from 'reactstrap';
import cn from 'classnames';
import { IGNORE_TABS_HANDLER_ATTR_NAME } from '../../../constants/pageTabs';
import { t } from '../../../helpers/util';
import styles from './ModelList.module.scss';

const ModelList = ({
  label,
  author,
  datetime,
  viewLink,
  editLink,
  onViewLinkClick,
  onEditLinkClick,
  onEditMetaClick,
  onDeleteModelClick,
  canWrite
}) => {
  const dragNDropIconClasses = cn('icon-custom-drag-big', styles.dndActionIcon, styles.hiddenIcon);

  let buttons = [<div key={'empty-actions'} className={styles.emptyActionIcon} />];
  if (canWrite) {
    buttons = [
      <a
        href={'/'}
        key={'delete'}
        className={styles.editActionIcon}
        onClick={onDeleteModelClick}
        {...{ [IGNORE_TABS_HANDLER_ATTR_NAME]: true }}
      >
        <span className={'icon-delete'} />
      </a>,
      <a
        href={'/'}
        key={'settings'}
        className={styles.editActionIcon}
        onClick={onEditMetaClick}
        {...{ [IGNORE_TABS_HANDLER_ATTR_NAME]: true }}
      >
        <span className={'icon-settings'} />
      </a>,
      <a
        href={editLink}
        key={'edit'}
        className={styles.editActionIcon}
        onClick={onEditLinkClick}
        {...{ [IGNORE_TABS_HANDLER_ATTR_NAME]: true }}
      >
        <span className={'icon-edit'} />
      </a>
    ];
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
          <a href={viewLink} onClick={onViewLinkClick} className={styles.viewCard} {...{ [IGNORE_TABS_HANDLER_ATTR_NAME]: true }}>
            {t('bpmn-designer.view-button')}
          </a>
          {buttons}
          <span className={dragNDropIconClasses} />
        </div>
      </div>
    </Col>
  );
};

export default ModelList;
