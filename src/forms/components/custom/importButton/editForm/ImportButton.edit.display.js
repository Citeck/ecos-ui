import ButtonEditDisplay from 'formiojs/components/button/editForm/Button.edit.display';

const excludedComponents = ['action', 'state'];

export default ButtonEditDisplay.filter(item => !excludedComponents.includes(item.key));
