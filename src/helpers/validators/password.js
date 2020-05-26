const Rules = {
  min: 3,
  num: 1,
  capital: 1,
  lowercase: 1
};
const rulesMap = {
  min: hasMinCountCharacters,
  num: hasNumbers,
  capital: hasCapitalCharacters,
  lowercase: hasLowercaseCharacters
};

function isString(word) {
  return typeof word === 'string';
}

function hasMinCountCharacters(word = '', min = Rules.min) {
  return isString(word) && word.length >= min;
}

function hasCapitalCharacters(word = '', count = Rules.capital) {
  if (!isString(word)) {
    return false;
  }

  const characters = Array.from(word);
  let counter = 0;

  characters.forEach(item => {
    if (isNaN(+item) && item === item.toUpperCase()) {
      counter++;
    }
  });

  return counter >= count;
}

function hasLowercaseCharacters(word = '', count = Rules.lowercase) {
  if (!isString(word)) {
    return false;
  }

  const characters = Array.from(word);
  let counter = 0;

  characters.forEach(item => {
    if (isNaN(+item) && item === item.toLowerCase()) {
      counter++;
    }
  });

  return counter >= count;
}

function hasNumbers(word = '', count = Rules.num) {
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

export default function passwordValidator(password, rules = Rules) {
  return Object.keys(rules)
    .map(rule => {
      if (typeof rules[rule] === 'function') {
        return rules[rule](password, rules);
      }

      if (!rulesMap[rule] || typeof rulesMap[rule] !== 'function') {
        return false;
      }

      return rulesMap[rule](password, rules[rule]);
    })
    .every(result => result === true);
}
