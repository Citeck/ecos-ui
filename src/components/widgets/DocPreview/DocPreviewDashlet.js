import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';

import { isMobileDevice, t } from '../../../helpers/util';
import { getStateId } from '../../../helpers/redux';
import { DocScaleOptions, MIN_WIDTH_DASHLET_LARGE } from '../../../constants/index';
import UserLocalSettingsService from '../../../services/userLocalSettings';
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
    maxHeightByContent: PropTypes.bool,
    fixedHeight: PropTypes.bool
  };

  static defaultProps = {
    classNamePreview: '',
    fileName: '',
    classNameDashlet: '',
    dragHandleProps: {},
    maxHeightByContent: false
  };

  docPreviewRef = React.createRef();

  constructor(props) {
    super(props);

    this.stateId = getStateId(props);
    this.state = {
      ...this.state,
      scale: isMobile ? DocScaleOptions.PAGE_WHOLE : UserLocalSettingsService.getDashletScale(this.state.lsId) || DocScaleOptions.AUTO
    };
    this.observableFieldsToUpdate = [...new Set([...this.observableFieldsToUpdate, 'version', 'preview-hash', 'cm:content'])];
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
    scale && !isMobile && UserLocalSettingsService.setDashletScale(this.state.lsId, scale);
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
        title={title || t('doc-preview.preview')}
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
