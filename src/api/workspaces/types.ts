export type WorkspaceType = {
  id: string;
  homePageLink: string | null;
  name: string;
  description: string | null;
  image: string | null;
  isCurrentUserMember: boolean;
  isCurrentUserManager: boolean;
  isCurrentUserDirectMember: boolean;
  isCurrentUserLastManager: boolean;
  visibility: VisibilityType;
  hasWrite: boolean;
};

export type VisibilityType = 'PUBLIC' | 'PRIVATE';
