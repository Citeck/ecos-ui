import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Dashlet from '../Dashlet/Dashlet';
import DocPreview from './DocPreview';
import './DocPreview.scss';

class DocPreviewDashlet extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    config: PropTypes.shape({
      height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      link: PropTypes.string.isRequired
    })
  };

  static defaultProps = {};

  render() {
    let { config } = this.props;

    return (
      <Dashlet title={'Предпросмотр'} bodyClassName={'ecos-doc-preview-dashlet__body'}>
        <DocPreview {...config} />
      </Dashlet>
    );
  }
}

export default DocPreviewDashlet;
