import * as React from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import Loader from '../common/Loader/Loader';

import './style.scss';

class Properties extends React.Component {
  static propTypes = {
    sourceId: PropTypes.string.isRequired,
    document: PropTypes.string.isRequired,
    className: PropTypes.string,
    isRunReload: PropTypes.bool,
    setReloadDone: PropTypes.func
  };

  static defaultProps = {
    sourceId: '',
    document: '',
    className: '',
    isRunReload: false,
    setReloadDone: () => {}
  };

  className = 'ecos-properties';

  renderLoader() {
    let { isLoading } = this.props;

    if (!isLoading) {
      return null;
    }

    return (
      <div className={`${this.className}__loader-wrapper`}>
        <Loader />
      </div>
    );
  }

  render() {
    const { height } = this.props;

    return (
      <Scrollbars style={{ height }} className={this.className}>
        {this.renderLoader()}
        <div>Properties</div>
      </Scrollbars>
    );
  }
}

export default Properties;
