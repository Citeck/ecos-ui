import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';
import { UncontrolledTooltip } from 'reactstrap';

import { isSmallMode, t } from '../../helpers/util';
import UserLocalSettingsService from '../../services/userLocalSettings';
import Dashlet from '../Dashlet/Dashlet';
import Properties from './Properties';
import PropertiesEditModal from './PropertiesEditModal';
import IcoBtn from '../common/btns/IcoBtn';

import './style.scss';

const LABELS = {
  WIDGET_TITLE: 'properties-widget.title',
  EDIT_TITLE: 'properties-widget.action-edit.title',
  CONSTRUCTOR_BTN_TOOLTIP: 'Перейти в конструктор'
};

const mapStateToProps = state => ({
  isAdmin: get(state, ['user', 'isAdmin'], false)
});

class PropertiesDashlet extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    isAdmin: PropTypes.bool,
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

  _propertiesRef = React.createRef();

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
      height: UserLocalSettingsService.getDashletHeight(props.id),
      fitHeights: {}
    };
  }

  className = 'ecos-properties-dashlet';

  get clientHeight() {
    if (!this.props.maxHeightByContent) {
      return null;
    }

    return get(this._propertiesRef, 'current._contentRef.current.offsetHeight', 0);
  }

  onResize = width => {
    this.setState({ isSmallMode: isSmallMode(width) });
  };

  onChangeHeight = height => {
    UserLocalSettingsService.setDashletHeight(this.props.id, height >= this.clientHeight ? null : height);
    this.setState({ height });
  };

  setFitHeights = fitHeights => {
    this.setState({ fitHeights });
  };

  openModal = e => {
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

  handleToggleContent = (isCollapsed = false) => {
    this.setState({ isCollapsed });
    UserLocalSettingsService.setProperty(this.props.id, { isCollapsed });
  };

  renderDashletCustomButtons(isDashlet = false) {
    const { id, isAdmin } = this.props;
    const buttons = [];

    if (isAdmin) {
      buttons.push(
        <React.Fragment key={`settings-button-${id}`}>
          <IcoBtn
            icon="icon-settings"
            id={`settings-icon-${id}-${isDashlet ? '-dashlet' : '-properties'}`}
            className={classNames('ecos-properties-dashlet__btn-settings ecos-btn_grey ecos-btn_sq_sm2 ecos-btn_hover_color-grey ', {
              dashlet__btn_hidden: isDashlet,
              'ml-2': !isDashlet
            })}
            onClick={this.onClickShowFormBuilder}
          />
          <UncontrolledTooltip
            target={`settings-icon-${id}-${isDashlet ? '-dashlet' : '-properties'}`}
            delay={0}
            placement="top"
            className={classNames('ecos-base-tooltip', {
              'ecos-modal-tooltip': !isDashlet
            })}
            innerClassName="ecos-base-tooltip-inner"
            arrowClassName="ecos-base-tooltip-arrow"
          >
            {t(LABELS.CONSTRUCTOR_BTN_TOOLTIP)}
          </UncontrolledTooltip>
        </React.Fragment>
      );
    }

    return buttons;
  }

  render() {
    const { id, title, classNameProps, classNameDashlet, record, dragHandleProps, canDragging } = this.props;
    const { isSmallMode, isReady, isEditProps, height, fitHeights, formIsChanged, isCollapsed } = this.state;
    const classDashlet = classNames(this.className, classNameDashlet);

    return (
      <Dashlet
        title={title || t(LABELS.WIDGET_TITLE)}
        className={classDashlet}
        bodyClassName={`${this.className}__body`}
        actionEditTitle={t(LABELS.EDIT_TITLE)}
        resizable={true}
        contentMaxHeight={this.clientHeight}
        needGoTo={false}
        actionHelp={false}
        actionReload={false}
        canDragging={canDragging}
        onEdit={this.openModal}
        dragHandleProps={dragHandleProps}
        onChangeHeight={this.onChangeHeight}
        getFitHeights={this.setFitHeights}
        onResize={this.onResize}
        customButtons={this.renderDashletCustomButtons(true)}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
      >
        <Properties
          ref={this._propertiesRef}
          className={classNameProps}
          record={record}
          isSmallMode={isSmallMode}
          isReady={isReady}
          stateId={id}
          height={height}
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

export default connect(mapStateToProps)(PropertiesDashlet);
