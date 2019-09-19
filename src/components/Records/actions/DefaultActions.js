import Records from '../Records';

export const EditAction = {
  execute: context => {}
};

export const ViewAction = {
  execute: context => {
    this.goToCardDetailsPage;
  }
};

export const DownloadAction = {
  execute: ({ record }) => {},

  getAttributesToPreload: () => {
    return {
      hasContent: '.has(n:"cm:content")'
    };
  },

  canBeExecuted: context => {
    return context.record('');
  }
};
