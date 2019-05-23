import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import classNames from 'classnames';
import { Well } from '../../common/form';

import './JournalsTasks.scss';

const mapStateToProps = state => ({});

const mapDispatchToProps = dispatch => ({});

class JournalsTasks extends Component {
  render() {
    return (
      <div className={classNames('ecos-journals-tasks', this.props.className)}>
        <Well className={'ecos-journals-tasks__caption-well ecos-well_grey4 ecos-well_radius_6'}>{'Задачи'}</Well>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsTasks);
