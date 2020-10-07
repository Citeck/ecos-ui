const generateDomId = function(b, a) {
  let d;
  let c = a || 'alf-id';

  do {
    d = c + generateDomId._nId++;
  } while (document.getElementById(d) !== null);

  return d;
};

generateDomId.__proto__._nId = 0;

export default generateDomId;
