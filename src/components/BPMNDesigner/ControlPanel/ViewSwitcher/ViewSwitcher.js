import React from 'react';
import { connect } from 'react-redux';
import { UncontrolledTooltip } from 'reactstrap';
import { VIEW_TYPE_LIST, VIEW_TYPE_CARDS } from '../../../../constants/bpmn';
import { setViewType } from '../../../../actions/bpmn';
import { t } from '../../../../helpers/util';
import cn from 'classnames';
import styles from './ViewSwitcher.module.scss';

const mapStateToProps = state => ({
  viewType: state.bpmn.viewType,
  isMobile: state.view.isMobile
});

const mapDispatchToProps = dispatch => ({
  setCardViewType: () => dispatch(setViewType(VIEW_TYPE_CARDS)),
  setListViewType: () => dispatch(setViewType(VIEW_TYPE_LIST))
});

const ViewSwitcher = ({ viewType, setCardViewType, setListViewType, isMobile }) => {
  const tooltipCards = isMobile ? null : (
    <UncontrolledTooltip
      target="bpmn-view-switcher-cards"
      delay={0}
      placement="top"
      innerClassName="tooltip-inner-custom"
      arrowClassName="arrow-custom"
    >
      {t('bpmn-designer.view-mode.cards')}
    </UncontrolledTooltip>
  );

  const tooltipList = isMobile ? null : (
    <UncontrolledTooltip
      target="bpmn-view-switcher-list"
      delay={0}
      placement="top"
      innerClassName="tooltip-inner-custom"
      arrowClassName="arrow-custom"
    >
      {t('bpmn-designer.view-mode.list')}
    </UncontrolledTooltip>
  );

  return (
    <div className={styles.wrapper}>
      <div
        id="bpmn-view-switcher-cards"
        className={cn('icon-tiles', styles.item, { [styles.itemActive]: viewType === VIEW_TYPE_CARDS })}
        onClick={setCardViewType}
      />
      {tooltipCards}

      <div
        id="bpmn-view-switcher-list"
        className={cn('icon-list', styles.item, { [styles.itemActive]: viewType === VIEW_TYPE_LIST })}
        onClick={setListViewType}
      />
      {tooltipList}
    </div>
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ViewSwitcher);
