import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { UncontrolledTooltip } from 'reactstrap';

import BaseWidget from '../BaseWidget';
import Dashlet from '../../Dashlet/Dashlet';
import { Icon } from '../../common';
import { Grid } from '../../common/grid';

import { t } from '../../../helpers/util';
import UserLocalSettingsService from '../../../services/userLocalSettings';
import { getDocumentsByType, init } from '../../../actions/documents';
import { selectStateByKey } from '../../../selectors/documents';
import { typesStatuses } from '../../../constants/documents';

import { MIN_WIDTH_DASHLET_SMALL } from '../../../constants';
import './style.scss';

const LABELS = {
  TITLE: 'Документы'
};

class Documents extends BaseWidget {
  constructor(props) {
    super(props);

    UserLocalSettingsService.checkOldData(props.id);

    this.state = {
      selectedType: '',
      fitHeights: {},
      contentHeight: null,
      width: MIN_WIDTH_DASHLET_SMALL,
      userHeight: UserLocalSettingsService.getDashletHeight(props.id),
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed')
    };

    props.init();
  }

  handleReloadData = () => {};

  handleToggleTypesSettings = () => {};

  handleClearSelectedType = () => {
    this.setState({ selectedType: '' });
  };

  handleSelectType = selectedType => {
    this.props.getDocuments(selectedType);
    this.setState({ selectedType });
  };

  renderTypes() {
    const { dynamicTypes } = this.props;
    const { selectedType } = this.state;

    return (
      <div className="ecos-docs__types">
        <div
          onClick={this.handleClearSelectedType}
          className={classNames('ecos-docs__types-item', {
            'ecos-docs__types-item_selected': !selectedType
          })}
        >
          <div className="ecos-docs__types-item-label">{t('Все типы')}</div>
          <div className="ecos-docs__types-item-settings" onClick={this.handleToggleTypesSettings} />
        </div>

        {dynamicTypes.map(this.renderType)}
      </div>
    );
  }

  renderType = type => {
    const { id } = this.props;
    const { selectedType } = this.state;
    const target = `${type.id}-${id}`.replace(/[^\d\w-]/g, '');

    let status = typesStatuses.CAN_ADD_FILES;

    if (type.countDocuments === 1) {
      status = typesStatuses.FILE_ADDED;
    }

    if (type.countDocuments > 1) {
      status = typesStatuses.MULTI_FILES_ADDED;
    }

    if (type.mandatory && !type.countDocuments) {
      status = typesStatuses.NEED_ADD_FILES;
    }

    return (
      <div
        key={type.id}
        onClick={() => this.handleSelectType(type.type)}
        className={classNames('ecos-docs__types-item', {
          'ecos-docs__types-item_selected': selectedType === type.type
        })}
      >
        <div className="ecos-docs__types-item-label">{t(type.name)}</div>
        <div
          id={target}
          className={classNames('ecos-docs__types-item-status', {
            'ecos-docs__types-item-status_files-need': !type.countDocuments && type.mandatory,
            'ecos-docs__types-item-status_files-can': !type.countDocuments && !type.mandatory
          })}
        >
          <Icon
            className={classNames('ecos-docs__types-item-status-icon', {
              'icon-check': type.countDocuments,
              'icon-close': !type.countDocuments
            })}
          />
          <div className="ecos-docs__types-item-status-counter">{type.countDocuments}</div>
        </div>
        <UncontrolledTooltip
          placement="top"
          boundariesElement="window"
          className="ecos-base-tooltip"
          innerClassName="ecos-base-tooltip-inner"
          arrowClassName="ecos-base-tooltip-arrow"
          target={target}
        >
          {status}
        </UncontrolledTooltip>
      </div>
    );
  };

  renderTable() {
    const { documents, dynamicTypes } = this.props;
    const { selectedType } = this.state;
    let columns = [];
    let data = selectedType ? documents : dynamicTypes;

    if (selectedType) {
      columns = [
        { dataField: 'typeName', text: 'Тип' },
        { dataField: 'loadedBy', text: 'Загрузил' },
        { dataField: 'modified', text: 'Обновлено' }
      ];
    } else {
      columns = [{ dataField: 'name', text: 'Название' }];
    }

    return <Grid className="ecos-docs__table" data={data} columns={columns} scrollable />;
  }

  render() {
    const { dragHandleProps, canDragging } = this.props;
    const { isCollapsed } = this.state;

    return (
      <div>
        <Dashlet
          title={t(LABELS.TITLE)}
          needGoTo={false}
          actionEdit={false}
          actionHelp={false}
          canDragging={canDragging}
          resizable
          contentMaxHeight={this.clientHeight}
          onReload={this.handleReloadData}
          onResize={this.handleResize}
          dragHandleProps={dragHandleProps}
          onChangeHeight={this.handleChangeHeight}
          getFitHeights={this.setFitHeights}
          onToggleCollapse={this.handleToggleContent}
          isCollapsed={isCollapsed}
        >
          <div className="ecos-docs">
            {this.renderTypes()}
            {this.renderTable()}
          </div>
        </Dashlet>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  ...selectStateByKey(state, ownProps.record),
  isMobile: state.view.isMobile
});
const mapDispatchToProps = (dispatch, ownProps) => ({
  init: () => dispatch(init(ownProps.record)),
  getDocuments: type => dispatch(getDocumentsByType({ record: ownProps.record, type }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Documents);
