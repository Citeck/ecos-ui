import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import debounce from 'lodash/debounce';
import { NotificationManager } from 'react-notifications';

import { StateAssignPropTypes } from '../widgets/Tasks/utils';
import { AssignActions } from '../../constants/tasks';
import { USER_CURRENT } from '../../constants';
import { t } from '../../helpers/util';
import { Btn } from '../common/btns';
import { SelectOrgstruct } from '../common/form';
import { AUTHORITY_TYPE_USER } from '../common/form/SelectOrgstruct/constants';
import { TasksApi } from '../../api/tasks';
import Records from '../Records';

import './style.scss';

class TaskAssignmentPanel extends Component {
  static propTypes = {
    taskId: PropTypes.string,
    stateAssign: PropTypes.shape(StateAssignPropTypes),
    wrapperClassName: PropTypes.string,
    className: PropTypes.string,
    onClick: PropTypes.func,
    changeTaskAssignee: PropTypes.func,
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
    stateAssign: {},
    isLoading: false
  };

  constructor(props) {
    super(props);

    if (isEmpty(props.stateAssign)) {
      this.getStateAssign(props.taskId);
    } else {
      this.state = {
        ...this.state,
        stateAssign: props.stateAssign
      };
    }

    this.addWatcher();
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

    if (this.documentRecord) {
      this.documentRecord.unwatch(this.watcher);
    }
  }

  addWatcher = () => {
    const { taskId } = this.props;

    TasksApi.getDocument(taskId).then(documentRef => {
      this.documentRecord = Records.get(documentRef);
      this.watcher = this.documentRecord.watch('tasks.active-hash', () => this.getStateAssign(taskId));
    });
  };

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
        isShow: releasable,
        sentData: { actionOfAssignment: AssignActions.UNASSIGN, ownerUserName: '' },
        label: t('tasks-widget.assign.return-to-group')
      },
      {
        isShow: reassignable,
        sentData: { actionOfAssignment: AssignActions.ASSIGN_SMB, ownerUserName: '' },
        label: t('tasks-widget.assign.reassign'),
        hasSelector: true,
        className: 'ecos-btn_blue'
      },
      {
        isShow: assignable,
        sentData: { actionOfAssignment: AssignActions.ASSIGN_SMB, ownerUserName: '' },
        label: t('tasks-widget.assign.assign'),
        hasSelector: true,
        className: 'ecos-btn_blue'
      },
      {
        isShow: claimable,
        sentData: { actionOfAssignment: AssignActions.ASSIGN_SMB, ownerUserName: USER_CURRENT },
        label: t('tasks-widget.assign.me'),
        className: 'ecos-btn_blue'
      }
    ];

    return btns.filter(item => item.isShow);
  }

  getStateAssign = debounce((taskId = this.props.taskId) => {
    if (!taskId) {
      return;
    }

    TasksApi.getStaticTaskStateAssignee({ taskId }).then(stateAssign => {
      this.stateAssign = stateAssign;
    });
  }, 500);

  set stateAssign(stateAssign) {
    this.setState({ stateAssign, isLoading: false });
  }

  toggleLoading = () => {
    this.setState(state => ({ isLoading: !state.isLoading }));
  };

  handleChangeTaskAssignee = async sentData => {
    const { taskId } = this.props;
    const { actionOfAssignment, ownerUserName } = sentData;
    const save = await TasksApi.staticChangeAssigneeTask({
      taskId,
      action: actionOfAssignment,
      owner: ownerUserName
    });

    if (!save) {
      NotificationManager.warning(t('tasks-widget.saga.error3'));
    }

    const documentRef = await TasksApi.getDocument(taskId);

    if (!documentRef) {
      return;
    }

    await Records.get(documentRef).update();
  };

  handleClickButton = sentData => {
    const { onClick, taskId, changeTaskAssignee, executeRequest } = this.props;

    this.toggleLoading();

    if (executeRequest) {
      if (typeof changeTaskAssignee === 'function') {
        changeTaskAssignee({
          ...sentData,
          taskId,
          callback: this.getStateAssign
        });
      } else {
        this.handleChangeTaskAssignee(sentData).finally(this.getStateAssign);
      }
    }

    if (typeof onClick === 'function') {
      onClick(sentData);
    }
  };

  renderBtn(settings, index) {
    const { narrow, className } = this.props;
    const { isLoading } = this.state;
    const keyBtn = `assignment-panel-${index}-${new Date().getTime()}`;
    const handleSelect = () => this.handleClickButton(settings.sentData);

    const elmBtn = handleClick => (
      <Btn
        key={keyBtn}
        loading={isLoading}
        className={classNames(className, {
          'ecos-btn_narrow-t_standart': narrow,
          'assign-panel__item': !settings.hasSelector,
          [settings.className]: !className
        })}
        onClick={handleClick}
      >
        {settings.label}
      </Btn>
    );

    if (settings.hasSelector) {
      return (
        <SelectOrgstruct
          key={`select-orgstruct-${keyBtn}`}
          className="assign-panel__item"
          allowedAuthorityTypes={[AUTHORITY_TYPE_USER]}
          renderView={props => elmBtn(props.toggleSelectModal)}
          onChange={value => {
            settings.sentData.ownerUserName = value;
            handleSelect();
          }}
        />
      );
    }

    return elmBtn(handleSelect);
  }

  render() {
    const { wrapperClassName } = this.props;

    return <div className={classNames('assign-panel', wrapperClassName)}>{this.infoButtons.map((btn, i) => this.renderBtn(btn, i))}</div>;
  }
}

export default TaskAssignmentPanel;
