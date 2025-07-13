// Add a helper function to HTML-encode output
function encodeOutput(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Use it in the response:
return res.json({
  employeeId: encodeOutput(employeeId.trim()),
  salary: encodeOutput(result[0].nodeValue)
});