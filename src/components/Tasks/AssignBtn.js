import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Btn } from '../common/btns';
import { t } from '../../helpers/util';
import { stateAssignBtn } from './utils';
import './style.scss';

class AssignBtn extends React.Component {
  static propTypes = {
    stateAssign: PropTypes.string.isRequired,
    className: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    small: PropTypes.bool
  };

  static defaultProps = {
    className: '',
    small: false,
    onClick: () => {}
  };

  render() {
    const { stateAssign, onClick, small, className } = this.props;
    const stateInfo = stateAssignBtn().find(item => item.id === stateAssign);
    const classBtn = classNames('ecos-task__assign-btn', className, { 'ecos-btn_narrow': small });

    return (
      <div className={'ecos-task__assign-btn-wrapper'}>
        <Btn onClick={onClick} className={classBtn}>
          {t(stateInfo.label)}
        </Btn>
      </div>
    );
  }
}

export default AssignBtn;
