// secure-font-loader-server.js
const express = require('express');
const app = express();
const port = 3000;

// Whitelisted font CSS domains
const TRUSTED_FONT_DOMAINS = [
  'https://fonts.googleapis.com',
  'https://cdn.jsdelivr.net',
  'https://use.typekit.net'
];

// Validate input URL against whitelist
function isTrustedCssUrl(url) {
  return TRUSTED_FONT_DOMAINS.some(domain => url.startsWith(domain));
}

// Render AngularJS HTML with font link injected dynamically
function generatePage(cssUrl) {
  const angularWhitelist = TRUSTED_FONT_DOMAINS.map(d => `'${d}/**'`).join(',\n        ');
  const safeCss = cssUrl ? `'${cssUrl}'` : 'null';

  return `
<!doctype html>
<html ng-app="fontApp">
<head>
  <meta charset="utf-8">
  <title>Secure Font Loader</title>
  <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.8.2/angular.min.js"></script>
  <script>
    angular.module('fontApp', [])
    .config(['$sceDelegateProvider', function($sceDelegateProvider) {
      $sceDelegateProvider.resourceUrlWhitelist([
        'self',
        ${angularWhitelist}
      ]);
    }])
    .controller('FontCtrl', ['$scope', function($scope) {
      $scope.fontCss = ${safeCss};
    }]);
  </script>
</head>
<body ng-controller="FontCtrl" style="text-align:center; padding-top:50px;">
  <h2>Secure AngularJS Font Demo</h2>
  <link ng-if="fontCss" ng-href="{{fontCss}}" rel="stylesheet">
  <p style="font-family: 'Roboto', sans-serif; font-size: 24px;">
    This text will use your custom font if the URL is trusted.
  </p>
  <p ng-if="!fontCss" style="color: red;">No valid font URL provided or domain is not trusted.</p>
</body>
</html>
`;
}

// Main route: render AngularJS page
app.get('/', (req, res) => {
  const cssUrl = (req.query.url || '').trim();
  const safe = isTrustedCssUrl(cssUrl);
  res.send(generatePage(safe ? cssUrl : null));
});

// Start server
app.listen(port, () => {
  console.log(`Secure AngularJS font server running at http://localhost:${port}`);
});
