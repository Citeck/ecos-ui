import React from 'react';
import { connect } from 'react-redux';
import { UncontrolledTooltip } from 'reactstrap';
import cn from 'classnames';

import { setViewType } from '../../../../actions/bpmn';
import { t } from '../../../../helpers/util';
import { BPMNDesignerService } from '../../../../services/BPMNDesignerService';

import styles from './ViewSwitcher.module.scss';

const mapStateToProps = state => ({
  viewType: state.bpmn.viewType,
  isMobile: state.view.isMobile
});

const mapDispatchToProps = dispatch => ({
  setViewType: type => dispatch(setViewType(type))
});

const ViewSwitcher = ({ viewType, setViewType, isMobile }) => {
  const viewTypes = BPMNDesignerService.getViewPageTypes();
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ViewSwitcher);
