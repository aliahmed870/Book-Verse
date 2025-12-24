const xss = require('xss');

const sanitizeString = (input) => {
  if (typeof input === 'string') {
    return xss(input);
  }
  return input;
};

const deepSanitize = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(deepSanitize);
  }

  for (let key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      obj[key] = deepSanitize(obj[key]);
    }
  }
  return obj;
};

const xssSanitizerMiddleware = (req, res, next) => {
  if (req.body) {
    deepSanitize(req.body);
  }

  if (req.query) {
    deepSanitize(req.query);
  }

  if (req.params) {
    deepSanitize(req.params);
  }

  next();
};

module.exports = xssSanitizerMiddleware;
