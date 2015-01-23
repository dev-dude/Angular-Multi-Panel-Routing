'use strict';

/* global angular */

angular.module('multiPanelApp', [
  'ui.router',
]).config([
  '$stateProvider',
  function($stateProvider) {
    $stateProvider
      .state('root', {
        views: {}
      })
      .state('root.home', {
        url: '/home',
        views: {
          'bodyContent@': {
            templateUrl: 'home.html',
            controller: 'HomeCtrl'
          }
        }
      })
      .state('root.secondState', {
        url: '/secondState',
        views: {
          'bodyContent@': {
            templateUrl: 'secondState.html',
            controller: 'HomeCtrl'
          }
        },
        panelLayout: {
            'rightBottomPanel':{'view':'multi-use-right-panel.html', 'controller':'testBottomPanelController'},
            'rightTopPanel':{'view':'list-items-right-panel.html', 'controller':'testRightPanelController'}
        }
      });
  }
]).run(['$rootScope', '$state', function($rootScope, $state){
    $state.go('root.home');
}]);

angular.module('multiPanelApp')
  .controller('HomeCtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
    /*** Change Views ****/

    $scope.changeView1 = function() {
        // Show MultiPanel View in right bottom panel
        $rootScope.$emit('$changeRightTopPanelView', {'view':'multi-use-right-panel.html', 'controller':'testBottomPanelController'});
    };
    $scope.changeView2 = function() {
        // Show List Item View in right top panel
        $rootScope.$emit('$changeRightBottomPanelView', {'view':'list-items-right-panel.html', 'controller': 'testRightPanelController'});
    };

    $scope.addListItem = function() {
        // AddListItem
        $rootScope.$emit('$addListItems');
    };

    $scope.displayMultiPanelManagement = function() {
        // Display Current Layout
        $rootScope.$emit('$displayMultiPanelManagement');
    };

    /*** End Change Views ****/
}]);


/**
 * Master Multi Panel Service.  Multi Panel Management Service
 */

/* global alert */

angular.module('multiPanelApp')
    .factory('MultiPanelManagement', [
        function () {
            // Service logic
            var panelLayout = {
                'rightTop': {'controller':'', 'view': '', 'params': {}},
                'rightBottom': {'controller':'', 'view': '', 'params': {}}
            };

            function setPanelData(panelName, panelData) {
                panelLayout[panelName] = panelData;
            }

            function getPanelData() {
                return panelLayout;
            }

            // Public API here
            return {
                setPanelLayout: function (panelName, panelData) {
                    setPanelData(panelName, panelData);
                },
                getPanelLayout: function () {
                    return getPanelData();
                }
            };
        }
    ]).run(['MultiPanelManagement', '$rootScope', function(MultiPanelManagement, $rootScope){
        $rootScope.$on('$displayMultiPanelManagement',function() {
            alert(JSON.stringify(MultiPanelManagement.getPanelLayout()));
        });
        // Compare Active Template layout from state definitions to current one
        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState) {
            console.log(toParams);
            console.log(fromState);
            if (toState.hasOwnProperty('panelLayout')) {
                var currentMultiPanelLayout = MultiPanelManagement.getPanelLayout(),
                    rightTopPanelObj = toState.panelLayout.rightTopPanel,
                    rightBottomPanelObj = toState.panelLayout.rightBottomPanel;

                // Test Against Existing Panel Layout
                if (currentMultiPanelLayout.rightTop.view !== rightTopPanelObj.view) {
                    $rootScope.$emit('$changeRightTopPanelView', {'view':rightTopPanelObj.view, 'controller':rightTopPanelObj.controller});
                }
                if (currentMultiPanelLayout.rightBottom.view !== rightBottomPanelObj.view) {
                    $rootScope.$emit('$changeRightBottomPanelView', {'view': rightBottomPanelObj.view, 'controller': rightBottomPanelObj.controller});
                }
            }
        });
    }]);
    
    
    'use strict';
    
/** Empty Controller Shell - (currently set for top right panel) **/
    
angular.module('multiPanelApp')
    .controller('testBottomPanelController', ['$scope',
        function ($scope) {
            $scope.pageNumber = 1;
            $scope.clickMe = function() {
                alert('clicked multi panel controller');
                $scope.pageNumber =  $scope.pageNumber + 24;
            };
        }
    ]);
    
