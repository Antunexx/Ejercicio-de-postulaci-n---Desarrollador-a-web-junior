function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || 'Internal Server Error'
  });
}

module.exports = errorHandler;
