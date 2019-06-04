import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Dashlet from '../Dashlet/Dashlet';
import DocPreview from './DocPreview';
import './DocPreview.scss';
import { t } from '../../helpers/util';

class DocPreviewDashlet extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    classNamePreview: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.shape({
      height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      link: PropTypes.string.isRequired
    })
  };

  static defaultProps = {
    title: t('Предпросмотр'),
    classNamePreview: '',
    classNameDashlet: ''
  };

  render() {
    const { title, config, classNamePreview, classNameDashlet } = this.props;

    return (
      <Dashlet title={title} bodyClassName={'ecos-doc-preview-dashlet__body'} className={classNameDashlet}>
        <DocPreview {...config} className={classNamePreview} />
      </Dashlet>
    );
  }
}

export default DocPreviewDashlet;
