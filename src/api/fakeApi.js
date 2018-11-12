export const fakeApi = {
  validateUser: () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          payload: {
            fullName: 'Administrator',
            nodeRef: 'workspace://SpacesStore/a6ce05f5-bd4b-4196-a12f-a5601a2fa0cd',
            isAvailable: true,
            isMutable: true
          }
        });
      }, 0);
    });
  },

  getIsCascadeCreateVariantMenu: () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(true);
      }, 0);
    });
  },

  getIsExternalAuthentication: () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(false);
      }, 0);
    });
  }
};
