import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Btn } from '../common/btns';
import * as ArrayOfObjects from '../../helpers/arrayOfObjects';
import { AssignOptions, InfoAssignButtons } from './utils';
import './style.scss';

class AssignmentPanel extends React.Component {
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

  className = 'ecos-task__assign-btn';

  getInfoBtn = value => {
    return ArrayOfObjects.getObjectByKV(InfoAssignButtons, 'id', value);
  };

  render() {
    const { stateAssign, onClick, narrow, className } = this.props;
    const classBtn = classNames(this.className, className, { 'ecos-btn_narrow': narrow });

    return (
      <div className={this.className + '__wrapper'}>
        {stateAssign === AssignOptions.UNASSIGN && [
          <Btn onClick={onClick} className={classBtn} key={this.className + AssignOptions.ASSIGN_ME}>
            {this.getInfoBtn(AssignOptions.ASSIGN_ME).label}
          </Btn>,
          <Btn onClick={onClick} className={classBtn} key={this.className + AssignOptions.ASSIGN_SMB}>
            {this.getInfoBtn(AssignOptions.ASSIGN_SMB).label}
          </Btn>
        ]}
        {stateAssign === AssignOptions.ASSIGN_ME && [
          <Btn onClick={onClick} className={classBtn} key={this.className + AssignOptions.REASSIGN_SMB}>
            {this.getInfoBtn(AssignOptions.REASSIGN_SMB).label}
          </Btn>,
          <Btn onClick={onClick} className={classBtn} key={this.className + AssignOptions.UNASSIGN}>
            {this.getInfoBtn(AssignOptions.UNASSIGN).label}
          </Btn>
        ]}
      </div>
    );
  }
}

export default AssignmentPanel;
