import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ReactResizeDetector from 'react-resize-detector';
import { t } from '../../helpers/util';
import Dashlet from '../Dashlet/Dashlet';
import Properties from './Properties';

import './style.scss';

class PropertiesDashlet extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    document: PropTypes.string.isRequired,
    title: PropTypes.string,
    classNameProps: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.shape({
      height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      sourceId: PropTypes.string.isRequired
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
      isRunReload: false,
      isSmallMode: false
    };
  }

  className = 'ecos-properties-dashlet';

  onResize = width => {
    console.info('width', width);
    this.setState({ isSmallMode: width <= 300 });
  };

  render() {
    const { title, config, classNameProps, classNameDashlet, document } = this.props;
    const { isSmallMode } = this.state;
    const classDashlet = classNames(this.className, classNameDashlet);

    return (
      <Dashlet
        title={title}
        bodyClassName={`${this.className}__body`}
        className={classDashlet}
        resizable={true}
        needGoTo={false}
        actionEdit={false}
        actionHelp={false}
        actionReload={false}
      >
        <ReactResizeDetector handleWidth onResize={this.onResize} />
        <Properties {...config} className={classNameProps} document={document} isSmallMode={isSmallMode} />
      </Dashlet>
    );
  }
}

export default PropertiesDashlet;
