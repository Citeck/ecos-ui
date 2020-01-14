import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { UncontrolledTooltip } from 'reactstrap';
import uniqueId from 'lodash/uniqueId';
import get from 'lodash/get';

import BaseWidget from '../BaseWidget';
import Dashlet from '../../Dashlet/Dashlet';
import { Icon, ResizeBoxes, EcosModal, Search, DefineHeight } from '../../common';
import { Grid } from '../../common/grid';
import { Dropdown } from '../../common/form';
import Tree from './Tree';

import { t, prepareTooltipId, deepClone } from '../../../helpers/util';
import UserLocalSettingsService from '../../../services/userLocalSettings';
import { getDocumentsByType, init, toggleType } from '../../../actions/documents';
import { selectStateByKey } from '../../../selectors/documents';
import { typesStatuses, tooltips, typeStatusesByFields } from '../../../constants/documents';
import { MIN_WIDTH_DASHLET_SMALL } from '../../../constants';

import './style.scss';
import isEmpty from 'lodash/isEmpty';
import { Scrollbars } from 'react-custom-scrollbars';

const LABELS = {
  TITLE: 'Документы',
  SETTINGS: 'Настройка типов документов'
};

class Documents extends BaseWidget {
  constructor(props) {
    super(props);

    UserLocalSettingsService.checkOldData(props.id);

    this.state = {
      leftColumnId: uniqueId('leftColumn_'),
      rightColumnId: uniqueId('rightColumn_'),
      selectedType: '',
      selectedTypeForLoading: '',
      fitHeights: {},
      contentHeight: null,
      width: MIN_WIDTH_DASHLET_SMALL,
      userHeight: UserLocalSettingsService.getDashletHeight(props.id),
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed'),
      isOpenSettings: false,
      isOpenUploadModal: false,
      typesFilter: '',
      tableFilter: ''
    };

    props.init();
  }

  static getDerivedStateFromProps(props, state) {
    if (!props.dynamicTypes.find(item => item.type === state.selectedType)) {
      return { selectedType: '' };
    }

    return null;
  }

  get availableTypes() {
    const { availableTypes } = this.props;
    const { typesFilter } = this.state;

    if (!typesFilter) {
      return availableTypes;
    }

    const check = originTypes => {
      const types = deepClone(originTypes);
      const checkName = type => type.name.toLowerCase().includes(typesFilter);

      return types
        .map(type => {
          if (!type.items.length) {
            if (checkName(type)) {
              return type;
            }

            return null;
          }

          const items = check(type.items);

          if (!items.length) {
            type.items = [];

            return checkName(type) ? type : null;
          }

          return {
            ...type,
            items
          };
        })
        .filter(item => item !== null);
    };

    return check(availableTypes);
  }

  get tableData() {
    const { tableFilter, selectedType } = this.state;
  }

  handleReloadData = () => {};

  handleToggleTypesSettings = event => {
    event.stopPropagation();
    this.setState(state => ({
      isOpenSettings: !state.isOpenSettings,
      typesFilter: ''
    }));
  };

  handleClearSelectedType = () => {
    this.setState({ selectedType: '' });
  };

  handleSelectType = selectedType => {
    if (selectedType === this.state.selectedType) {
      return;
    }

    this.props.getDocuments(selectedType);
    this.setState({ selectedType });
  };

  handleToggleSelectType = ({ id, checked }) => {
    this.props.onToggleType(id, checked);
  };

  handleFilterTypes = (filter = '') => {
    this.setState({ typesFilter: filter.toLowerCase() });
  };

  handleToggleUploadModalByType = (type = null) => {
    this.setState({
      selectedTypeForLoading: type,
      isOpenUploadModal: type !== null
    });
  };

  handleFilterTable = (filter = '') => {
    this.setState({ tableFilter: filter });
  };

  renderTypes() {
    const { dynamicTypes, id } = this.props;
    const { selectedType, leftColumnId, rightColumnId } = this.state;
    const settingsId = prepareTooltipId(`settings-${id}`);

    return (
      <div id={leftColumnId} className="ecos-docs__column ecos-docs__column_types">
        <div className="ecos-docs__types">
          <div
            onClick={this.handleClearSelectedType}
            className={classNames('ecos-docs__types-item', {
              'ecos-docs__types-item_selected': !selectedType
            })}
          >
            <div className="ecos-docs__types-item-label">{t('Все типы')}</div>
            <Icon id={settingsId} className="icon-settings ecos-docs__types-item-settings" onClick={this.handleToggleTypesSettings} />
            <UncontrolledTooltip
              placement="top"
              boundariesElement="window"
              className="ecos-base-tooltip"
              innerClassName="ecos-base-tooltip-inner"
              arrowClassName="ecos-base-tooltip-arrow"
              target={settingsId}
            >
              {tooltips.SETTINGS}
            </UncontrolledTooltip>
          </div>

          {dynamicTypes.map(this.renderType)}
        </div>

        <ResizeBoxes className="ecos-timesheet__resizer" leftId={leftColumnId} rightId={rightColumnId} />
      </div>
    );
  }

