export const getValue = option => {
  const version = option.version ? option.version : `inner_${option.innerVersion}`;

  return String(version);
};
