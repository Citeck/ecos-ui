const WORKSPACE_PREFIX = 'workspace://SpacesStore/';

export const getAuthorityNameFromAlfresco = async (nodeRef: string): Promise<string> => {
  const workspacePrefixIdx = nodeRef.indexOf(WORKSPACE_PREFIX);

  if (workspacePrefixIdx === -1) {
    return nodeRef;
  }

  if (workspacePrefixIdx === nodeRef.length - WORKSPACE_PREFIX.length) {
    return '';
  }

  return nodeRef.substring(workspacePrefixIdx + WORKSPACE_PREFIX.length);
};
