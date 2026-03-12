import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import PropTypes from 'prop-types';
import * as React from 'react';
import { connect } from 'react-redux';
import uuid from 'uuidv4';

import {
  changeDocStatus,
  getAvailableToChangeStatuses,
  getDocStatus,
  initDocStatus,
  resetDocStatus,
  setChangeResult
} from '../../../actions/docStatus';
import { LoaderTypes } from '../../../constants/index';
import { deepClone } from '../../../helpers/util';
import { selectStateDocStatusById } from '../../../selectors/docStatus';
import DocStatusService from '../../../services/docStatus';
import { Caption, DropdownOuter } from '../../common/form/index';
import { Loader, PointsLoader } from '../../common/index';
import BaseWidget from '../BaseWidget';

import './style.scss';

const mapStateToProps = (state, context) => {
  const stateDS = selectStateDocStatusById(state, context.stateId);

  return {
    status: stateDS.status,
    isLoading: stateDS.isLoading,
    isChanging: stateDS.isChanging,
    changeResult: stateDS.changeResult,
    availableToChangeStatuses: stateDS.availableToChangeStatuses
  };
};

const mapDispatchToProps = dispatch => ({
  initDocStatus: payload => dispatch(initDocStatus(payload)),
  changeDocStatus: payload => dispatch(changeDocStatus(payload)),
  getDocStatus: payload => dispatch(getDocStatus(payload)),
  resetDocStatus: payload => dispatch(resetDocStatus(payload)),
  clearChangeResult: stateId => dispatch(setChangeResult({ stateId, changeResult: null })),
  getAvailableToChangeStatuses: payload => dispatch(getAvailableToChangeStatuses(payload))
});

class DocStatus extends BaseWidget {
  static propTypes = {
    record: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    className: PropTypes.string,
    title: PropTypes.string,
    isMobile: PropTypes.bool,
    loaderType: PropTypes.oneOf([LoaderTypes.CIRCLE, LoaderTypes.POINTS]),
    noLoader: PropTypes.bool,
    allowChangeStatus: PropTypes.bool
  };

  static defaultProps = {
    className: '',
    title: '',
    isMobile: false,
    loaderType: LoaderTypes.CIRCLE,
    allowChangeStatus: false
  };

  constructor(props) {
    super(props);

    this.observableFieldsToUpdate = [...new Set([...this.observableFieldsToUpdate, '_status?str', 'idocs:documentStatus'])];
  }

  state = {
    key: uuid()
  };

  componentDidMount() {
    super.componentDidMount();

    const { stateId, record, allowChangeStatus, initDocStatus } = this.props;

    initDocStatus({ stateId, record, allowChangeStatus });
  }

  componentDidUpdate(prevProps, prevState) {
    super.componentDidUpdate(prevProps, prevState);

    const { isLoading, status, changeResult, allowChangeStatus } = this.props;

    if (!prevProps.allowChangeStatus && allowChangeStatus) {
      const { stateId, record, getAvailableToChangeStatuses } = this.props;
      getAvailableToChangeStatuses({ stateId, record });
    }

    if (prevProps.isLoading && !isLoading) {
      if (isEmpty(status)) {
        this.updateStatus();
      }
    }

    if (changeResult && !prevProps.changeResult) {
      clearTimeout(this._resultTimer);
      this._resultTimer = setTimeout(() => {
        const { stateId, clearChangeResult } = this.props;
        clearChangeResult(stateId);
      }, 1500);
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    clearTimeout(this._resultTimer);

    const { resetDocStatus, stateId } = this.props;

    resetDocStatus({ stateId });
  }

  get isNoStatus() {
    const { status = {} } = this.props;

    return status.id === DocStatusService.NO_STATUS.id;
  }

  get isReadField() {
    const { availableToChangeStatuses, allowChangeStatus } = this.props;

    return !allowChangeStatus || isEmpty(availableToChangeStatuses);
  }

  get isShowLoader() {
    const { isLoading, isChanging, changeResult, status, noLoader } = this.props;

    if (isChanging || changeResult) {
      return false;
    }

    return (!noLoader && isLoading) || isEmpty(status);
  }

  updateStatus = () => {
    const { stateId, record, getDocStatus } = this.props;

    getDocStatus({ stateId, record });
  };

  handleChangeStatus = selected => {
    const { stateId, record, changeDocStatus } = this.props;

    changeDocStatus({ stateId, record, status: selected.id });
  };

  handleUpdate() {
    super.handleUpdate();
    this.updateStatus();
  }

  renderReadField() {
    const { status = {} } = this.props;
    const pillClass = classNames('ecos-doc-status__pill', 'ecos-doc-status__pill_readonly', {
      'ecos-doc-status__pill_no-status': this.isNoStatus
    });

    return (
      <div className={pillClass}>
        <span className="ecos-doc-status__pill-label">{status.name}</span>
      </div>
    );
  }

  renderResultIcon() {
    const { changeResult } = this.props;
    const isSuccess = changeResult === 'success';
    const iconClass = classNames('ecos-doc-status__pill-result-icon', {
      'ecos-doc-status__pill-result-icon_success': isSuccess,
      'ecos-doc-status__pill-result-icon_error': !isSuccess
    });

    return <i className={classNames(isSuccess ? 'icon-small-check' : 'icon-small-close', iconClass)} />;
  }

  renderTrailingIcon() {
    const { isChanging, changeResult } = this.props;

    if (isChanging) {
      return <PointsLoader className="ecos-doc-status__pill-loader" />;
    }

    if (changeResult) {
      return this.renderResultIcon();
    }

    return <i className="icon-small-down ecos-doc-status__pill-chevron" />;
  }

  renderManualField() {
    const { availableToChangeStatuses = [], status, isChanging, changeResult } = this.props;
    const source = deepClone(availableToChangeStatuses);
    const pillClass = classNames('ecos-doc-status__pill', 'ecos-doc-status__pill_interactive', {
      'ecos-doc-status__pill_no-status': this.isNoStatus,
      'ecos-doc-status__pill_changing': isChanging
    });

    return (
      <DropdownOuter
        source={source}
        value={status.id}
        valueField={'id'}
        titleField={'name'}
        onChange={this.handleChangeStatus}
        hideSelected
        isButton
        disabled={isChanging || !!changeResult}
      >
        <div className={pillClass} title={status.name}>
          <span className="ecos-doc-status__pill-label">{status.name}</span>
          {this.renderTrailingIcon()}
        </div>
      </DropdownOuter>
    );
  }

  renderLoader() {
    const { loaderType } = this.props;
    const className = classNames('ecos-doc-status__loader', `ecos-doc-status__loader_${loaderType}`);

    if (loaderType === LoaderTypes.POINTS) {
      return <PointsLoader className={className} />;
    }

    return <Loader className={className} />;
  }

  render() {
    const { isMobile, title, className } = this.props;

    return (
      <div className={classNames('ecos-doc-status', className, { 'ecos-doc-status_narrow': !isMobile })}>
        {this.isShowLoader ? (
          this.renderLoader()
        ) : (
          <>
            {!isMobile && title && (
              <Caption middle className="ecos-doc-status__title">
                {title}
              </Caption>
            )}
            {this.isReadField && this.renderReadField()}
            {!this.isReadField && this.renderManualField()}
          </>
        )}
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DocStatus);
