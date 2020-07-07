import PropTypes from 'prop-types';

export const StateAssignPropTypes = {
  claimable: PropTypes.bool,
  releasable: PropTypes.bool,
  reassignable: PropTypes.bool,
  assignable: PropTypes.bool
};

export const TaskPropTypes = {
  id: PropTypes.string,
  formKey: PropTypes.string,
  title: PropTypes.string,
  actors: PropTypes.string,
  sender: PropTypes.string,
  lastcomment: PropTypes.string,
  started: PropTypes.any,
  deadline: PropTypes.any,
  stateAssign: PropTypes.shape(StateAssignPropTypes)
};
