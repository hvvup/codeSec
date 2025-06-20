const express = require('express');
const app = express();
const PORT = 3000;

// Security middleware
app.use((req, res, next) => {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self' https://trusted-content.example.com");
    next();
});

app.get('/', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html ng-app="markdownApp">
    <head>
        <title>Secure Markdown Viewer</title>
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
            .markdown-container {
                margin: 20px 0;
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
            }
            .error-message {
                color: #d9534f;
            }
            h1 { font-size: 1.8em; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            h2 { font-size: 1.5em; }
            ul { padding-left: 20px; }
            li { margin: 5px 0; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 3px; }
            code { font-family: monospace; }
        </style>
    </head>
    <body ng-controller="MarkdownController as ctrl">
        <h1>Markdown Viewer</h1>
        
        <div>
            <label for="markdownUrl">Markdown URL:</label>
            <input type="text" id="markdownUrl" class="url-input"
                   ng-model="ctrl.markdownUrl"
                   placeholder="https://trusted-content.example.com/document.md">
            <button ng-click="ctrl.loadMarkdown()">Load</button>
            <div class="status-message" ng-show="!ctrl.markdownUrl">
                Enter a markdown file URL from trusted-content.example.com
            </div>
            <div class="error-message" ng-show="ctrl.error">
                {{ctrl.error}}
            </div>
        </div>

        <div class="markdown-container" ng-if="ctrl.htmlContent" ng-bind-html="ctrl.htmlContent">
        </div>

        <script>
            angular.module('markdownApp', [])
                .config(['$sceDelegateProvider', function($sceDelegateProvider) {
                    // Strict whitelist for markdown files
                    $sceDelegateProvider.resourceUrlWhitelist([
                        'self',
                        'https://trusted-content.example.com/**'
                    ]);
                }])
                .controller('MarkdownController', ['$http', '$sce', '$location', function($http, $sce, $location) {
                    const vm = this;
                    vm.htmlContent = null;
                    vm.error = null;
                    
                    // Initialize with URL from query parameter if valid
                    const urlParam = $location.search().url;
                    if (urlParam && urlParam.startsWith('https://trusted-content.example.com/')) {
                        vm.markdownUrl = urlParam;
                        vm.loadMarkdown();
                    }
                    
                    // Simple markdown to HTML conversion
                    vm.convertMarkdown = function(text) {
                        if (!text) return '';
                        
                        // Headers
                        text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');
                        text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
                        
                        // Lists
                        text = text.replace(/^\* (.*$)/gm, '<li>$1</li>');
                        text = text.replace(/<li>.*<\/li>/g, function(match) {
                            return '<ul>' + match + '</ul>';
                        });
                        
                        // Code blocks
                        text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
                        
                        // Inline code
                        text = text.replace(/`(`[^`]+)`/g, '<code>$1</code>');
                        
                        // Paragraphs
                        text = text.replace(/^(?!<[a-z])(.*$)/gm, function(match) {
                            return match.trim() ? '<p>' + match + '</p>' : '';
                        });
                        
                        return $sce.trustAsHtml(text);
                    };
                    
                    // Load markdown from URL
                    vm.loadMarkdown = function() {
                        if (!vm.markdownUrl || !vm.markdownUrl.startsWith('https://trusted-content.example.com/')) {
                            vm.error = "Only trusted-content.example.com is allowed";
                            return;
                        }
                        
                        vm.htmlContent = null;
                        vm.error = null;
                        
                        $http.get(vm.markdownUrl, {responseType: 'text'})
                            .then(function(response) {
                                vm.htmlContent = vm.convertMarkdown(response.data);
                            })
                            .catch(function(err) {
                                vm.error = "Failed to load markdown: " + (err.statusText || "Unknown error");
                            });
                    };
                }]);
        </script>
    </body>
    </html>
    `;
    
    res.send(html);
});

app.listen(PORT, () => {
    console.log(`Secure Markdown viewer running on http://localhost:${PORT}`);
});