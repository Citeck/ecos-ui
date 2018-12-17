import React from 'react';
import { connect } from 'react-redux';
import { UncontrolledTooltip } from 'reactstrap';
import { ViewTypeList, ViewTypeCards } from '../../../../constants/bpmn';
import cn from 'classnames';
import styles from './ViewSwitcher.module.scss';
import { setViewType } from '../../../../actions/bpmn';

const mapStateToProps = state => ({
  viewType: state.bpmn.viewType
});

const mapDispatchToProps = dispatch => ({
  setCardViewType: () => dispatch(setViewType(ViewTypeCards)),
  setListViewType: () => dispatch(setViewType(ViewTypeList))
});

const ViewSwitcher = ({ viewType, setCardViewType, setListViewType }) => {
  return (
    <div className={styles.wrapper}>
      <div
        id="bpmn-view-switcher-cards"
        className={cn('icon-tiles', styles.item, { [styles.itemActive]: viewType === ViewTypeCards })}
        onClick={setCardViewType}
      />
      <UncontrolledTooltip
        target="bpmn-view-switcher-cards"
        delay={0}
        placement="top"
        innerClassName="tooltip-inner-custom"
        arrowClassName="arrow-custom"
      >
        Плитка
      </UncontrolledTooltip>

      <div
        id="bpmn-view-switcher-list"
        className={cn('icon-list', styles.item, { [styles.itemActive]: viewType === ViewTypeList })}
        onClick={setListViewType}
      />
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ViewSwitcher);