/** List Items Test Controller (currently set for bottom right panel) -  */
  
angular.module('multiPanelApp')
    .controller('testRightPanelController', ['$scope', '$rootScope',
        function ($scope, $rootScope) {
        
          function loadListItems() {
             $scope.listItems = [
                 {date:'10/23/10', name: 'stuff', count: '1'},
                 {date:'9/1/12', name: 'happy', count: '2'},
                 {date:'11/6/13', name: 'laugh', count: '3'},
                 {date:'1/21/11', name: 'fun', count: '4'},
                 {date:'6/10/09', name: 'help', count: '5'}
             ]
          }
          $scope.pageNumber = 5;
          $scope.clickMe = function() {
              alert('clicked test right panel controller (list items)');
              $scope.pageNumber =  $scope.pageNumber + 10;
          };
            loadListItems();

          $rootScope.$on('$addListItems',function() {
              var listItem = {date:'6/10/09', name: 'help', count: '5'}
              $scope.listItems.push(listItem);
          });

    }]);

/**
 * Right Bottom Panel Directive
 * Currently Separate Scopes. Can Share By remove scope parameter.
 */

angular.module('multiPanelApp')
    .directive('rightBottom', [
        '$http',
        '$templateCache',
        '$compile',
        '$parse',
        '$rootScope',
        '$injector',
        'MultiPanelManagement',
        '$controller',
        function($http, $templateCache, $compile, $parse, $rootScope, $injector, MultiPanelManagement, $controller) {
            return {
                replace: true,
                restrict: 'E',
                scope: true,
                link: function(scope , iElement) {
                    var changeView = function(view, controller) {
                        // Get and Cache the desired view
                        $http.get(view, {cache: $templateCache}).success(function(tplContent){

                            // Multi Panel management controller what is in what panel
                            MultiPanelManagement.setPanelLayout('rightBottom',{controller:controller,view:view});

                            //Inject Necessary controller
                            var ctrl = $controller(controller, {$scope: scope});

                            // Inject Scope from controller to give all methods from controller access
                            iElement.html(tplContent);
                            $compile(iElement.contents())(scope);

                        });

                        // Changes local Scope
                        scope.templateName = view;
                    };
                    $rootScope.$on('$changeRightBottomPanelView', function(ev, data) {
                        // Check if directive has existing view loaded 
                         var currentMultiPanelLayout = MultiPanelManagement.getPanelLayout();
        
                        // Test Against Existing Panel Layout
                        if (currentMultiPanelLayout.rightBottom.view !== data.view) {
                          changeView(data.view, data.controller);
                        } else {
                          console.log('view loaded already');
                        }
                    });

                }
            };
        }
    ]);
    
    
    'use strict';

/**
 * Right Top Panel Directive
 * Currently Separate Scopes. Can Share By remove scope parameter.
 */

angular.module('multiPanelApp')
    .directive('rightTop', [
        '$http',
        '$templateCache',
        '$compile',
        '$parse',
        '$rootScope',
        '$injector',
        'MultiPanelManagement',
        '$controller',
        function($http, $templateCache, $compile, $parse, $rootScope, $injector, MultiPanelManagement, $controller) {
            return {
                replace: true,
                restrict: 'E',
                scope: true,
                link: function(scope , iElement) {
                    var changeView = function(view, controller) {
                        // Get and Cache the desired view
                        $http.get(view, {cache: $templateCache}).success(function(tplContent){

                            // Multi Panel management controller what is in what panel
                            MultiPanelManagement.setPanelLayout('rightTop',{controller:controller,view:view});

                            //Inject Necessary Controller
                            var ctrl = $controller(controller, {$scope: scope});

                            // Inject Scope from controller to give all methods from controller access
                            iElement.html(tplContent);
                            $compile(iElement.contents())(scope);

                        });

                        // Changes local Scope
                        scope.templateName = view;
                    };
                    $rootScope.$on('$changeRightTopPanelView', function(ev, data) {
                      
                        // Check if directive has existing view loaded 
                        var currentMultiPanelLayout = MultiPanelManagement.getPanelLayout();
                      
                        // Test Against Existing Panel Layout
                        if (currentMultiPanelLayout.rightTop.view !== data.view) {
                          changeView(data.view, data.controller);
                        } else {
                          console.log('view loaded already');
                        }
                    });

                }
            };
        }
    ]);
    

  