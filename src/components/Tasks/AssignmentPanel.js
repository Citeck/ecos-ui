import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Btn } from '../common/btns';
import { AssignOptions } from '../../constants/tasks';
import * as ArrayOfObjects from '../../helpers/arrayOfObjects';
import { InfoAssignButtons } from './utils';
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
    const { ASSIGN_ME, ASSIGN_SMB, REASSIGN_SMB, UNASSIGN } = AssignOptions;

    return (
      <div className={this.className + '__wrapper'}>
        {stateAssign === UNASSIGN && [
          <Btn
            onClick={() => {
              onClick(ASSIGN_ME);
            }}
            className={classBtn}
            key={this.className + ASSIGN_ME}
          >
            {this.getInfoBtn(ASSIGN_ME).label}
          </Btn>,
          <Btn
            onClick={() => {
              onClick(ASSIGN_SMB);
            }}
            className={classBtn}
            key={this.className + ASSIGN_SMB}
          >
            {this.getInfoBtn(ASSIGN_SMB).label}
          </Btn>
        ]}
        {stateAssign === ASSIGN_ME && [
          <Btn
            onClick={() => {
              onClick(REASSIGN_SMB);
            }}
            className={classBtn}
            key={this.className + REASSIGN_SMB}
          >
            {this.getInfoBtn(REASSIGN_SMB).label}
          </Btn>,
          <Btn
            onClick={() => {
              onClick(UNASSIGN);
            }}
            className={classBtn}
            key={this.className + UNASSIGN}
          >
            {this.getInfoBtn(UNASSIGN).label}
          </Btn>
        ]}
      </div>
    );
  }
}

export default AssignmentPanel;
