const express = require('express');
const app = express();
const PORT = 3000;

// Security middleware
app.use((req, res, next) => {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self' https://trusted-templates.example.com");
    next();
});

app.get('/', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html ng-app="commentApp">
    <head>
        <title>Secure Comment Section</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.8.2/angular.min.js"></script>
        <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.8.2/angular-sanitize.min.js"></script>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            .comment-container {
                margin: 30px 0;
                padding: 20px;
                border: 1px solid #e0e0e0;
                border-radius: 5px;
                background-color: #f9f9f9;
            }
            .url-input {
                width: 100%;
                padding: 10px;
                margin: 10px 0;
                box-sizing: border-box;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            .status-message {
                color: #666;
                font-style: italic;
                margin: 10px 0;
            }
            h1 {
                color: #333;
            }
        </style>
    </head>
    <body ng-controller="CommentController as ctrl">
        <h1>Comment Section</h1>
        
        <div>
            <label for="templateUrl">Template URL:</label>
            <input type="text" id="templateUrl" class="url-input" 
                   ng-model="ctrl.templateUrl" 
                   placeholder="https://trusted-templates.example.com/comments.html">
            <div class="status-message" ng-show="!ctrl.templateUrl">
                Enter a template URL from trusted-templates.example.com
            </div>
        </div>

        <div class="comment-container" ng-if="ctrl.trustedTemplateUrl">
            <div ng-include="ctrl.trustedTemplateUrl"></div>
        </div>

        <script>
            angular.module('commentApp', ['ngSanitize'])
                .config(['$sceDelegateProvider', function($sceDelegateProvider) {
                    // Strictly whitelist only our trusted template domain
                    $sceDelegateProvider.resourceUrlWhitelist([
                        'self',
                        'https://trusted-templates.example.com/**'
                    ]);
                    
                    // Block everything else
                    $sceDelegateProvider.resourceUrlBlacklist([
                        '*'
                    ]);
                }])
                .controller('CommentController', ['$sce', '$location', function($sce, $location) {
                    const vm = this;
                    
                    // Initialize with URL from query parameter if valid
                    const urlParam = $location.search().url;
                    if (urlParam && urlParam.startsWith('https://trusted-templates.example.com/')) {
                        vm.templateUrl = urlParam;
                        vm.updateTrustedUrl();
                    }
                    
                    // Update the trusted URL when input changes
                    vm.updateTrustedUrl = function() {
                        if (vm.templateUrl && vm.templateUrl.startsWith('https://trusted-templates.example.com/')) {
                            vm.trustedTemplateUrl = $sce.trustAsResourceUrl(vm.templateUrl);
                        } else {
                            vm.trustedTemplateUrl = null;
                        }
                    };
                    
                    // Watch for URL changes
                    vm.$watch = function() {
                        vm.updateTrustedUrl();
                    };
                }]);
        </script>
    </body>
    </html>
    `;
    
    res.send(html);
});

app.listen(PORT, () => {
    console.log(`Secure comment server running on http://localhost:${PORT}`);
});