import React from 'react';

import TypePermissionsEditorPropTypes from './TypePermissionsEditorPropTypes';
import TypePermissionsEditorRoot from './TypePermissionsEditor';
import { TypePermissionsEditorContextProvider } from './TypePermissionsEditorContext';

import './styles.scss';

const TypePermissionsEditor = props => {
  return (
    <TypePermissionsEditorContextProvider controlProps={props}>
      <TypePermissionsEditorRoot />
    </TypePermissionsEditorContextProvider>
  );
};

TypePermissionsEditor.propTypes = TypePermissionsEditorPropTypes;

export default TypePermissionsEditor;
