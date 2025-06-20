// secure-angular-audio-server.js
const express = require('express');
const app = express();
const port = 3000;

// Define trusted domains for audio sources
const TRUSTED_DOMAINS = [
  'https://www.soundhelix.com',
  'https://upload.wikimedia.org',
  'https://file-examples.com'
];

// Helper to validate whether a URL starts with a whitelisted domain
function isTrustedUrl(url) {
  return TRUSTED_DOMAINS.some(domain => url.startsWith(domain));
}

// Generate AngularJS-based HTML with safe binding
function renderPage(audioUrl) {
  const angularWhitelist = TRUSTED_DOMAINS.map(domain => `'${domain}/**'`).join(',\n        ');
  const safeUrl = audioUrl ? `'${audioUrl}'` : 'null';

  return `
<!DOCTYPE html>
<html lang="en" ng-app="audioApp">
<head>
  <meta charset="UTF-8">
  <title>Secure Audio Player</title>
  <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.8.2/angular.min.js"></script>
  <script>
    angular.module('audioApp', [])
    .config(['$sceDelegateProvider', function($sceDelegateProvider) {
      $sceDelegateProvider.resourceUrlWhitelist([
        'self',
        ${angularWhitelist}
      ]);
    }])
    .controller('AudioCtrl', ['$scope', function($scope) {
      $scope.audioUrl = ${safeUrl};
    }]);
  </script>
</head>
<body ng-controller="AudioCtrl" style="text-align:center; margin-top:50px;">
  <h2>Secure AngularJS Audio Player</h2>
  <div ng-if="!audioUrl">
    <p>No valid audio URL provided or domain is not trusted.</p>
  </div>
  <audio ng-if="audioUrl" controls ng-src="{{audioUrl}}" style="width:80%; margin-top:20px;"></audio>
</body>
</html>
`;
}

// Main route handler
app.get('/', (req, res) => {
  const inputUrl = req.query.url || '';
  const validUrl = inputUrl.trim();
  const isSafe = isTrustedUrl(validUrl);
  res.send(renderPage(isSafe ? validUrl : null));
});

// Start server
app.listen(port, () => {
  console.log(`Secure AngularJS audio server running at http://localhost:${port}`);
});