  renderType = type => {
    const { id } = this.props;
    const { selectedType } = this.state;
    const target = prepareTooltipId(`${type.id}-${id}`);

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

  renderUploadButton() {
    const { dynamicTypes } = this.props;
    const { selectedType } = this.state;

    if (selectedType) {
      const type = dynamicTypes.find(item => item.type === selectedType);

      return (
        <div className="ecos-docs__panel-upload" onClick={this.handleToggleUploadModalByType.bind(this, type)}>
          <Icon className="icon-load ecos-docs__panel-upload-icon" />
        </div>
      );
    }

    return (
      <Dropdown
        isStatic
        toggleClassName="ecos-docs__panel-upload"
        valueField="type"
        titleField="name"
        source={dynamicTypes}
        onChange={this.handleToggleUploadModalByType}
      >
        <Icon className="icon-load ecos-docs__panel-upload-icon" />
      </Dropdown>
    );
  }

  renderTablePanel() {
    const { selectedType } = this.state;

    return (
      <div className="ecos-docs__panel">
        {this.renderUploadButton()}
        <Search cleaner liveSearch searchWithEmpty onSearch={this.handleFilterTable} className="ecos-docs__modal-settings-search" />
      </div>
    );
  }

  renderTable() {
    const { documents, dynamicTypes } = this.props;
    const { selectedType, rightColumnId } = this.state;
    // let columns = [{ dataField: 'name', text: 'Название' }];
    let columns = [
      { dataField: 'name', text: 'Тип' },
      { dataField: 'loadedBy', text: 'Загрузил' },
      { dataField: 'modified', text: 'Обновлено' }
    ];
    let data = selectedType ? documents : dynamicTypes;

    if (selectedType) {
      columns = [
        { dataField: 'typeName', text: 'Тип' },
        { dataField: 'loadedBy', text: 'Загрузил' },
        { dataField: 'modified', text: 'Обновлено' }
      ];
    }

    return (
      <div id={rightColumnId} className="ecos-docs__column ecos-docs__column_table">
        {this.renderTablePanel()}
        <Grid className="ecos-docs__table" data={data} columns={columns} scrollable />
      </div>
    );
  }

  renderSettings() {
    const { isOpenSettings } = this.state;

    return (
      <EcosModal
        title={t(LABELS.SETTINGS)}
        isOpen={isOpenSettings}
        className="ecos-docs__modal-settings"
        hideModal={this.handleToggleTypesSettings}
        onResize={this.handleResize}
      >
        <Search cleaner liveSearch searchWithEmpty onSearch={this.handleFilterTypes} className="ecos-docs__modal-settings-search" />
        <div className="ecos-docs__modal-settings-field">
          <Tree data={this.availableTypes} toggleSelect={this.handleToggleSelectType} />
        </div>
      </EcosModal>
    );
  }

  renderUploadingModal() {
    const {} = this.props;
    const { selectedTypeForLoading, isOpenUploadModal } = this.state;

    return (
      <EcosModal
        title={get(selectedTypeForLoading, 'name', '')}
        isOpen={isOpenUploadModal}
        className="ecos-docs__modal-upload"
        hideModal={this.handleToggleUploadModalByType.bind(this, null)}
      />
    );
  }

  handleChangeHeight = height => {
    UserLocalSettingsService.setDashletHeight(this.props.id, height);
    this.setState({ userHeight: height });
  };

  render() {
    const { dragHandleProps, canDragging } = this.props;
    const { isCollapsed, contentHeight, fitHeights, userHeight } = this.state;

    return (
      <div>
        <Dashlet
          className="ecos-docs"
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
          <Scrollbars
            style={{ height: contentHeight || '100%' }}
            renderTrackVertical={props => <div {...props} className="ecos-current-task-list__v-scroll" />}
          >
            <DefineHeight
              className="ecos-docs__container"
              fixHeight={userHeight}
              maxHeight={fitHeights.max}
              minHeight={1}
              getOptimalHeight={this.setContentHeight}
            >
              <div className="ecos-docs__body" ref={this.contentRef}>
                {this.renderTypes()}
                {this.renderTable()}
                {this.renderSettings()}
                {this.renderUploadingModal()}
              </div>
            </DefineHeight>
          </Scrollbars>
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
  getDocuments: type => dispatch(getDocumentsByType({ record: ownProps.record, type })),
  onToggleType: (id, checked) => dispatch(toggleType({ record: ownProps.record, id, checked }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Documents);
