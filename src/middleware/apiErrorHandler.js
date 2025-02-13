export default function apiErrorHandler(err, req, res, _) {
  console.error("API Error:", err.message);
  res.status(500).json({ error: err.message || "Internal Server Error" });
}
// This middleware function handles errors that occur in the API.
