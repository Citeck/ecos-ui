export const BaseRules = {
  min: 3,
  num: 1,
  capital: 1,
  lowercase: 1
};
const baseRulesMap = {
  min: hasMinCountCharacters,
  num: hasNumbers,
  capital: hasCapitalCharacters,
  lowercase: hasLowercaseCharacters
};

function isLetter(character) {
  return character.toUpperCase() !== character.toLowerCase();
}

function isString(word) {
  return typeof word === 'string';
}

function hasMinCountCharacters(word = '', min = BaseRules.min) {
  return isString(word) && word.length >= min;
}

function hasCapitalCharacters(word = '', count = BaseRules.capital) {
  if (!isString(word)) {
    return false;
  }

  const characters = Array.from(word);
  let counter = 0;

  characters.forEach(item => {
    if (isLetter(item) && item === item.toUpperCase()) {
      counter++;
    }
  });

  return counter >= count;
}

function hasLowercaseCharacters(word = '', count = BaseRules.lowercase) {
  if (!isString(word)) {
    return false;
  }

  const characters = Array.from(word);
  let counter = 0;

  characters.forEach(item => {
    if (isLetter(item) && item === item.toLowerCase()) {
      counter++;
    }
  });

  return counter >= count;
}

function hasNumbers(word = '', count = BaseRules.num) {
  if (!isString(word)) {
    return false;
  }

  let counter = 0;

  Array.from(word).forEach(item => {
    if (!isNaN(+item)) {
      counter++;
    }
  });

  return counter >= count;
}

export default function passwordValidator(password, rules = BaseRules) {
  return Object.keys(rules)
    .map(rule => {
      if (typeof rules[rule] === 'function') {
        return rules[rule](password, rules);
      }

      if (!baseRulesMap[rule] || typeof baseRulesMap[rule] !== 'function') {
        return false;
      }

      return baseRulesMap[rule](password, rules[rule]);
    })
    .every(result => result === true);
}
