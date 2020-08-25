import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { USER_CURRENT } from '../../../constants';
import { AssignActions } from '../../../constants/tasks';
import { t } from '../../../helpers/util';
import { AUTHORITY_TYPE_USER } from '../../common/form/SelectOrgstruct/constants';
import { SelectOrgstruct } from '../../common/form';
import { Btn } from '../../common/btns';
import { StateAssignPropTypes } from './utils';

import './style.scss';

class AssignmentPanel extends React.Component {
  static propTypes = {
    stateAssign: PropTypes.shape(StateAssignPropTypes).isRequired,
    wrapperClassName: PropTypes.string,
    className: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    narrow: PropTypes.bool
  };

  static defaultProps = {
    wrapperClassName: '',
    className: '',
    narrow: false
  };

  get infoButtons() {
    const {
      stateAssign: { claimable, releasable, reassignable, assignable }
    } = this.props;

    const btns = [
      {
        isShow: claimable,
        sentData: { actionOfAssignment: AssignActions.CLAIM, ownerUserName: USER_CURRENT },
        label: t('tasks-widget.assign.me')
      },
      {
        isShow: assignable,
        sentData: { actionOfAssignment: AssignActions.CLAIM, ownerUserName: '' },
        label: t('tasks-widget.assign.assign'),
        hasSelector: true
      },
      {
        isShow: reassignable,
        sentData: { actionOfAssignment: AssignActions.CLAIM, ownerUserName: '' },
        label: t('tasks-widget.assign.reassign'),
        hasSelector: true
      },
      {
        isShow: releasable,
        sentData: { actionOfAssignment: AssignActions.RELEASE, ownerUserName: '' },
        label: t('tasks-widget.assign.return-to-group')
      }
    ];

    return btns.filter(item => item.isShow);
  }

  renderBtn(settings, index) {
    const { onClick, narrow, className } = this.props;
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

export default AssignmentPanel;
