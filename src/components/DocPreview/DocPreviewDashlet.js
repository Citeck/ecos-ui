import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';

import { isMobileDevice, t } from '../../helpers/util';
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
    canDragging: PropTypes.bool,
    maxHeightByContent: PropTypes.bool
  };

  static defaultProps = {
    title: t('doc-preview.preview'),
    classNamePreview: '',
    fileName: '',
    classNameDashlet: '',
    dragHandleProps: {},
    maxHeightByContent: true
  };

  contentRef = React.createRef();
  docPreviewRef = React.createRef();

  constructor(props) {
    super(props);

    UserLocalSettingsService.checkOldData(props.id);

    this.state = {
      width: MIN_WIDTH_DASHLET_SMALL,
      height: UserLocalSettingsService.getDashletHeight(props.id),
      scale: UserLocalSettingsService.getDashletScale(props.id) || (isMobileDevice() ? 0.65 : undefined),
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed'),
      fitHeights: {}
    };
  }

  get clientHeight() {
    if (!this.props.maxHeightByContent) {
      return null;
    }

    return (
      get(this.contentRef, 'current.offsetHeight', 0) + 24 + get(this.docPreviewRef, 'current.refToolbar.current.offsetHeight', 0) + 14
    );
  }

  onResize = width => {
    this.setState({ width });
  };

  onChangeHeight = h => {
    const height = h;

    UserLocalSettingsService.setDashletHeight(this.props.id, height >= this.clientHeight ? null : height);
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

  setContainerPageHeight = height => {
    if (height !== this.state.height) {
      this.setState({
        height,
        fitHeights: {
          ...this.state.fitHeights,
          max: height
        }
      });
    }
  };

  handleToggleContent = (isCollapsed = false) => {
    this.setState({ isCollapsed });
    UserLocalSettingsService.setProperty(this.props.id, { isCollapsed });
  };

  render() {
    const { title, config, classNamePreview, classNameDashlet, dragHandleProps, canDragging, fileName } = this.props;
    const { width, height, fitHeights, scale, isCollapsed } = this.state;
    const isMobile = isMobileDevice();
    const classesDashlet = classNames('ecos-doc-preview-dashlet', classNameDashlet, {
      'ecos-doc-preview-dashlet_small': width < MIN_WIDTH_DASHLET_LARGE && !isMobile,
      'ecos-doc-preview-dashlet_mobile': isMobile,
      'ecos-doc-preview-dashlet_mobile_small': isMobile && width < 400
    });

    // console.warn(this.docPreviewRef.current)

    return (
      <Dashlet
        title={title}
        bodyClassName="ecos-doc-preview-dashlet__body"
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
        contentMaxHeight={this.clientHeight}
        getFitHeights={this.setFitHeights}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
      >
        <DocPreview
          ref={this.docPreviewRef}
          forwardedRef={this.contentRef}
          link={config.link}
          height={height}
          className={classNamePreview}
          minHeight={fitHeights.min}
          maxHeight={fitHeights.max}
          scale={scale}
          fileName={fileName}
          setUserScale={this.setUserScale}
          getContainerPageHeight={this.setContainerPageHeight}
          resizable
          isCollapsed={isCollapsed}
        />
      </Dashlet>
    );
  }
}

export default DocPreviewDashlet;
