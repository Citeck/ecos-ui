import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { UncontrolledTooltip } from 'reactstrap';

import { isSmallMode, t } from '../../../helpers/util';
import UserLocalSettingsService from '../../../services/userLocalSettings';
import EcosFormUtils from '../../EcosForm/EcosFormUtils';
import IcoBtn from '../../common/btns/IcoBtn';
import Dashlet from '../../Dashlet/Dashlet';
import Properties from './Properties';
import PropertiesEditModal from './PropertiesEditModal';
import PropertiesSettings from './PropertiesSettings';

import './style.scss';

const Labels = {
  WIDGET_TITLE: 'properties-widget.title',
  EDIT_TITLE: 'properties-widget.action-edit.title',
  CONSTRUCTOR_BTN_TOOLTIP: 'Перейти в конструктор'
};

class PropertiesDashlet extends BaseWidget {
  static propTypes = {
    id: PropTypes.string,
    record: PropTypes.string,
    title: PropTypes.string,
    classNameProps: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.shape({
      height: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    }),
    dragHandleProps: PropTypes.object,
    canDragging: PropTypes.bool,
    maxHeightByContent: PropTypes.bool
  };

  static defaultProps = {
    classNameProps: '',
    classNameDashlet: '',
    dragHandleProps: {},
    canDragging: false,
    maxHeightByContent: true
  };

  constructor(props) {
    super(props);

    UserLocalSettingsService.checkOldData(props.id);

    this.state = {
      isSmallMode: false,
      isReady: true,
      isEditProps: false,
      formIsChanged: false,
      isSmall: false,
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed'),
      userHeight: UserLocalSettingsService.getDashletHeight(props.id),
      fitHeights: {},
      canEditRecord: false
    };
  }

  componentDidMount() {
    EcosFormUtils.hasWritePermission(this.props.record).then(canEditRecord => {
      this.setState({ canEditRecord });
    });
  }

  checkEditRights = () => {
    const { record } = this.props;

    EcosFormUtils.getCanWritePermission(record).then(canEdit => {
      this.setState({ canEdit });
    });
  };

  onResize = width => {
    this.setState({ isSmallMode: isSmallMode(width) });
  };

  onOpenModal = () => {
    this.setState({ isEditProps: true });
  };

  onCloseModal = () => {
    this.setState({ isEditProps: false });
  };

  onClickShowFormBuilder = () => {
    if (this._propertiesRef.current) {
      this._propertiesRef.current.onShowBuilder();
    }
  };

  onUpdateProperties = () => {
    this.setState({ formIsChanged: true }, () => this.setState({ formIsChanged: false }));
  };

  renderDashletCustomButtons(isDashlet = false) {
    const { id } = this.props;
    const { canEdit } = this.state;
    const buttons = [];

    if (canEdit) {
      const target = `settings-icon-${id}-${isDashlet ? '-dashlet' : '-properties'}`;

      buttons.push(
        <React.Fragment key={`settings-button-${id}`}>
          <IcoBtn
            icon="icon-settings"
            id={target}
            className={classNames('ecos-properties-dashlet__btn-settings ecos-btn_grey ecos-btn_sq_sm2 ecos-btn_hover_color-grey ', {
              dashlet__btn_hidden: isDashlet,
              'ml-2': !isDashlet
            })}
            onClick={this.onClickShowFormBuilder}
          />
          <UncontrolledTooltip
            target={target}
            delay={0}
            placement="top"
            className={classNames('ecos-base-tooltip', {
              'ecos-modal-tooltip': !isDashlet
            })}
            innerClassName="ecos-base-tooltip-inner"
            arrowClassName="ecos-base-tooltip-arrow"
          >
            {t(Labels.CONSTRUCTOR_BTN_TOOLTIP)}
          </UncontrolledTooltip>
        </React.Fragment>
      );
    }

    return buttons;
  }

  render() {
    const { id, title, classNameProps, classNameDashlet, record, dragHandleProps, canDragging } = this.props;
    const { isSmallMode, isReady, isEditProps, userHeight, fitHeights, formIsChanged, isCollapsed, canEditRecord } = this.state;

    return (
      <Dashlet
        title={title || t(Labels.WIDGET_TITLE)}
        className={classNames('ecos-properties-dashlet', classNameDashlet)}
        bodyClassName="ecos-properties-dashlet__body"
        actionEdit={canEditRecord}
        actionEditTitle={t(Labels.EDIT_TITLE)}
        resizable={true}
        contentMaxHeight={this.clientHeight}
        needGoTo={false}
        actionHelp={false}
        actionReload={false}
        canDragging={canDragging}
        onEdit={this.onOpenModal}
        dragHandleProps={dragHandleProps}
        onChangeHeight={this.handleChangeHeight}
        getFitHeights={this.setFitHeights}
        onResize={this.onResize}
        customButtons={this.renderDashletCustomButtons(true)}
        onToggleCollapse={this.onToggleContent}
        isCollapsed={isCollapsed}
      >
        <Properties
          forwardedRef={this.contentRef}
          className={classNameProps}
          record={record}
          isSmallMode={isSmallMode}
          isReady={isReady}
          stateId={id}
          height={userHeight}
          minHeight={fitHeights.min}
          maxHeight={fitHeights.max}
          onUpdate={this.onUpdateProperties}
        />
        <PropertiesSettings record={record} stateId={id} />
        <PropertiesEditModal
          record={record}
          isOpen={isEditProps}
          onFormCancel={this.onCloseModal}
          onFormSubmit={this.updateProps}
          formIsChanged={formIsChanged}
        />
      </Dashlet>
    );
  }
}

export default PropertiesDashlet;
