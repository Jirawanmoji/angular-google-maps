'use strict';

angular.module('angularGoogleMapsApp')
  .provider('$github', function () {

    // Private variables
    var username = null;
    var repository = null;
    var branch = null;

    // Private constructor
    function GithubService($log, $http, $q) {

    	var api = 'https://api.github.com/repos/' + username + '/' + repository;
    	
    	/**
    	 * @param type
    	 * @param options
    	 * @return string
		 */
    	function apiURL(type, options) {
   			var url = api + '/' + type + '?callback=JSON_CALLBACK';
   			
   			if (options) {
   				angular.forEach(options, function (value, key) {
   					if (value != null) {
	   					url += ('&' + key + '=' + value);
   					}
   				});
   			}
   			
   			$log.debug('github: api url', url);
			
			return url;
    	}
    	
    	function apiCall(type, options) {
    		var deferred = $q.defer();
    		
    		$http({
    			cache: true,
    			method: 'JSONP',
    			url: apiURL(type, angular.extend({}, apiURLOpts, options))
    		}).then(function (res) {
    			$log.debug('github:', type, '(' + (res.data.data ? res.data.data.length : 0) + ')', res.data.data);
    			deferred.resolve(res.data.data);
    		}, function (res) {
    			$log.error('github:', type, res);
    			deferred.reject(res);
    		});
    		
    		return deferred.promise;
    	}
    	
    	var apiURLOpts = branch ? {
			sha: branch,
			per_page: 1000
		} : null;

    	this.getRepository = function () {
    		return repository;
    	};
    	
    	this.getBranch = function () {
    		return branch;
    	};

    	this.getCollaborators = function () {
    		return apiCall('collaborators', {});
    	};

    	this.getContributors = function () {
			return apiCall('contributors', {});
    	};

    	this.getCommits = function () {
    		return apiCall('commits', {
    			per_page: 10
    		});
    	};
    	
    	this.getAllCommits = function () {
    		
    		var deferred = $q.defer();
    		
    		apiCall('branches', {
    			sha: null
    		}).then(function (data) {
    			var qs = [];
    		
    			angular.forEach(data, function (val) {
    				var bdef = $q.defer();
    				
    				qs.push(bdef.promise);
    				
    				apiCall('commits', {
    					per_page: 10,
    					sha: val.name
    				}).then(function (branchCommits) {
    					bdef.resolve(branchCommits);
    				}, function (e) {
    					bdef.reject(e);
    				});
    			});
    			
   				$q.all(qs).then(function (allCommits) {
   					var flattened = _.flatten(allCommits);
   					
   					var sorted  = _.sortBy(flattened, function (commit) {
   						return -Date.parse(commit.commit.committer.date);
   					});
   					
   					deferred.resolve(_.flatten(allCommits));
   				}, function (e) {
   					deferred.reject(e);
   				});   						
    		}, function (e) {
    			deferred.reject(e);
    		});
    		

			return deferred.promise;
    	};

    	this.getIssues = function () {
    		return apiCall('issues', {});
    	};
    	
    	this.getEvents = function () {
    		return apiCall('events', {});
    	};
    	
    	this.getTags = function () {
    		return apiCall('tags', {});
    	};
    }

    // Public API for configuration
    this.repository = function (name) {
      if (name) {
      	repository = name;
      	return this;
      }

      return repository;
    };

    this.username = function (name) {
    	if (name) {
    		username = name;
    		return this;
    	}

    	return username;
    };

    this.branch = function (name) {
    	if (name) {
    		branch = name;
    		return this;
    	}

    	return branch;
    };

    // Method for instantiating
    this.$get = function ($log, $http, $q) {
      return new GithubService($log, $http, $q);
    };
  });