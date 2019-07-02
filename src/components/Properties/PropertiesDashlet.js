import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
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
      isResizable: true,
      isRunReload: false
    };
  }

  className = 'ecos-properties-dashlet';

  onReload = () => {
    this.setReload(false);
  };

  setReload = isDone => {
    this.setState({ isRunReload: !isDone });
  };

  render() {
    const { title, config, classNameProps, classNameDashlet, document } = this.props;
    const { isResizable, isRunReload } = this.state;
    const classDashlet = classNames(this.className, classNameDashlet);

    return (
      <Dashlet
        title={title}
        bodyClassName={`${this.className}__body`}
        className={classDashlet}
        resizable={isResizable}
        onReload={this.onReload}
        needGoTo={false}
        actionEdit={false}
        actionHelp={false}
        actionReload={false}
      >
        <Properties {...config} className={classNameProps} document={document} isRunReload={isRunReload} setReloadDone={this.setReload} />
      </Dashlet>
    );
  }
}

export default PropertiesDashlet;
