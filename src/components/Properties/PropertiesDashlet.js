import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isSmallMode, t } from '../../helpers/util';
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

  render() {
    const { id, title, classNameProps, classNameDashlet, record, dragHandleProps, canDragging } = this.props;
    const { isSmallMode, isReady, isEditProps, height, fitHeights } = this.state;
    const classDashlet = classNames(this.className, classNameDashlet);

    return (
      <Dashlet
        title={title || t('properties-widget.title')}
        className={classDashlet}
        bodyClassName={`${this.className}__body`}
        actionEditTitle={t('properties-widget.action-edit.title')}
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
      >
        <Properties
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

export default PropertiesDashlet;
