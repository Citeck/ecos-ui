import React from 'react';
import { Col } from 'reactstrap';
import cn from 'classnames';
import { IGNORE_TABS_HANDLER_ATTR_NAME } from '../../../constants/pageTabs';
import { t } from '../../../helpers/util';
import styles from './ModelCard.module.scss';

const ModelCard = ({
  label,
  author,
  datetime,
  viewLink,
  editLink,
  onViewLinkClick,
  onEditLinkClick,
  onEditMetaClick,
  onDeleteModelClick,
  image,
  canWrite
}) => {
  const dragNDropIconClasses = cn('icon-custom-drag-big', styles.dndActionIcon, styles.hiddenIcon);

  let cardTopBgStyle = null;
  if (image) {
    cardTopBgStyle = {
      backgroundImage: `url(${image})`
    };
  }

  let buttons = [];
  if (canWrite) {
    buttons.push(
      <a
        href={'/'}
        key={'deleteModelButton'}
        className={styles.cardDeleteModelButton}
        onClick={onDeleteModelClick}
        {...{ [IGNORE_TABS_HANDLER_ATTR_NAME]: true }}
      >
        <span className={'icon-delete'} />
      </a>
    );
    buttons.push(
      <a
        href={'/'}
        key={'editMetaButton'}
        className={styles.cardEditMetaButton}
        onClick={onEditMetaClick}
        {...{ [IGNORE_TABS_HANDLER_ATTR_NAME]: true }}
      >
        <span className={'icon-settings'} />
      </a>
    );
    buttons.push(
      <a
        href={editLink}
        key={'editButton'}
        className={styles.cardEditButton}
        onClick={onEditLinkClick}
        {...{ [IGNORE_TABS_HANDLER_ATTR_NAME]: true }}
      >
        <span className={'icon-edit'} />
      </a>
    );
  }

  return (
    <Col xl={3} lg={4} md={4} sm={6}>
      <div className={styles.card}>
        <div className={styles.cardTop} style={cardTopBgStyle}>
          <div className={styles.cardTopHover}>
            {buttons}
            <div className={styles.cardTopButton}>
              {/*<NavLink to={viewLink}>{t('bpmn-designer.view-button')}</NavLink>*/}
              <a href={viewLink} onClick={onViewLinkClick} {...{ [IGNORE_TABS_HANDLER_ATTR_NAME]: true }}>
                {t('bpmn-designer.view-button')}
              </a>
            </div>
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
