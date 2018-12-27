import React from 'react';
import { Col } from 'reactstrap';
import cn from 'classnames';
import { t } from '../../../helpers/util';
import styles from './ModelCard.module.scss';

const ModelCard = ({ label, author, datetime, viewLink, editLink, image }) => {
  const dragNDropIconClasses = cn('icon-drag', styles.dndActionIcon, styles.hiddenIcon);

  let cardTopBgStyle = null;
  if (image) {
    cardTopBgStyle = {
      backgroundImage: `url(${image})`
    };
  }

  return (
    <Col xl={3} lg={4} md={4} sm={6}>
      <div className={styles.card}>
        <div className={styles.cardTop} style={cardTopBgStyle}>
          <div className={styles.cardTopHover}>
            <a href={editLink} className={styles.cardEditButton}>
              <span className={'icon-edit'} />
            </a>
            <div className={styles.cardTopButton}>
              <a href={viewLink}>{t('bpmn-designer.view-button')}</a>
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
