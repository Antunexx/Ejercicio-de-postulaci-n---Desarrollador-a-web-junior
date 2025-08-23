function errorHandler(err, req, res, next) {
    console.error("❌ Error:", err.message);
  if (err.message && err.message.includes("connect")) {
    return res.status(400).json({
      code: 400,
      errors: "could not connect to db"
    });
  }

  res.status(500).json({
    code: 500,
    errors: "internal server error"
  });
}

module.exports = errorHandler;
