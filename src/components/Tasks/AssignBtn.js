import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Btn } from '../common/btns';
import { t } from '../../helpers/util';
import { stateAssignBtn } from './utils';
import './style.scss';

class AssignBtn extends React.Component {
  static propTypes = {
    stateAssign: PropTypes.number.isRequired,
    className: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    narrow: PropTypes.bool
  };

  static defaultProps = {
    className: '',
    narrow: false,
    onClick: () => {}
  };

  render() {
    const { stateAssign, onClick, narrow, className } = this.props;
    const stateInfo = stateAssignBtn().find(item => item.id === stateAssign);
    const classBtn = classNames('ecos-task__assign-btn', className, { 'ecos-btn_narrow': narrow });

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
