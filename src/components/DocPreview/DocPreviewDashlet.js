import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { t } from '../../helpers/util';
import { MIN_WIDTH_DASHLET_LARGE, MIN_WIDTH_DASHLET_SMALL } from '../../constants';
import UserLocalSettingsService from '../../services/userLocalSettings';
import Dashlet from '../Dashlet/Dashlet';
import DocPreview from './DocPreview';

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
      height: UserLocalSettingsService.getDashletHeight(props.id),
      scale: UserLocalSettingsService.getDashletScale(props.id) || 'auto',
      fitHeights: {}
    };
  }

  onResize = width => {
    this.setState({ width });
  };

  onChangeHeight = height => {
    UserLocalSettingsService.setDashletHeight(this.props.id, height);
    this.setState({ height });
  };

  setFitHeights = fitHeights => {
    this.setState({ fitHeights });
  };

  setUserScale = scale => {
    if (scale) {
      UserLocalSettingsService.setDashletScale(this.props.id, scale);
    }
  };

  render() {
    const { title, config, classNamePreview, classNameDashlet, dragHandleProps, canDragging } = this.props;
    const { width, height, fitHeights, scale } = this.state;
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
        getFitHeights={this.setFitHeights}
      >
        <DocPreview
          link={config.link}
          height={height}
          className={classNamePreview}
          minHeight={fitHeights.min}
          maxHeight={fitHeights.max}
          scale={scale}
          setUserScale={this.setUserScale}
        />
      </Dashlet>
    );
  }
}

export default DocPreviewDashlet;
