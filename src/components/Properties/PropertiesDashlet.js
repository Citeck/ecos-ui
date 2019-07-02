import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ReactResizeDetector from 'react-resize-detector';
import { isSmallMode, t } from '../../helpers/util';
import Dashlet from '../Dashlet/Dashlet';
import Properties from './Properties';
import PropsEditModal from './PropsEditModal';

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
      isEditDoc: false
    };
  }

  className = 'ecos-properties-dashlet';

  onResize = width => {
    this.setState({ isSmallMode: isSmallMode(width) });
  };

  onEdit = e => {
    this.setState({ isEditDoc: true });
  };

  closeEditModal = () => {
    this.setState({ isReady: false, isEditDoc: false }, () => this.setState({ isReady: true }));
  };

  render() {
    const { title, config, classNameProps, classNameDashlet, record } = this.props;
    const { isSmallMode, isReady, isEditDoc } = this.state;
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
        onEdit={this.onEdit}
      >
        <ReactResizeDetector handleWidth onResize={this.onResize} />
        <Properties {...config} className={classNameProps} record={record} isSmallMode={isSmallMode} isReady={isReady} />
        <PropsEditModal record={record} isOpen={isEditDoc} closeModal={this.closeEditModal} />
      </Dashlet>
    );
  }
}

export default PropertiesDashlet;
