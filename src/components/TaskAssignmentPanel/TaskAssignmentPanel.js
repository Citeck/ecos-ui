import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import debounce from 'lodash/debounce';

import { StateAssignPropTypes } from '../widgets/Tasks/utils';
import { AssignActions } from '../../constants/tasks';
import { USER_CURRENT } from '../../constants';
import { t } from '../../helpers/util';
import { Btn } from '../common/btns';
import { SelectOrgstruct } from '../common/form';
import { AUTHORITY_TYPE_USER } from '../common/form/SelectOrgstruct/constants';
import { TasksApi } from '../../api/tasks';
import { changeTaskAssigneeFromPanel } from '../../actions/tasks';
// import { changeTaskAssignee } from "../../actions/tasks";

class TaskAssignmentPanel extends Component {
  static propTypes = {
    taskId: PropTypes.string,
    stateAssign: PropTypes.shape(StateAssignPropTypes),
    wrapperClassName: PropTypes.string,
    className: PropTypes.string,
    onClick: PropTypes.func,
    narrow: PropTypes.bool,
    executeRequest: PropTypes.bool
  };

  static defaultProps = {
    taskId: '',
    wrapperClassName: '',
    className: '',
    stateAssign: {},
    narrow: false,
    executeRequest: false
  };

  state = {
    stateAssign: {}
  };

  constructor(props) {
    super(props);

    if (isEmpty(props.stateAssign)) {
      this.getStateAssign(props.taskId);
    } else {
      this.state = { stateAssign: props.stateAssign };
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { taskId, stateAssign } = this.props;

    if (isEmpty(prevProps.stateAssign) && !isEmpty(stateAssign)) {
      this.stateAssign = stateAssign;
    }

    if (!prevProps.taskId && taskId && isEmpty(stateAssign)) {
      this.getStateAssign(taskId);
    }
  }

  componentWillUnmount() {
    this.getStateAssign.cancel();
  }

  get infoButtons() {
    const {
      stateAssign,
      stateAssign: { claimable, releasable, reassignable, assignable }
    } = this.state;

    if (isEmpty(stateAssign)) {
      return [];
    }

    const btns = [
      {
        isShow: claimable,
        sentData: { actionOfAssignment: AssignActions.ASSIGN_SMB, ownerUserName: USER_CURRENT },
        label: t('tasks-widget.assign.me')
      },
      {
        isShow: assignable,
        sentData: { actionOfAssignment: AssignActions.ASSIGN_SMB, ownerUserName: '' },
        label: t('tasks-widget.assign.assign'),
        hasSelector: true
      },
      {
        isShow: reassignable,
        sentData: { actionOfAssignment: AssignActions.ASSIGN_SMB, ownerUserName: '' },
        label: t('tasks-widget.assign.reassign'),
        hasSelector: true
      },
      {
        isShow: releasable,
        sentData: { actionOfAssignment: AssignActions.UNASSIGN, ownerUserName: '' },
        label: t('tasks-widget.assign.return-to-group')
      }
    ];

    return btns.filter(item => item.isShow);
  }

  getStateAssign = debounce(taskId => {
    if (!taskId) {
      return;
    }

    TasksApi.getStaticTaskStateAssignee({ taskId }).then(stateAssign => {
      this.stateAssign = stateAssign;
    });
  }, 500);

  set stateAssign(stateAssign) {
    this.setState({ stateAssign });
  }

  renderBtn(settings, index) {
    const { onClick, narrow, className, changeTaskAssignee, executeRequest, taskId } = this.props;
    const classBtn = classNames('ecos-task__assign-btn ecos-btn_brown2', className, { 'ecos-btn_narrow-t_standart': narrow });
    const keyBtn = `assignment-panel-${index}-${new Date().getTime()}`;
    const handleSelect = () => onClick && onClick(settings.sentData);

    const elmBtn = handleClick => (
      <Btn key={keyBtn} className={classBtn} onClick={handleClick}>
        {settings.label}
      </Btn>
    );

    if (settings.hasSelector) {
      return (
        <SelectOrgstruct
          key={`select-orgstruct-${keyBtn}`}
          allowedAuthorityTypes={[AUTHORITY_TYPE_USER]}
          renderView={props => elmBtn(props.toggleSelectModal)}
          onChange={value => {
            settings.sentData.ownerUserName = value;
            executeRequest && changeTaskAssignee({ ...settings.sentData, taskId });
            handleSelect();
          }}
        />
      );
    }

    return elmBtn(handleSelect);
  }

  render() {
    const { wrapperClassName } = this.props;

    return (
      <div className={classNames('ecos-task__assign-btn__wrapper', wrapperClassName)}>
        {this.infoButtons.map((btn, i) => this.renderBtn(btn, i))}
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch, props) => {
  const { record, stateId } = props;

  return {
    changeTaskAssignee: payload => dispatch(changeTaskAssigneeFromPanel({ ...payload }))
  };
};

// export default TaskAssignmentPanel;

export default connect(
  null,
  mapDispatchToProps
)(TaskAssignmentPanel);
