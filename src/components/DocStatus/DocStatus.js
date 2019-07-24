import * as React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { debounce, isEmpty } from 'lodash';
import { connect } from 'react-redux';
import { changeDocStatus, getCheckDocStatus, getDocStatus, initDocStatus } from '../../actions/docStatus';
import { deepClone } from '../../helpers/util';
import { IcoBtn } from '../common/btns';
import Dropdown from '../common/form/Dropdown';
import Loader from '../common/Loader/Loader';
import './style.scss';
import DocStatusService from '../../services/docStatus';

const mapStateToProps = (state, context) => {
  const stateDS = state.docStatus[context.stateId] || {};

  return {
    status: stateDS.status,
    isUpdating: stateDS.isUpdating,
    countAttempt: stateDS.countAttempt,
    isLoading: stateDS.isLoading,
    availableStatuses: stateDS.availableStatuses
  };
};

const mapDispatchToProps = dispatch => ({
  initDocStatus: payload => dispatch(initDocStatus(payload)),
  changeDocStatus: payload => dispatch(changeDocStatus(payload)),
  getDocStatus: payload => dispatch(getDocStatus(payload)),
  getCheckDocStatus: payload => dispatch(getCheckDocStatus(payload))
});

const MAX_ATTEMPT = 3;

class DocStatus extends React.Component {
  static propTypes = {
    record: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    className: PropTypes.string
  };

  static defaultProps = {
    className: ''
  };

  className = 'ecos-doc-status';

  state = {
    wasChanged: false
  };

  checkDocStatusPing = debounce(() => {
    const { stateId, record, getCheckDocStatus } = this.props;

    getCheckDocStatus({ stateId, record });
  }, 3000);

  componentDidMount() {
    const { stateId, record, initDocStatus } = this.props;

    initDocStatus({ stateId, record });
  }

  componentWillReceiveProps(nextProps, nextContext) {
    const { stateId, record, getDocStatus, isLoading } = this.props;

    if (!isLoading) {
      if (nextProps.isUpdating && nextProps.countAttempt < MAX_ATTEMPT) {
        this.checkDocStatusPing();
      } else if ((!nextProps.isUpdating || nextProps.countAttempt === MAX_ATTEMPT) && isEmpty(nextProps.status)) {
        getDocStatus({ stateId, record });
      }
    }
  }

  get isNoStatus() {
    const { status = {} } = this.props;

    return status.id === DocStatusService.NO_STATUS.id;
  }

  get isReadField() {
    const { availableStatuses } = this.props;

    return isEmpty(availableStatuses);
  }

  get isShowLoader() {
    const { isLoading, isUpdating, countAttempt, status } = this.props;

    return isLoading || (isUpdating && countAttempt < MAX_ATTEMPT) || isEmpty(status);
  }

  onChangeStatus = () => {
    const { stateId, record, changeDocStatus } = this.props;

    this.setState({ wasChanged: true });
    changeDocStatus({ stateId, record });
  };

  renderLoader() {
    return (
      <div className={`${this.className}__loader-wrapper`}>
        <Loader height={'45'} width={'45'} />
      </div>
    );
  }

  renderReadField() {
    const { status = {} } = this.props;
    const classStatus = classNames(`${this.className}_read`, { [`${this.className}_no-status`]: this.isNoStatus });

    return <div className={classStatus}>{status.name}</div>;
  }

  renderManualField() {
    const { availableStatuses = [], status } = this.props;
    const source = deepClone(availableStatuses);
    const classStatus = classNames('ecos-btn_drop-down ecos-btn_full-width', { 'ecos-btn_blue': !this.isNoStatus || this.isShowLoader });

    source.push(status);

    return (
      <div className={`${this.className}_manual`}>
        <Dropdown source={source} value={status.id} valueField={'id'} titleField={'name'} onChange={this.onChangeStatus} hideSelected>
          <IcoBtn invert icon={'icon-down'} className={classStatus} loading={this.isShowLoader} />
        </Dropdown>
      </div>
    );
  }

  render() {
    const { wasChanged } = this.state;

    return (
      <div className={this.className}>
        {this.isShowLoader && !wasChanged ? (
          this.renderLoader()
        ) : (
          <React.Fragment>
            {this.isReadField && this.renderReadField()}
            {!this.isReadField && this.renderManualField()}
          </React.Fragment>
        )}
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DocStatus);
