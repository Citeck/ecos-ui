import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ReactResizeDetector from 'react-resize-detector';
import { isSmallMode, t } from '../../helpers/util';
import { MAX_DEFAULT_HEIGHT_DASHLET_CONTENT } from '../../constants';
import UserLocalSettingsService from '../../services/userLocalSettings';
import Dashlet from '../Dashlet/Dashlet';
import Properties from './Properties';
import PropertiesEditModal from './PropertiesEditModal';

import './style.scss';

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

  constructor(props) {
    super(props);

    this.state = {
      isSmallMode: false,
      isReady: true,
      isEditProps: false,
      height: UserLocalSettingsService.getDashletHeight(props.id) || MAX_DEFAULT_HEIGHT_DASHLET_CONTENT
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

  openModal = e => {
    this.setState({ isEditProps: true });
  };

  updateProps = () => {
    this.setState({ isReady: false, isEditProps: false }, () => this.setState({ isReady: true }));
  };

  closeModal = () => {
    this.setState({ isEditProps: false });
  };

  render() {
    const { id, title, classNameProps, classNameDashlet, record, dragHandleProps, canDragging } = this.props;
    const { isSmallMode, isReady, isEditProps, height } = this.state;
    const classDashlet = classNames(this.className, classNameDashlet);

    return (
      <Dashlet
        title={title || t('properties-widget.title')}
        bodyClassName={`${this.className}__body`}
        className={classDashlet}
        resizable={true}
        needGoTo={false}
        actionHelp={false}
        actionReload={false}
        canDragging={canDragging}
        onEdit={this.openModal}
        dragHandleProps={dragHandleProps}
        onChangeHeight={this.onChangeHeight}
      >
        <ReactResizeDetector handleWidth onResize={this.onResize} />
        <Properties className={classNameProps} record={record} isSmallMode={isSmallMode} isReady={isReady} stateId={id} height={height} />
        <PropertiesEditModal record={record} isOpen={isEditProps} onFormCancel={this.closeModal} onFormSubmit={this.updateProps} />
      </Dashlet>
    );
  }
}

export default PropertiesDashlet;
