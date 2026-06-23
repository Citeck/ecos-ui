import React, { useContext } from 'react';

import ButtonsPanel from './ButtonsPanel';
import { TypePermissionsEditorContext } from './Context';
import TypePermissionsGrid from './TypePermissionsGrid';

import { Loader } from '@/components/common';

const TypePermissionsEditor = () => {
  const context = useContext(TypePermissionsEditorContext);
  const { error, isReady } = context;

  if (error) {
    return <div className="type-permissions-editor__error">{error}</div>;
  }

  if (!isReady) {
    return <Loader blur rounded style={{ position: 'relative' }} />;
  }

  return (
    <>
      <TypePermissionsGrid />
      <ButtonsPanel />
    </>
  );
};

export default TypePermissionsEditor;
