import CustomRules from 'cmmn-js/lib/features/rules/CmmnRules';

console.warn({ CustomRules });

const originCanConnect = CustomRules.prototype.canConnect;

CustomRules.prototype.canConnect = function(source, target, connection) {
  const result = originCanConnect.call(this, source, target, connection);

  // console.warn('canConnect => ', { source, target, connection, result });

  return result;
};

export default CustomRules;
