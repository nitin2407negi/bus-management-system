const generateTicketNumber = () => {
  return (
    'TKT' +
    Date.now() +
    Math.random().toString(36).substr(2, 4).toUpperCase()
  );
};

const generatePackageNumber = () => {
  return (
    'PKG' +
    Date.now() +
    Math.random().toString(36).substr(2, 4).toUpperCase()
  );
};

module.exports = {
  generateTicketNumber,
  generatePackageNumber,
};
