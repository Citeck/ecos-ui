import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import Dashlet from '../Dashlet/Dashlet';
import DocPreview from './DocPreview';
import { t } from '../../helpers/util';
import { MAX_DEFAULT_HEIGHT_DASHLET_CONTENT, MIN_WIDTH_DASHLET_LARGE, MIN_WIDTH_DASHLET_SMALL } from '../../constants';
import UserLocalSettingsService from '../../services/userLocalSettings';

import './style.scss';

class DocPreviewDashlet extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    classNamePreview: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.shape({
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

  constructor(props) {
    super(props);

    this.state = {
      width: MIN_WIDTH_DASHLET_SMALL,
      height: UserLocalSettingsService.getDashletHeight(props.id) || MAX_DEFAULT_HEIGHT_DASHLET_CONTENT
    };
  }

  onResize = width => {
    this.setState({ width });
  };

  onChangeHeight = height => {
    UserLocalSettingsService.setDashletHeight(this.props.id, height);
    this.setState({ height });
  };

  render() {
    const { title, config, classNamePreview, classNameDashlet, dragHandleProps, canDragging } = this.props;
    const { width, height } = this.state;
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
        onResize={this.onResize}
        onChangeHeight={this.onChangeHeight}
        dragHandleProps={dragHandleProps}
        resizable
      >
        <DocPreview link={config.link} height={height} className={classNamePreview} />
      </Dashlet>
    );
  }
}

export default DocPreviewDashlet;
