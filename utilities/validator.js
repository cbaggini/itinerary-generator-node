const itineraryInputValidation = (body) => {
  if (!Array.isArray(body.coordinates)) return false;
  if (body.coordinates.length !== 2) return false;
  if (body.coordinates[0].length !== 2) return false;
  if (!parseInt(body.radius)) return false;
  if (!Array.isArray(body.categories)) return false;
  if (body.categories.length === 0) return false;
  if (body.categories.length > 5) return false;
  return true;
};

module.exports = { itineraryInputValidation };
