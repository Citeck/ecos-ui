import React from 'react';
import cn from 'classnames';

import DesignerService from '../../../services/DesignerService';
import { t } from '../../../helpers/util';
import UncontrolledTooltip from '../../common/UncontrolledTooltip';

import styles from './ViewSwitcher.module.scss';

const ViewSwitcher = ({ viewType, setViewType, isMobile }) => {
  const viewTypes = DesignerService.getViewPageTypes();

  const renderTooltipList = vt =>
    isMobile ? null : (
      <UncontrolledTooltip target={vt.id} delay={0} placement="top" innerClassName="tooltip-inner-custom" arrowClassName="arrow-custom">
        {t(vt.title)}
      </UncontrolledTooltip>
    );

  return (
    <div className={styles.wrapper}>
      {viewTypes.map(vt => (
        <React.Fragment key={vt.id}>
          <div
            id={vt.id}
            className={cn(vt.icon, styles.item, { [styles.itemActive]: viewType === vt.type })}
            onClick={() => setViewType(vt.type)}
          />
          {renderTooltipList(vt)}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ViewSwitcher;
