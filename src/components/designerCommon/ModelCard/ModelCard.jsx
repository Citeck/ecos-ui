import cn from 'classnames';
import React, { useMemo } from 'react';
import { Col } from 'reactstrap';

import { t } from '../../../helpers/util';
import BPMNViewer from '../../ModelViewer/BPMNViewer/BPMNViewer';
import ActionButtons from '../ActionButtons';

import styles from './ModelCard.module.scss';

import { ViewTypes } from '@/constants/commonDesigner';
import { IGNORE_TABS_HANDLER_ATTR_NAME } from '@/constants/pageTabs';

const ModelCard = React.memo(
  ({
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
    canWrite,
    canEditDef
  }) => {
    const dragNDropIconClasses = cn('icon-custom-drag-big', styles.dndActionIcon, styles.hiddenIcon);

    // Memoize BPMNViewer instance to prevent recreation on every render
    const designer = new BPMNViewer();

    const cardTopBgStyle = useMemo(() => (image && !definition ? { backgroundImage: `url(${image})` } : null), [image, definition]);

    const renderedDiagram = useMemo(() => {
      if (!designer || !definition) return null;

      return designer.renderSheet({
        diagram: definition,
        zoom: 0.5
      });
    }, [designer, definition]);

    return (
      <Col xl={3} lg={4} md={4} sm={6}>
        <div className={styles.card}>
          <div className={styles.cardTop} style={cardTopBgStyle}>
            {renderedDiagram}
            <div className={styles.cardTopHover}>
              {canWrite && (
                <ActionButtons
                  onDeleteClick={onDeleteModelClick}
                  onEditClick={onEditLinkClick}
                  onSettingsClick={onEditMetaClick}
                  viewType={ViewTypes.CARDS}
                  canEditDef={canEditDef}
                />
              )}
              {onViewLinkClick && (
                <div className={styles.cardTopButton}>
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
  }
);

ModelCard.displayName = 'ModelCard';

export default ModelCard;
