export function validateNumericParam(paramName) {
  return function (req, res, next) {
    const value = Number(req.params[paramName]);
    if (isNaN(value)) {
      return res.status(400).json({ error: `Invalid ${paramName} provided.` });
    }
    next();
  };
}
