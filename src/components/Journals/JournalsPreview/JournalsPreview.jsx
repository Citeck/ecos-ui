import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import classNames from 'classnames';
import { Well } from '../../common/form';

import './JournalsPreview.scss';

const mapStateToProps = state => ({
  nodeContent: state.journals.nodeContent
});

const mapDispatchToProps = dispatch => ({});

class JournalsPreview extends Component {
  render() {
    console.log(this.props.nodeContent);

    return (
      <div className={classNames('ecos-journals-preview', this.props.className)}>
        <Well className={'ecos-journals-preview__caption-well ecos-well_grey4 ecos-well_radius_6'}>{'Предпросмотр'}</Well>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsPreview);
