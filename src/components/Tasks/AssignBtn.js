import * as React from 'react';
import { stateAssignBtn } from './utils';
import { Btn } from '../common/btns';
import { t } from '../../helpers/util';
import PropTypes from 'prop-types';
import classNames from 'classnames';

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
    const classBtn = classNames(className, { 'ecos-btn_narrow': small });

    return (
      <Btn onClick={onClick} className={classBtn}>
        {t(stateInfo.label)}
      </Btn>
    );
  }
}

export default AssignBtn;
