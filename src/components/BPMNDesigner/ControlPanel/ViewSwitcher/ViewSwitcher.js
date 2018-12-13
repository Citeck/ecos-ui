import React from 'react';
import { UncontrolledTooltip } from 'reactstrap';
import cn from 'classnames';
import styles from './ViewSwitcher.module.scss';

const ViewSwitcher = () => {
  return (
    <div className={styles.wrapper}>
      <div id="bpmn-view-switcher-cards" className={cn('icon-tiles', styles.item, { [styles.itemActive]: true })} />
      <UncontrolledTooltip
        target="bpmn-view-switcher-cards"
        delay={0}
        placement="top"
        innerClassName="tooltip-inner-custom"
        arrowClassName="arrow-custom"
      >
        Плитка
      </UncontrolledTooltip>

      <div id="bpmn-view-switcher-list" className={cn('icon-list', styles.item)} />
      <UncontrolledTooltip
        target="bpmn-view-switcher-list"
        delay={0}
        placement="top"
        innerClassName="tooltip-inner-custom"
        arrowClassName="arrow-custom"
      >
        Список
      </UncontrolledTooltip>
    </div>
  );
};

export default ViewSwitcher;
