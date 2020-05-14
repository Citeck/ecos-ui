import PropTypes from 'prop-types';

export const ItemInterface = {
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  dndIdx: PropTypes.number,
  name: PropTypes.string,
  icon: PropTypes.shape({
    type: PropTypes.string,
    value: PropTypes.string
  }),
  bage: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  selected: PropTypes.bool,
  multiple: PropTypes.bool,
  mandatory: PropTypes.bool,
  locked: PropTypes.bool,
  items: PropTypes.array,
  actionConfig: PropTypes.array
};

export const Labels = {
  EMPTY: 'tree-component.empty',
  TIP_CANT_CHANGE: 'tree-component.tooltip.cannot-be-changes'
};

export const STEP_LVL = 1;
export const TOP_LVL = 1;
