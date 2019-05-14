import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

class ImgViewer extends Component {
  static propTypes = {
    ctrClass: PropTypes.string.isRequired,
    urlImg: PropTypes.string.isRequired
  };

  static defaultProps = {};

  render() {
    let { ctrClass: _viewer, urlImg } = this.props;

    return <img src={`${urlImg}`} alt="Image" width="100%" />;
  }
}

export default ImgViewer;
