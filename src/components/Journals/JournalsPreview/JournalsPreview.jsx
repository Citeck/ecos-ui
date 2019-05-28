import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import classNames from 'classnames';
import { PROXY_URI } from '../../../constants/alfresco';
import DocPreview from '../../DocPreview/DocPreview';
import '../../DocPreview/DocPreview.scss';
import './JournalsPreview.scss';

const mapStateToProps = state => ({
  nodeContent: state.journals.nodeContent
});

const mapDispatchToProps = dispatch => ({});

class JournalsPreview extends Component {
  render() {
    const { nodeContent } = this.props;
    let link = '';

    if (nodeContent && nodeContent.content) {
      const nodeRef = `${nodeContent['store-protocol']}/${nodeContent['store-identifier']}/${nodeContent['node-uuid']}`;
      link = `${PROXY_URI}api/node/${nodeRef}/content/${nodeContent.name}`;
    }

    return (
      <div className={classNames('ecos-journals-preview', this.props.className)}>
        {/*<Well className={'ecos-journals-preview__caption-well ecos-well_grey4 ecos-well_radius_6'}>{t('journals.action.preview')}</Well>*/}

        <div className={'ecos-journals-preview__container'}>
          <DocPreview link={link} height={'100%'} scale={1} />
        </div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsPreview);
