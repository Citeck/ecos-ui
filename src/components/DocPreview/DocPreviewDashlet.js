import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import Dashlet from '../Dashlet/Dashlet';
import DocPreview from './DocPreview';
import { t } from '../../helpers/util';
import { MIN_WIDTH_DASHLET_LARGE, MIN_WIDTH_DASHLET_SMALL } from '../../constants';

import './style.scss';

class DocPreviewDashlet extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    classNamePreview: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.shape({
      height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      link: PropTypes.string.isRequired
    }),
    dragHandleProps: PropTypes.object,
    canDragging: PropTypes.bool
  };

  static defaultProps = {
    title: t('doc-preview.preview'),
    classNamePreview: '',
    classNameDashlet: '',
    dragHandleProps: {},
    canDragging: false
  };

  state = {
    width: MIN_WIDTH_DASHLET_SMALL
  };

  handleResize = width => {
    this.setState({ width });
  };

  render() {
    const { title, config, classNamePreview, classNameDashlet, dragHandleProps, canDragging } = this.props;
    const { width } = this.state;
    const classesDashlet = classNames('ecos-dp-dashlet', classNameDashlet, {
      'ecos-dp-dashlet_small': width < MIN_WIDTH_DASHLET_LARGE
    });

    return (
      <Dashlet
        title={title}
        bodyClassName={'ecos-dp-dashlet__body'}
        className={classesDashlet}
        actionReload={false}
        actionEdit={false}
        actionHelp={false}
        needGoTo={false}
        canDragging={canDragging}
        onResize={this.handleResize}
        dragHandleProps={dragHandleProps}
      >
        <DocPreview {...config} className={classNamePreview} />
      </Dashlet>
    );
  }
}

export default DocPreviewDashlet;
