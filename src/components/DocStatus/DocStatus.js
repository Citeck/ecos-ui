import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { initDocStatus } from '../../actions/docStatus';
import { IcoBtn } from '../common/btns';
import Dropdown from '../common/form/Dropdown';
import './style.scss';
import Loader from '../common/Loader/Loader';

const mapStateToProps = (state, context) => {
  const stateDS = state.docStatus[context.stateId] || {};

  return {
    status: stateDS.status,
    isLoading: stateDS.isLoading,
    availableStatuses: stateDS.availableStatuses
  };
};

const mapDispatchToProps = dispatch => ({
  initDocStatus: payload => dispatch(initDocStatus(payload))
});
const isRead = false;

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

  componentDidMount() {
    const { stateId, record, initDocStatus } = this.props;

    initDocStatus({ stateId, record });
  }

  onChangeStatus = () => {};

  renderLoader() {
    return (
      <div className={`${this.className}__loader-wrapper`}>
        <Loader height={'50'} width={'50'} />
      </div>
    );
  }

  renderReadField() {
    const { status = {} } = this.props;

    return <div className={`${this.className}_read`}>{status.name}</div>;
  }

  renderManualField() {
    const { status = {}, availableStatuses = [] } = this.props;

    return (
      <div className={`${this.className}_manual`}>
        <Dropdown source={availableStatuses} value={status.name} valueField={'name'} titleField={'name'} onChange={this.onChangeStatus}>
          <IcoBtn invert={'true'} icon={'icon-down'} className={`ecos-btn_drop-down ecos-btn_blue ecos-btn_full-width`} />
        </Dropdown>
      </div>
    );
  }

  render() {
    const { isLoading } = this.props;

    return (
      <div className={this.className}>
        {isLoading ? (
          this.renderLoader()
        ) : (
          <React.Fragment>
            {isRead && this.renderReadField()}
            {!isRead && this.renderManualField()}
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
