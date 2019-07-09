import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { initDocStatus } from '../../actions/docStatus';
import { IcoBtn } from '../common/btns';
import Dropdown from '../common/form/Dropdown';
import './style.scss';

const mapStateToProps = (state, context) => {
  const stateDS = state.docStatus[context.stateId] || {};

  return {
    status: stateDS.status,
    isLoading: stateDS.isLoading
  };
};

const mapDispatchToProps = dispatch => ({
  initDocStatus: payload => dispatch(initDocStatus(payload))
});

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

  render() {
    const isRead = false; //fixme
    const { status = {} } = this.props;
    const statuses = [
      {
        id: '7777',
        title: '66666'
      },
      {
        id: status.name,
        title: status.name
      }
    ];

    return (
      <React.Fragment>
        {isRead && <div className={`${this.className}_read`}>{status.name}</div>}

        {!isRead && (
          <div className={`${this.className}_manual`}>
            <Dropdown source={statuses} value={status.name} valueField={'id'} titleField={'title'} onChange={this.onChangeStatus}>
              <IcoBtn invert={'true'} icon={'icon-down'} className={`ecos-btn_drop-down ecos-btn_blue ecos-btn_full-width`} />
            </Dropdown>
          </div>
        )}
      </React.Fragment>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DocStatus);
