import React from 'react';
import { Col } from 'reactstrap';
import cn from 'classnames';
import styles from './ModelCard.module.scss';

class ModelCard extends React.Component {
  render() {
    return (
      <Col md="4">
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <div className={styles.cardTopHover}>
              <div className={cn(styles.cardEditButton, 'icon-edit')} />
              <div className={styles.cardTopButton}>
                <a href="#">Просмотр</a>
              </div>
            </div>
          </div>
          <div className={styles.cardBottom}>
            <p className={styles.label}>Формирование справок</p>
            <p className={styles.author}>admin</p>
            <p className={styles.datetime}>Today at 2:10 PM</p>
          </div>
        </div>
      </Col>
    );
  }
}

export default ModelCard;
