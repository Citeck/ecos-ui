import React from 'react';
// import { NavLink } from 'react-router-dom';
import { Col } from 'reactstrap';
import cn from 'classnames';
import { IGNORE_TABS_HANDLER_ATTR_NAME } from '../../../constants/pageTabs';
import { t } from '../../../helpers/util';
import styles from './ModelList.module.scss';
import ActionButtons from '../ActionButtons';
import { ViewTypes } from '../../../constants/commonDesigner';

const ModelList = React.memo(({
  label,
  author,
  datetime,
  viewLink,
  onViewLinkClick,
  onEditLinkClick,
  onEditMetaClick,
  onDeleteModelClick,
  canWrite,
  canEditDef
}) => {
  const dragNDropIconClasses = cn('icon-custom-drag-big', styles.dndActionIcon, styles.hiddenIcon);

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
            {t('designer.view-button')}
          </a>
          {canWrite && (
            <ActionButtons
              onDeleteClick={onDeleteModelClick}
              onEditClick={onEditLinkClick}
              onSettingsClick={onEditMetaClick}
              canEditDef={canEditDef}
              viewType={ViewTypes.LIST}
            />
          )}
          <span className={dragNDropIconClasses} />
        </div>
      </div>
    </Col>
  );
});

ModelList.displayName = 'ModelList';

export default ModelList;
