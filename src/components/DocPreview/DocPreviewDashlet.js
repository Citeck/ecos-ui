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
    fileName: PropTypes.string,
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
    fileName: '',
    classNameDashlet: '',
    dragHandleProps: {},
    canDragging: false
  };

  className = 'ecos-doc-preview-dashlet';

  constructor(props) {
    super(props);

    UserLocalSettingsService.checkOldData(props.id);

    this.state = {
      width: MIN_WIDTH_DASHLET_SMALL,
      height: UserLocalSettingsService.getDashletHeight(props.id),
      scale: UserLocalSettingsService.getDashletScale(props.id) || 'auto',
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed'),
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

  handleToggleContent = () => {
    const { isCollapsed } = this.state;

    this.setState({ isCollapsed: !isCollapsed });
    UserLocalSettingsService.setProperty(this.props.id, { isCollapsed: !isCollapsed });
  };

  render() {
    const { title, config, classNamePreview, classNameDashlet, dragHandleProps, canDragging, fileName } = this.props;
    const { width, height, fitHeights, scale, isCollapsed } = this.state;
    const classesDashlet = classNames(this.className, classNameDashlet, {
      [`${this.className}_small`]: width < MIN_WIDTH_DASHLET_LARGE
    });

    return (
      <Dashlet
        title={title}
        bodyClassName={`${this.className}__body`}
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
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
      >
        <DocPreview
          link={config.link}
          height={height}
          className={classNamePreview}
          minHeight={fitHeights.min}
          maxHeight={fitHeights.max}
          scale={scale}
          fileName={fileName}
          setUserScale={this.setUserScale}
          resizable
          isCollapsed={isCollapsed}
        />
      </Dashlet>
    );
  }
}

export default DocPreviewDashlet;
