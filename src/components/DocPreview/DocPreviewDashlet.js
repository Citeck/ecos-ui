import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import Dashlet from '../Dashlet/Dashlet';
import DocPreview from './DocPreview';
import './DocPreview.scss';

const mapStateToProps = state => ({});

const mapDispatchToProps = dispatch => ({});

class DocPreviewDashlet extends Component {
  render() {
    let { id, config } = this.props;

    return (
      <Dashlet title={'Предпросмотр'} bodyClassName={'ecos-doc-preview-dashlet__body'}>
        <DocPreview link={'testPdf.pdf'} />
      </Dashlet>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DocPreviewDashlet);
