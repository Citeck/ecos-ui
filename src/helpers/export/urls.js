export const NEW_VERSION_PREFIX = '/v2';

export const isNewVersionPage = (link = window.location.pathname) => {
  const linkValue = link || '';
  return linkValue.includes(NEW_VERSION_PREFIX) || isNewVersionSharePage(linkValue);
};

export const isNewVersionSharePage = (link = window.location.pathname) => {
  return /(share\/.+-page-v2.*)|(legacy.*)/.test(link || '');
};
