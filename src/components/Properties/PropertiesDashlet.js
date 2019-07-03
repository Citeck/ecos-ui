import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ReactResizeDetector from 'react-resize-detector';
import { isSmallMode, t } from '../../helpers/util';
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
    })
  };

  static defaultProps = {
    title: t('Свойства'),
    classNameProps: '',
    classNameDashlet: ''
  };

  constructor(props) {
    super(props);

    this.state = {
      isSmallMode: false,
      isReady: true,
      isEditProps: false
    };
  }

  className = 'ecos-properties-dashlet';

  onResize = width => {
    this.setState({ isSmallMode: isSmallMode(width) });
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
    const { title, config, classNameProps, classNameDashlet, record } = this.props;
    const { isSmallMode, isReady, isEditProps } = this.state;
    const classDashlet = classNames(this.className, classNameDashlet);

    return (
      <Dashlet
        title={title}
        bodyClassName={`${this.className}__body`}
        className={classDashlet}
        resizable={true}
        needGoTo={false}
        actionHelp={false}
        actionReload={false}
        onEdit={this.openModal}
      >
        <ReactResizeDetector handleWidth onResize={this.onResize} />
        <Properties {...config} className={classNameProps} record={record} isSmallMode={isSmallMode} isReady={isReady} />
        <PropertiesEditModal record={record} isOpen={isEditProps} onFormCancel={this.closeModal} onFormSubmit={this.updateProps} />
      </Dashlet>
    );
  }
}

export default PropertiesDashlet;
