import React from 'react';
import { Col } from 'reactstrap';
import cn from 'classnames';
import { IGNORE_TABS_HANDLER_ATTR_NAME } from '../../../constants/pageTabs';
import { t } from '../../../helpers/util';
import styles from './ModelCard.module.scss';
import ActionButtons from '../ActionButtons';
import { ViewTypes } from '../../../constants/commonDesigner';
import BPMNViewer from '../../ModelViewer/BPMNViewer/BPMNViewer';

const ModelCard = ({
  label,
  author,
  datetime,
  viewLink,
  onViewLinkClick,
  onEditLinkClick,
  onEditMetaClick,
  onDeleteModelClick,
  image,
  definition,
  canWrite
}) => {
  const dragNDropIconClasses = cn('icon-custom-drag-big', styles.dndActionIcon, styles.hiddenIcon);
  const designer = new BPMNViewer();

  const cardTopBgStyle =
    image && !definition
      ? {
          backgroundImage: `url(${image})`
        }
      : null;

  return (
    <Col xl={3} lg={4} md={4} sm={6}>
      <div className={styles.card}>
        <div className={styles.cardTop} style={cardTopBgStyle}>
          {designer &&
            designer.renderSheet({
              diagram: definition,
              zoom: 0.5
            })}
          <div className={styles.cardTopHover}>
            {canWrite && (
              <ActionButtons
                onDeleteClick={onDeleteModelClick}
                onEditClick={onEditLinkClick}
                onSettingsClick={onEditMetaClick}
                viewType={ViewTypes.CARDS}
              />
            )}
            {onViewLinkClick && (
              <div className={styles.cardTopButton}>
                {/*<NavLink to={viewLink}>{t('designer.view-button')}</NavLink>*/}
                <a href={viewLink} onClick={onViewLinkClick} {...{ [IGNORE_TABS_HANDLER_ATTR_NAME]: true }}>
                  {t('designer.view-button')}
                </a>
              </div>
            )}
          </div>
        </div>
        <div className={styles.cardBottom}>
          <p className={styles.label} title={label}>
            {label}
          </p>
          <p className={styles.author}>{author}</p>
          <p className={styles.datetime}>{datetime}</p>
          <span className={dragNDropIconClasses} />
        </div>
      </div>
    </Col>
  );
};

export default ModelCard;
