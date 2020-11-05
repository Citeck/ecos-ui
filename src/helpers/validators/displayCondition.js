export function isValid(condition) {
  try {
    const jsonCondition = !condition || JSON.parse(condition);

    return !condition || Array.isArray(jsonCondition) || typeof jsonCondition === 'object';
  } catch (e) {
    console.log(e);
    return false;
  }
}
