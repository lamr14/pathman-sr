(function(app){

	var PathSetupCtrl = function($scope, PathListService, NextTopologyService, SharedDataService) {

		$scope.isAutoPathFormInvalid = isAutoPathFormInvalid;
		$scope.computePaths = computePaths;
		$scope.highlightPath = highlightPath;
		$scope.clearPathLayer = clearPathLayer;
		$scope.registerPath = registerPath;
		$scope.backToSetup = backToSetup;
		$scope.removePathByType = removePathByType;
		$scope.deployPath = deployPath;

		$scope.validCostMetrics = ['igp', 'hops'];
		$scope.autoPathFormLoadingStatus = false;
		$scope.computedPaths = [];
		$scope.computedMetrics = [];

		// "scopify" shared data
		$scope.shared = SharedDataService.data;

		SharedDataService.data.pathSetupMode = "search";

		/* Implementation */

		/**
		 * Test form elements if input is invalid
		 * @returns {boolean} True if invalid, false if valid
		 */
		function isAutoPathFormInvalid(){

			if(!$scope.hasOwnProperty("psForm")){
				return true;
			}
			else if(!$scope.hasOwnProperty("autoPathForm")){
				return true;
			}
			else{

				// if form invalid
				if($scope.autoPathForm.$invalid){
					return true;
				}

				// if source == dest
				if($scope.psForm.hasOwnProperty('source') && $scope.psForm.hasOwnProperty('destination')){
					if($scope.psForm.source == $scope.psForm.destination){
						return true;
					}
				}
				else{
					return true;
				}

				// if cost metrics are not chosen
				if($scope.validCostMetrics.indexOf($scope.psForm.costMetric) === -1){
					return true;
				}
			}

			return false;

		}


		/**
		 * Based on input, compute paths
		 */
		function computePaths(){

			// view settings
			$scope.autoPathFormLoadingStatus = true;
			$scope.computedPaths = [];
			$scope.computedMetrics = [];

			if($scope.isAutoPathFormInvalid()){
				$scope.autoPathFormLoadingStatus = false;
			}

			// form is valid
			else{
				PathListService.computePathListByConfig(

					// config
					{
						source: $scope.psForm.source,
						destination: $scope.psForm.destination,
						costMetric: $scope.psForm.costMetric
					},

					// success
					function(data){
						$scope.autoPathFormLoadingStatus = false;

						// assign computed values
						$scope.computedPaths = data.path;
						$scope.computedMetrics = data.metric;

					},

					// error
					function(err){
						$scope.autoPathFormLoadingStatus = false;
						console.error(err);
						// todo: handle errors
					}
				);
			}
		}

		/**
		 * Highlight path by nodes' names
		 * @param topo {Object} NeXt topology object
		 * @param pathList {Array}
		 * @param pathType
		 */
		function highlightPath(topo, pathList, pathType){
			NextTopologyService.addPath(topo, pathList, pathType);
		}

		/**
		 * Clear path layer
		 * @param topo
		 */
		function clearPathLayer(topo){
			NextTopologyService.clearPathLayer(topo);
		}


		// Go to step 2: select a name and deploy path
		function registerPath(topo, pathSet){
			SharedDataService.data.pathSetupMode = "register-path";
			SharedDataService.data.pathDeploymentResult = "inprogress";

			NextTopologyService.addPath(topo, pathSet, "pathListSelected");

			$scope.pathSet = pathSet;
			$scope.prForm = {
				"pathName": pathSet[0] + " -> " + pathSet[pathSet.length - 1]
			};

		}

		/**
		 * Go back to selection of computed paths
		 * @param topo
		 */
		function backToSetup(topo){
			SharedDataService.data.pathSetupMode = "search";
			NextTopologyService.clearPathLayer(topo);
		}

		/**
		 * Delete the path from memory and topology
		 * @param topo
		 * @param type
		 */
		function removePathByType(topo, type){
			NextTopologyService.removePathByType(topo, type);
		}

		/**
		 * Submit the path to controller
		 * @param topo
		 */
		function deployPath(topo){

			// configure path data for deployment
			var pathConfig = {
				"name": $scope.prForm.pathName,
				"path": $scope.pathSet
			};

			// todo: blinking???
			// remove path for topology
			NextTopologyService.removePathByType(topo, "pathListSelected");

			// make REST call to deploy path on controller
			PathListService.deployPath(pathConfig, deployPathSuccessCbk, deployPathErrorCbk);

			// success: path deployed
			function deployPathSuccessCbk(data){
				NextTopologyService.addPath(topo, $scope.pathSet, "deployed");
				SharedDataService.data.pathDeploymentResult = "success";
				console.log(data);
				// todo: something else?
			}

			// error: path refused
			function deployPathErrorCbk(err){
				NextTopologyService.addPath(topo, $scope.pathSet, "deploymentFailed");
				SharedDataService.data.pathDeploymentResult = "error";
				console.log(err);
				// todo: something else?
			}
		}

	};

	PathSetupCtrl.$inject = ["$scope", "PathListService", "NextTopologyService", "SharedDataService"];
	app.controller("PathSetupCtrl", PathSetupCtrl);

})(app);