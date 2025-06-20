const express = require('express');
const app = express();
const PORT = 3000;

// Security middleware
app.use((req, res, next) => {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    next();
});

// Main endpoint serving the AngularJS application
app.get('/', (req, res) => {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en" ng-app="widgetApp">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Secure Widget Viewer</title>
        <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.8.2/angular.min.js"></script>
        <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.8.2/angular-sanitize.min.js"></script>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                line-height: 1.6;
            }
            .container {
                border: 1px solid #ddd;
                padding: 20px;
                margin-top: 20px;
                border-radius: 5px;
            }
            .widget-container {
                margin-top: 20px;
                padding: 15px;
                border: 1px solid #eee;
                background-color: #f9f9f9;
            }
            input {
                width: 100%;
                padding: 8px;
                box-sizing: border-box;
                margin-bottom: 10px;
            }
            .instructions {
                color: #666;
                font-size: 0.9em;
                margin-bottom: 20px;
            }
        </style>
    </head>
    <body ng-controller="WidgetController as ctrl">
        <h1>Secure Widget Viewer</h1>
        <div class="instructions">
            Only content from trusted.example.com is allowed. Example: ?url=https://trusted.example.com/widget.html
        </div>
        
        <div class="container">
            <label for="widgetUrl">Widget URL:</label>
            <input type="text" id="widgetUrl" ng-model="ctrl.widgetUrl" placeholder="https://trusted.example.com/widget.html">
            
            <div class="widget-container" ng-if="ctrl.widgetUrl">
                <div ng-include="ctrl.trustedWidgetUrl"></div>
            </div>
        </div>

        <script>
            angular.module('widgetApp', ['ngSanitize'])
                .config(['$sceDelegateProvider', function($sceDelegateProvider) {
                    // Strict whitelist configuration - only allow specific trusted domains
                    $sceDelegateProvider.resourceUrlWhitelist([
                        'self',
                        'https://trusted.example.com/**'  // Only this specific domain is allowed
                    ]);
                }])
                .controller('WidgetController', ['$sce', '$location', function($sce, $location) {
                    const vm = this;
                    
                    // Initialize with URL from query parameter if present and valid
                    const urlParam = $location.search().url;
                    if (urlParam && urlParam.startsWith('https://trusted.example.com/')) {
                        vm.widgetUrl = urlParam;
                        vm.trustedWidgetUrl = $sce.trustAsResourceUrl(vm.widgetUrl);
                    } else {
                        vm.widgetUrl = '';
                    }
                    
                    // Watch for URL changes
                    vm.updateTrustedUrl = function() {
                        if (vm.widgetUrl && vm.widgetUrl.startsWith('https://trusted.example.com/')) {
                            vm.trustedWidgetUrl = $sce.trustAsResourceUrl(vm.widgetUrl);
                        } else {
                            vm.trustedWidgetUrl = null;
                        }
                    };
                }]);
        </script>
    </body>
    </html>
    `;

    res.send(htmlContent);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Secure widget viewer running on http://localhost:${PORT}`);
});