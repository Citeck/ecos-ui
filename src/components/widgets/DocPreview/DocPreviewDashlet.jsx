import classNames from 'classnames';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React from 'react';

import Dashlet from '../../Dashlet/Dashlet';
import BaseWidget from '../BaseWidget';

import DocPreview from './DocPreview';
import Settings from './Settings';
import { Labels } from './util';

import { DocScaleOptions, MIN_WIDTH_DASHLET_LARGE } from '@/constants/index';
import { getStateId } from '@/helpers/store';
import { isMobileDevice, t } from '@/helpers/util';
import DAction from '@/services/DashletActionService';
import UserLocalSettingsService from '@/services/userLocalSettings';

import './style.scss';

const isMobile = isMobileDevice();

class DocPreviewDashlet extends BaseWidget {
  _toolbarRef = null;

  static propTypes = {
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    fileName: PropTypes.string,
    classNamePreview: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.shape({
      link: PropTypes.string
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

  constructor(props) {
    super(props);

    this.stateId = getStateId(props);
    this.state = {
      ...this.state,
      isShowSetting: false,
      scale: isMobile ? DocScaleOptions.PAGE_WHOLE : UserLocalSettingsService.getDashletScale(this.state.lsId) || DocScaleOptions.AUTO
    };

    this.observableFieldsToUpdateWithDefault = ['version', 'preview-hash', 'cm:content', 'documents[]', 'documents-hash'];
  }

  get dashletActions() {
    const { isShowSetting } = this.state;

    if (isShowSetting || !this.props.config) {
      return {};
    }

    return {
      [DAction.Actions.SETTINGS]: {
        onClick: this.handleToggleSettings
      }
    };
  }

  get otherHeight() {
    return this.dashletOtherHeight + get(this._toolbarRef, 'offsetHeight', 0) + 15;
  }

  setToolbarRef = ref => {
    if (ref) {
      this._toolbarRef = ref;
    }
  };

  get toolbarConfig() {
    const { showAllDocuments } = this.props.config || {};
    return { showAllDocuments };
  }

  setUserScale = scale => {
    if (scale && !isMobile) {
      UserLocalSettingsService.setDashletScale(this.state.lsId, scale);
      this.setState({ scale });
    }
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

  handleResize = width => {
    !!width && this.setState({ width });
  };

  handleToggleSettings = () => {
    this.setState(state => ({ isShowSetting: !state.isShowSetting }));
  };

  handleSaveConfig = config => {
    const { onSave, id } = this.props;

    isFunction(onSave) && onSave(id, { config });
    this.handleToggleSettings();
  };

  render() {
    const { title, config, record, classNamePreview, classNameDashlet, dragHandleProps, canDragging, fileName, ...props } = this.props;
    const { width, scale, runUpdate, isShowSetting } = this.state;

    return (
      <Dashlet
        {...props}
        title={title || t(Labels.WG_TITLE)}
        bodyClassName="ecos-doc-preview-dashlet__body"
        className={classNames('ecos-doc-preview-dashlet', classNameDashlet, {
          'ecos-doc-preview-dashlet_small': width < MIN_WIDTH_DASHLET_LARGE && !isMobile,
          'ecos-doc-preview-dashlet_mobile': isMobile,
          'ecos-doc-preview-dashlet_mobile_small': isMobile && width < 400
        })}
        actionConfig={this.dashletActions}
        needGoTo={false}
        canDragging={canDragging}
        onResize={this.handleResize}
        onChangeHeight={this.handleChangeHeight}
        dragHandleProps={dragHandleProps}
        resizable
        contentMaxHeight={this.clientHeight + this.otherHeight}
        getFitHeights={this.setFitHeights}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={this.isCollapsed}
        setRef={this.setDashletRef}
      >
        {isShowSetting && <Settings config={config} onCancel={this.handleToggleSettings} onSave={this.handleSaveConfig} />}
        <DocPreview
          forwardedRef={this.contentRef}
          link={get(config, 'link') || ''}
          className={classNames(classNamePreview, { 'd-none': isShowSetting })}
          scale={scale}
          fileName={fileName}
          setUserScale={this.setUserScale}
          getContainerPageHeight={this.setContainerPageHeight}
          resizable
          isCollapsed={this.isCollapsed}
          runUpdate={runUpdate}
          scrollbarProps={this.scrollbarProps}
          setToolbarRef={this.setToolbarRef}
          toolbarConfig={this.toolbarConfig}
          recordId={record}
        />
      </Dashlet>
    );
  }
}

export default DocPreviewDashlet;
