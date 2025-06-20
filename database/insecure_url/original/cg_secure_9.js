// secure-image-link-server.js
const express = require('express');
const app = express();
const port = 3000;

// Whitelisted trusted domains
const TRUSTED_DOMAINS = [
  'https://upload.wikimedia.org',
  'https://images.unsplash.com',
  'https://cdn.pixabay.com',
  'https://example.com'
];

// Helper to validate if a URL is from a trusted domain
function isTrusted(url) {
  return TRUSTED_DOMAINS.some(domain => url.startsWith(domain));
}

// HTML page generator with AngularJS
function renderPage(imgUrl, linkUrl) {
  const angularWhitelist = TRUSTED_DOMAINS.map(domain => `'${domain}/**'`).join(',\n        ');
  const imgValue = imgUrl ? `'${imgUrl}'` : 'null';
  const linkValue = linkUrl ? `'${linkUrl}'` : 'null';

  return `
<!DOCTYPE html>
<html lang="en" ng-app="secureApp">
<head>
  <meta charset="UTF-8">
  <title>Secure Image Link Viewer</title>
  <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.8.2/angular.min.js"></script>
  <script>
    angular.module('secureApp', [])
    .config(['$sceDelegateProvider', function($sceDelegateProvider) {
      $sceDelegateProvider.resourceUrlWhitelist([
        'self',
        ${angularWhitelist}
      ]);
    }])
    .controller('MainCtrl', ['$scope', function($scope) {
      $scope.imageUrl = ${imgValue};
      $scope.linkUrl = ${linkValue};
    }]);
  </script>
</head>
<body ng-controller="MainCtrl" style="text-align:center; padding-top:50px;">
  <h2>Secure AngularJS Image Link</h2>
  <div ng-if="!imageUrl || !linkUrl">
    <p style="color:red;">Missing or untrusted image/link URL.</p>
  </div>
  <div ng-if="imageUrl && linkUrl">
    <a ng-href="{{linkUrl}}" target="_blank">
      <img ng-src="{{imageUrl}}" alt="Secure Image" style="max-width:80%; border:2px solid #ccc; padding:10px;">
    </a>
    <p><small>Click the image to visit the link.</small></p>
  </div>
</body>
</html>
`;
}

// Main route
app.get('/', (req, res) => {
  const imgUrl = (req.query.img || '').trim();
  const linkUrl = (req.query.link || '').trim();
  const safeImg = isTrusted(imgUrl);
  const safeLink = isTrusted(linkUrl);
  res.send(renderPage(safeImg ? imgUrl : null, safeLink ? linkUrl : null));
});

// Start server
app.listen(port, () => {
  console.log(`Secure image-link server running at http://localhost:${port}`);
});
