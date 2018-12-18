import React from 'react';
import Search from './Search';
import SortFilter from './SortFilter';
import ViewSwitcher from './ViewSwitcher';
import { Row, Col } from 'reactstrap';
import styles from './ControlPanel.module.scss';

const ControlPanel = () => {
  return (
    <div style={{ marginBottom: 10, marginTop: 40 }}>
      <Row noGutters>
        <Col lg={6} md={12}>
          <Search />
        </Col>
        <Col lg={6} md={12}>
          <div className={styles.rightWrapper}>
            <SortFilter />
            <ViewSwitcher />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ControlPanel;
