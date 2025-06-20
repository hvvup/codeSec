// secure-doc-viewer-server.js
const express = require('express');
const app = express();
const port = 3000;

// Define trusted domains allowed for embedding documents
const TRUSTED_DOMAINS = [
  'https://docs.google.com',
  'https://example.com',
  'https://file-examples.com',
  'https://www.w3.org'
];

// Backend validation for trusted document URLs
function isTrustedUrl(url) {
  return TRUSTED_DOMAINS.some(domain => url.startsWith(domain));
}

// Serve AngularJS-based frontend as a string
function renderHTML(safeUrl) {
  const whitelist = TRUSTED_DOMAINS.map(domain => `'${domain}/**'`).join(',\n        ');
  const embedUrl = safeUrl ? `'${safeUrl}'` : 'null';

  return `
<!DOCTYPE html>
<html lang="en" ng-app="docApp">
<head>
  <meta charset="UTF-8">
  <title>Secure Document Viewer</title>
  <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.8.2/angular.min.js"></script>
  <script>
    angular.module('docApp', [])
    .config(['$sceDelegateProvider', function($sceDelegateProvider) {
      $sceDelegateProvider.resourceUrlWhitelist([
        'self',
        ${whitelist}
      ]);
    }])
    .controller('DocCtrl', ['$scope', function($scope) {
      $scope.docUrl = ${embedUrl};
    }]);
  </script>
</head>
<body ng-controller="DocCtrl" style="text-align: center; padding-top: 30px;">
  <h2>Secure AngularJS Document Viewer</h2>
  <div ng-if="!docUrl">
    <p style="color: red;">Invalid or untrusted document URL provided.</p>
  </div>
  <div ng-if="docUrl" style="display: flex; justify-content: center;">
    <iframe ng-src="{{docUrl}}" width="80%" height="600px" style="border: 1px solid #ccc;"></iframe>
  </div>
</body>
</html>
`;
}

// Main route: Accept document URL via query string
app.get('/', (req, res) => {
  const inputUrl = (req.query.url || '').trim();
  const valid = isTrustedUrl(inputUrl);
  res.send(renderHTML(valid ? inputUrl : null));
});

// Start the server
app.listen(port, () => {
  console.log(`Secure AngularJS document viewer running at http://localhost:${port}`);
});
