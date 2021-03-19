import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import debounce from 'lodash/debounce';

import { TasksApi } from '../../api/tasks';
import { RecordActionsApi } from '../../api/recordActions';
import SidebarService from '../../services/sidebar';
import { AssignTo } from '../../constants/tasks';
import { t } from '../../helpers/util';
import { StateAssignPropTypes } from '../widgets/Tasks/utils';
import Records from '../Records';
import { ActionTypes } from '../Records/actions';
import { Btn } from '../common/btns';

import './style.scss';

const actionApi = new RecordActionsApi();

class TaskAssignmentPanel extends Component {
  static propTypes = {
    taskId: PropTypes.string,
    stateAssign: PropTypes.shape(StateAssignPropTypes),
    wrapperClassName: PropTypes.string,
    className: PropTypes.string,
    onAfterExecute: PropTypes.func,
    narrow: PropTypes.bool
  };

  static defaultProps = {
    taskId: '',
    wrapperClassName: '',
    className: '',
    stateAssign: {},
    narrow: false
  };

  state = {
    stateAssign: {},
    isLoading: false
  };

  #unmounted = false;

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
    this.#unmounted = true;

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

  get btnSettings() {
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
        sentData: { assignTo: AssignTo.ASSIGN_GROUP },
        label: t('tasks-widget.assign.return-to-group')
      },
      {
        isShow: reassignable,
        sentData: { assignTo: AssignTo.ASSIGN_SMB },
        label: t('tasks-widget.assign.reassign'),
        className: 'ecos-btn_blue'
      },
      {
        isShow: assignable,
        sentData: { assignTo: AssignTo.ASSIGN_SMB },
        label: t('tasks-widget.assign.assign'),
        className: 'ecos-btn_blue'
      },
      {
        isShow: claimable,
        sentData: { assignTo: AssignTo.ASSIGN_ME },
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
    if (this.#unmounted) {
      return;
    }

    this.setState({ stateAssign, isLoading: false });
  }

  toggleLoading = () => {
    this.setState(state => ({ isLoading: !state.isLoading }));
  };

  handleChangeTaskAssignee = async sentData => {
    const { taskId, noResultModal, errorMsg, onAfterExecute } = this.props;
    const { assignTo } = sentData;

    const result = await actionApi.executeAction({
      records: taskId,
      action: { type: ActionTypes.SET_TASK_ASSIGNEE, assignTo, config: { noResultModal, errorMsg } }
    });

    if (typeof onAfterExecute === 'function') {
      onAfterExecute({ ...sentData, taskId, result });
    }

    const documentRef = await TasksApi.getDocument(taskId);

    if (!documentRef) {
      return;
    }

    await Records.get(documentRef).update();
    SidebarService.emitter.emit(SidebarService.UPDATE_EVENT);
  };

  handleClickButton = sentData => {
    this.toggleLoading();
    this.handleChangeTaskAssignee(sentData).finally(this.getStateAssign);
  };

  renderBtn = (settings, index) => {
    const { narrow, className, taskId } = this.props;
    const { isLoading } = this.state;
    const keyBtn = `assignment-panel-${taskId}-${index}`;

    return (
      <Btn
        key={keyBtn}
        loading={isLoading}
        className={classNames('task-assign-panel__item', className, {
          'ecos-btn_narrow-t_standart': narrow,
          [settings.className]: !className
        })}
        onClick={() => this.handleClickButton(settings.sentData)}
      >
        {settings.label}
      </Btn>
    );
  };

  render() {
    const { wrapperClassName } = this.props;

    return <div className={classNames('task-assign-panel', wrapperClassName)}>{this.btnSettings.map(this.renderBtn)}</div>;
  }
}

export default TaskAssignmentPanel;
