const express = require('express');
const app = express();
const PORT = 3000;

// Security middleware
app.use((req, res, next) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Serve static HTML with AngularJS
app.get('/', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html ng-app="videoApp">
    <head>
        <title>Secure YouTube Embed</title>
        <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.8.2/angular.min.js"></script>
        <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.8.2/angular-sanitize.js"></script>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .video-container { margin: 20px 0; position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; }
            .video-container iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
            .url-input { width: 100%; padding: 8px; margin: 10px 0; box-sizing: border-box; }
        </style>
    </head>
    <body ng-controller="VideoController as vm">
        <h1>Secure YouTube Embed</h1>
        <p>Enter a YouTube embed URL:</p>
        <input type="text" class="url-input" ng-model="vm.videoUrl" placeholder="https://www.youtube.com/embed/...">
        <div class="video-container" ng-if="vm.videoUrl">
            <iframe ng-src="{{vm.trustedUrl}}" frameborder="0" allowfullscreen></iframe>
        </div>
        
        <script>
            angular.module('videoApp', ['ngSanitize'])
                .config(['$sceDelegateProvider', function($sceDelegateProvider) {
                    // Strict whitelist for trusted resources
                    $sceDelegateProvider.resourceUrlWhitelist([
                        'self',
                        'https://www.youtube.com/embed/**'
                    ]);
                }])
                .controller('VideoController', ['$sce', '$location', function($sce, $location) {
                    const vm = this;
                    
                    // Initialize with URL from query parameter if present
                    const urlParam = $location.search().url;
                    vm.videoUrl = urlParam && urlParam.startsWith('https://www.youtube.com/embed/') 
                        ? urlParam 
                        : '';
                    
                    // Watch for changes to videoUrl to update trustedUrl
                    vm.trustedUrl = $sce.trustAsResourceUrl(vm.videoUrl);
                    
                    // Update trusted URL when videoUrl changes
                    vm.$watch = function() {
                        if (vm.videoUrl && vm.videoUrl.startsWith('https://www.youtube.com/embed/')) {
                            vm.trustedUrl = $sce.trustAsResourceUrl(vm.videoUrl);
                        } else {
                            vm.trustedUrl = null;
                        }
                    };
                }]);
        </script>
    </body>
    </html>
    `;
    
    res.send(html);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running securely on http://localhost:${PORT}`);
});