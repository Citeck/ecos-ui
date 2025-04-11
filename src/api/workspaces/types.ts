export type WorkspaceType = {
  id: string;
  wsId: string;
  wsName: string;
  homePageLink: string;
  wsDescription: string | null;
  wsImage: string | null;
};

export type WorkspaceFullType = WorkspaceType & {
  hasWrite: boolean;
  isCurrentUserManager: boolean;
  isCurrentUserMember: boolean;
};
