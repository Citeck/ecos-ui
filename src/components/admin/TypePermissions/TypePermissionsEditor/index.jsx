import React from 'react';

import TypePermissionsEditorRoot from './TypePermissionsEditor';
import TypePermissionsEditorPropTypes from './TypePermissionsEditorPropTypes';
import { TypePermissionsEditorContextProvider } from './TypePermissionsEditorProvider';

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
