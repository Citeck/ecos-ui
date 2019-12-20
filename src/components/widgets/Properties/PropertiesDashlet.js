import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import UserLocalSettingsService from '../../../services/userLocalSettings';
import Dashlet from '../../Dashlet/Dashlet';
import Properties from './Properties';
import PropertiesEditModal from './PropertiesEditModal';
import BaseWidget from '../BaseWidget';
import EcosFormUtils from '../../EcosForm/EcosFormUtils';
import { isSmallMode, t } from '../../../helpers/util';

import './style.scss';

const LABELS = {
  WIDGET_TITLE: 'properties-widget.title',
  EDIT_TITLE: 'properties-widget.action-edit.title',
  CONSTRUCTOR_BTN_TOOLTIP: 'Перейти в конструктор'
};

class PropertiesDashlet extends BaseWidget {
  static propTypes = {
    id: PropTypes.string.isRequired,
    record: PropTypes.string.isRequired,
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

  openModal = () => {
    this.setState({ isEditProps: true });
  };

  updateProps = () => {
    this.setState({ isReady: false, isEditProps: false }, () => this.setState({ isReady: true }));
  };

  closeModal = () => {
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

  render() {
    const { id, title, classNameProps, classNameDashlet, record, dragHandleProps, canDragging } = this.props;
    const { isSmallMode, isReady, isEditProps, userHeight, fitHeights, formIsChanged, isCollapsed, canEditRecord, canEdit } = this.state;
    const classDashlet = classNames('ecos-properties-dashlet', classNameDashlet);
    const actions = {
      edit: {
        text: t(LABELS.EDIT_TITLE),
        onClick: this.openModal
      },
      reload: {
        onClick: this.updateProps
      }
    };

    if (canEdit) {
      actions.builder = {
        icon: 'icon-forms',
        text: t(LABELS.CONSTRUCTOR_BTN_TOOLTIP),
        onClick: this.onClickShowFormBuilder
      };
    }

    return (
      <Dashlet
        title={title || t(LABELS.WIDGET_TITLE)}
        className={classDashlet}
        bodyClassName={'ecos-properties-dashlet__body'}
        configActions={actions}
        resizable={true}
        contentMaxHeight={this.clientHeight}
        needGoTo={false}
        canDragging={canDragging}
        dragHandleProps={dragHandleProps}
        getFitHeights={this.setFitHeights}
        onChangeHeight={this.handleChangeHeight}
        onResize={this.onResize}
        onToggleCollapse={this.handleToggleContent}
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
        <PropertiesEditModal
          record={record}
          isOpen={isEditProps}
          onFormCancel={this.closeModal}
          onFormSubmit={this.updateProps}
          formIsChanged={formIsChanged}
        />
      </Dashlet>
    );
  }
}

export default PropertiesDashlet;
