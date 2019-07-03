import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { USER_ADMIN, USER_CURRENT } from '../../constants';
import { AssignActions } from '../../constants/tasks';
import { t } from '../../helpers/util';
import { Btn } from '../common/btns';
import { StateAssignPropTypes } from './utils';

import './style.scss';

class AssignmentPanel extends React.Component {
  static propTypes = {
    stateAssign: PropTypes.shape(StateAssignPropTypes).isRequired,
    className: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    narrow: PropTypes.bool
  };

  static defaultProps = {
    className: '',
    narrow: false,
    onClick: () => {}
  };

  className = 'ecos-task__assign-btn';

  get infoButtons() {
    const {
      stateAssign: { claimable, releasable, reassignable, assignable }
    } = this.props;

    const btns = [
      {
        isShow: claimable,
        sentData: { actionOfAssignment: AssignActions.ASSIGN_SMB, ownerUserName: USER_CURRENT },
        label: t('Я выполняю это')
      },
      {
        isShow: assignable,
        sentData: { actionOfAssignment: AssignActions.ASSIGN_SMB, ownerUserName: USER_ADMIN }, //todo выбор пользователя из МО в другой доработке
        label: t('Назначить')
      },
      {
        isShow: reassignable,
        sentData: { actionOfAssignment: AssignActions.ASSIGN_SMB, ownerUserName: USER_ADMIN },
        label: t('Переназначить')
      },
      {
        isShow: releasable,
        sentData: { actionOfAssignment: AssignActions.UNASSIGN, ownerUserName: '' },
        label: t('Вернуть на группу')
      }
    ];

    return btns.filter(item => item.isShow);
  }

  render() {
    const { onClick, narrow, className } = this.props;
    const classBtn = classNames(this.className, className, { 'ecos-btn_narrow-t_standart': narrow });

    return (
      <div className={this.className + '__wrapper'}>
        {this.infoButtons.map((btn, i) => (
          <Btn
            key={i + new Date().getTime()}
            className={classBtn}
            onClick={() => {
              onClick(btn.sentData);
            }}
          >
            {btn.label}
          </Btn>
        ))}
      </div>
    );
  }
}

export default AssignmentPanel;
