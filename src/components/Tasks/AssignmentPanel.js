import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Btn } from '../common/btns';
import { AssignOptions } from '../../constants/tasks';
import { t } from '../../helpers/util';
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
      stateAssign: { claimable, releasable, reassignable }
    } = this.props;

    const btns = [
      {
        isShow: claimable,
        sentData: { selectionAssign: AssignOptions.ASSIGN_ME },
        label: t('Я выполняю это')
      },
      {
        isShow: !releasable && !reassignable,
        sentData: { selectionAssign: AssignOptions.ASSIGN_SMB, userUid: 1 },
        label: t('Назначить')
      },
      {
        isShow: reassignable,
        sentData: { selectionAssign: AssignOptions.REASSIGN_SMB, userUid: 1 },
        label: t('Переназначить')
      },
      {
        isShow: releasable,
        sentData: { selectionAssign: AssignOptions.UNASSIGN },
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
