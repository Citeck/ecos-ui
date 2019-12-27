import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

import BaseWidget from '../BaseWidget';
import Dashlet from '../../Dashlet/Dashlet';
import { t } from '../../../helpers/util';
import UserLocalSettingsService from '../../../services/userLocalSettings';
import { MIN_WIDTH_DASHLET_SMALL } from '../../../constants';
import { getDocumentsByType, init } from '../../../actions/documents';
import { selectStateByKey } from '../../../selectors/documents';
import { typesStatuses } from '../../../constants/documents';

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

  handleClickType = () => {};

  handleToggleTypesSettings = () => {};

  handleClearSelectedType = () => {};

  handleSelectType = type => {
    this.props.getDocuments(type);
  };

  renderTypes() {
    const { selectedType } = this.state;
    const types = [
      {
        id: 0,
        name: 'Вложения заявки на коммандировку',
        status: typesStatuses.MULTI_FILES_ADDED.KEY,
        countFiles: 3
      },
      {
        id: 1,
        name: 'Счёт',
        status: typesStatuses.NEED_ADD_FILES.KEY,
        countFiles: 0
      },
      {
        id: 2,
        name: 'Отсканированный документ',
        status: typesStatuses.CAN_ADD_FILES.KEY,
        countFiles: 0
      }
    ];

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

        {types.map(this.renderType)}
      </div>
    );
  }

  renderType = type => {
    const { dynamicTypes } = this.props;
    const { selectedType } = this.state;

    // console.warn('dynamicTypes => ', dynamicTypes);

    return (
      <div
        key={type.id}
        onClick={() => this.handleSelectType(type.id)}
        className={classNames('ecos-docs__types-item', {
          'ecos-docs__types-item_selected': selectedType === type.id
        })}
      >
        <div className="ecos-docs__types-item-label">{t(type.name)}</div>
        <div className={classNames('ecos-docs__types-item-status', `ecos-docs__types-item-status_${type.status}`)}>{type.countFiles}</div>
      </div>
    );
  };

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
            <div className="ecos-docs__table" />
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
