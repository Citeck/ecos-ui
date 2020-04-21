import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';

import { isMobileDevice, t } from '../../../helpers/util';
import { getStateId } from '../../../helpers/redux';
import { DocScaleOptions, MIN_WIDTH_DASHLET_LARGE, MIN_WIDTH_DASHLET_SMALL } from '../../../constants/index';
import UserLocalSettingsService, { DashletProps } from '../../../services/userLocalSettings';
import Dashlet from '../../Dashlet/Dashlet';
import DocPreview from './DocPreview';
import BaseWidget from '../BaseWidget';

import './style.scss';

const isMobile = isMobileDevice();

class DocPreviewDashlet extends BaseWidget {
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

  docPreviewRef = React.createRef();

  constructor(props) {
    super(props);

    this.stateId = getStateId(props);
    this.watcher = this.instanceRecord.watch('version', this.reload);

    UserLocalSettingsService.checkOldData(this.stateId);

    this.state = {
      width: MIN_WIDTH_DASHLET_SMALL,
      userHeight: UserLocalSettingsService.getDashletHeight(this.stateId),
      scale: isMobile ? DocScaleOptions.PAGE_WHOLE : UserLocalSettingsService.getDashletScale(this.stateId) || DocScaleOptions.AUTO,
      isCollapsed: UserLocalSettingsService.getDashletProperty(this.stateId, DashletProps.IS_COLLAPSED),
      fitHeights: {}
    };
  }

  componentWillUnmount() {
    this.instanceRecord.unwatch(this.watcher);
  }

  get otherHeight() {
    if (!this.props.maxHeightByContent) {
      return null;
    }

    return get(this.docPreviewRef, 'current.refToolbar.current.offsetHeight', 0) + 24 + 14;
  }

  onResize = width => {
    !!width && this.setState({ width });
  };

  setUserScale = scale => {
    scale && !isMobile && UserLocalSettingsService.setDashletScale(this.stateId, scale);
  };

  setContainerPageHeight = height => {
    if (height !== this.state.userHeight) {
      this.setState({
        userHeight: height,
        fitHeights: {
          ...this.state.fitHeights,
          max: height
        }
      });
    }
  };

  render() {
    const { title, config, classNamePreview, classNameDashlet, dragHandleProps, canDragging, fileName } = this.props;
    const { width, userHeight, fitHeights, scale, isCollapsed, runUpdate } = this.state;
    const classesDashlet = classNames('ecos-doc-preview-dashlet', classNameDashlet, {
      'ecos-doc-preview-dashlet_small': width < MIN_WIDTH_DASHLET_LARGE && !isMobile,
      'ecos-doc-preview-dashlet_mobile': isMobile,
      'ecos-doc-preview-dashlet_mobile_small': isMobile && width < 400
    });

    return (
      <Dashlet
        title={title}
        bodyClassName="ecos-doc-preview-dashlet__body"
        className={classesDashlet}
        noActions
        needGoTo={false}
        canDragging={canDragging}
        onResize={this.onResize}
        onChangeHeight={this.handleChangeHeight}
        dragHandleProps={dragHandleProps}
        resizable
        contentMaxHeight={this.clientHeight + this.otherHeight}
        getFitHeights={this.setFitHeights}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
      >
        <DocPreview
          ref={this.docPreviewRef}
          forwardedRef={this.contentRef}
          link={config.link}
          height={userHeight}
          className={classNamePreview}
          minHeight={fitHeights.min}
          maxHeight={fitHeights.max}
          scale={scale}
          fileName={fileName}
          setUserScale={this.setUserScale}
          getContainerPageHeight={this.setContainerPageHeight}
          resizable
          isCollapsed={isCollapsed}
          runUpdate={runUpdate}
        />
      </Dashlet>
    );
  }
}

export default DocPreviewDashlet;
