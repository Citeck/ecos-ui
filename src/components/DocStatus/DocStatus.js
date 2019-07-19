import * as React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { debounce, isEmpty } from 'lodash';
import { connect } from 'react-redux';
import { changeDocStatus, getCheckDocStatus, getDocStatus, initDocStatus } from '../../actions/docStatus';
import { deepClone, t } from '../../helpers/util';
import { IcoBtn } from '../common/btns';
import Dropdown from '../common/form/Dropdown';
import Loader from '../common/Loader/Loader';
import './style.scss';

const mapStateToProps = (state, context) => {
  const stateDS = state.docStatus[context.stateId] || {};

  return {
    status: stateDS.status,
    isUpdating: stateDS.isUpdating,
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

const noStatus = { id: 'no-status', name: t('Нет статуса') };

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
    const { stateId, record, status, getDocStatus } = this.props;

    if (nextProps.isUpdating) {
      this.checkDocStatusPing();
    } else if (!nextProps.isUpdating && !nextProps.isLoading && isEmpty(nextProps.status)) {
      getDocStatus({ stateId, record });
    }
  }

  get selectedStatus() {
    const { status = {} } = this.props;

    return isEmpty(status) ? noStatus : status;
  }

  get isNoStatus() {
    return this.selectedStatus.id === noStatus.id;
  }

  get isReadField() {
    const { availableStatuses } = this.props;

    return isEmpty(availableStatuses);
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
    const classStatus = classNames(`${this.className}_read`, { [`${this.className}_read_no-status`]: this.isNoStatus });

    return <div className={classStatus}>{this.selectedStatus.name}</div>;
  }

  renderManualField() {
    const { availableStatuses = [], isLoading } = this.props;
    const source = deepClone(availableStatuses);
    const classStatus = classNames('ecos-btn_drop-down ecos-btn_full-width', { 'ecos-btn_blue': !this.isNoStatus });

    source.push(this.selectedStatus);

    return (
      <div className={`${this.className}_manual`}>
        <Dropdown
          source={source}
          value={this.selectedStatus.id}
          valueField={'id'}
          titleField={'name'}
          onChange={this.onChangeStatus}
          hideSelected
        >
          <IcoBtn invert={'true'} icon={'icon-down'} className={classStatus} loading={isLoading} />
        </Dropdown>
      </div>
    );
  }

  render() {
    const { isLoading, isUpdating } = this.props;
    const { wasChanged } = this.state;

    return (
      <div className={this.className}>
        {(isLoading || isUpdating) && !wasChanged ? (
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
