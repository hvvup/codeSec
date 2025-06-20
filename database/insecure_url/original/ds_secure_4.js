const express = require('express');
const app = express();
const PORT = 3000;

// Security middleware
app.use((req, res, next) => {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self' https://trusted-api.example.com");
    next();
});

app.get('/', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html ng-app="jsonpApp">
    <head>
        <title>Secure JSONP Data Viewer</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.8.2/angular.min.js"></script>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            .data-container {
                margin: 20px 0;
                padding: 15px;
                border: 1px solid #e0e0e0;
                border-radius: 5px;
                background-color: #f9f9f9;
            }
            .data-item {
                padding: 8px;
                margin: 5px 0;
                background-color: white;
                border: 1px solid #ddd;
                border-radius: 3px;
            }
            .url-input {
                width: 100%;
                padding: 10px;
                margin: 10px 0;
                box-sizing: border-box;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            .status {
                color: #666;
                font-style: italic;
            }
            .error {
                color: #d9534f;
            }
        </style>
    </head>
    <body ng-controller="JsonpController as ctrl">
        <h1>JSONP Data Viewer</h1>
        
        <div>
            <label for="apiUrl">JSONP API URL:</label>
            <input type="text" id="apiUrl" class="url-input"
                   ng-model="ctrl.apiUrl"
                   placeholder="https://trusted-api.example.com/data?callback=JSON_CALLBACK">
            <button ng-click="ctrl.fetchData()">Fetch Data</button>
            <div class="status" ng-show="!ctrl.apiUrl">
                Enter a JSONP URL from trusted-api.example.com containing 'callback=JSON_CALLBACK'
            </div>
            <div class="error" ng-show="ctrl.error">
                {{ctrl.error}}
            </div>
        </div>

        <div class="data-container" ng-if="ctrl.data">
            <h3>Data Results:</h3>
            <div class="data-item" ng-repeat="item in ctrl.data">
                {{item.name || item.title || item.id}}
            </div>
        </div>

        <script>
            angular.module('jsonpApp', [])
                .config(['$sceDelegateProvider', function($sceDelegateProvider) {
                    // Strict whitelist for JSONP endpoints
                    $sceDelegateProvider.resourceUrlWhitelist([
                        'self',
                        'https://trusted-api.example.com/**'
                    ]);
                }])
                .controller('JsonpController', ['$http', '$sce', '$location', function($http, $sce, $location) {
                    const vm = this;
                    vm.data = null;
                    vm.error = null;
                    
                    // Initialize with URL from query parameter if valid
                    const urlParam = $location.search().url;
                    if (urlParam && urlParam.includes('callback=JSON_CALLBACK') && 
                        urlParam.startsWith('https://trusted-api.example.com/')) {
                        vm.apiUrl = urlParam;
                    }
                    
                    // Fetch JSONP data
                    vm.fetchData = function() {
                        if (!vm.apiUrl || !vm.apiUrl.includes('callback=JSON_CALLBACK')) {
                            vm.error = "URL must contain 'callback=JSON_CALLBACK'";
                            return;
                        }
                        
                        if (!vm.apiUrl.startsWith('https://trusted-api.example.com/')) {
                            vm.error = "Only trusted-api.example.com is allowed";
                            return;
                        }
                        
                        vm.data = null;
                        vm.error = null;
                        
                        $http.jsonp(vm.apiUrl)
                            .then(function(response) {
                                vm.data = response.data;
                            })
                            .catch(function(err) {
                                vm.error = "Failed to load data: " + (err.statusText || "Unknown error");
                            });
                    };
                    
                    // Auto-fetch if valid URL provided in query params
                    if (vm.apiUrl) {
                        vm.fetchData();
                    }
                }]);
        </script>
    </body>
    </html>
    `;
    
    res.send(html);
});

app.listen(PORT, () => {
    console.log(`Secure JSONP server running on http://localhost:${PORT}`);
});