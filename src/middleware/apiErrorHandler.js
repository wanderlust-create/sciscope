export default function apiErrorHandler(err, req, res, _next) {
  console.error("API Error:", err.message);
  res.status(500).json({ error: err.message || "Internal Server Error" });
}
