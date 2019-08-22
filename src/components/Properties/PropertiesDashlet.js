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
    record: PropTypes.string.isRequired,
    title: PropTypes.string,
    classNameProps: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.shape({
      height: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    }),
    dragHandleProps: PropTypes.object,
    canDragging: PropTypes.bool
  };

  static defaultProps = {
    classNameProps: '',
    classNameDashlet: '',
    dragHandleProps: {},
    canDragging: false
  };

  _propertiesRef = React.createRef();

  constructor(props) {
    super(props);

    this.state = {
      isSmallMode: false,
      isReady: true,
      isEditProps: false,
      height: UserLocalSettingsService.getDashletHeight(props.id),
      fitHeights: {}
    };
  }

  className = 'ecos-properties-dashlet';

  onResize = width => {
    this.setState({ isSmallMode: isSmallMode(width) });
  };

  onChangeHeight = height => {
    UserLocalSettingsService.setDashletHeight(this.props.id, height);
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

  renderDashletCustomButtons() {
    const { isAdmin, id } = this.props;
    const buttons = [];

    if (isAdmin) {
      buttons.push(
        <React.Fragment key={`settings-button-${id}`}>
          <IcoBtn
            icon="icon-settings"
            id={`settings-icon-${id}`}
            className="ecos-btn_grey ecos-btn_sq_sm ecos-btn_hover_color-grey mr-2"
            onClick={this.onClickShowFormBuilder}
          />
          <UncontrolledTooltip
            target={`settings-icon-${id}`}
            delay={0}
            placement="top"
            innerClassName="tooltip-inner-custom"
            arrowClassName="arrow-custom"
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
    const { isSmallMode, isReady, isEditProps, height, fitHeights } = this.state;
    const classDashlet = classNames(this.className, classNameDashlet);

    return (
      <Dashlet
        title={title || t(LABELS.WIDGET_TITLE)}
        className={classDashlet}
        bodyClassName={`${this.className}__body`}
        actionEditTitle={t(LABELS.EDIT_TITLE)}
        resizable={true}
        needGoTo={false}
        actionHelp={false}
        actionReload={false}
        canDragging={canDragging}
        onEdit={this.openModal}
        dragHandleProps={dragHandleProps}
        onChangeHeight={this.onChangeHeight}
        getFitHeights={this.setFitHeights}
        onResize={this.onResize}
        customButtons={this.renderDashletCustomButtons()}
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
        />
        <PropertiesEditModal record={record} isOpen={isEditProps} onFormCancel={this.closeModal} onFormSubmit={this.updateProps} />
      </Dashlet>
    );
  }
}

export default connect(
  mapStateToProps,
  {}
)(PropertiesDashlet);
