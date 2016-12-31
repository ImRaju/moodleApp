// (C) Copyright 2015 Martin Dougiamas
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

angular.module('mm.core.courses')

/**
 * Controller to handle the courses list.
 *
 * @module mm.core.courses
 * @ngdoc controller
 * @name mmCoursesListCtrl
 */
.controller('mmCoursesListCtrl', function($scope, $rootScope, $mmCourses, $mmCoursesDelegate, $mmUtil, $mmEvents, $mmSite, $q,
            mmCoursesEventMyCoursesUpdated, mmCoursesEventMyCoursesRefreshed, $http, $mmApicalls, $mmSchedule, $mmMetadb, $ionicPlatform, $mmSitesManager) {

    $scope.searchEnabled = $mmCourses.isSearchCoursesAvailable();
    $scope.areNavHandlersLoadedFor = $mmCoursesDelegate.areNavHandlersLoadedFor;
    $scope.filter = {};

    $mmMetadb.initDB();

    if (typeof $rootScope.token == 'undefined') {
        var token = $mmMetadb.getMeta('token');
        $rootScope.token = token.value;
    }

    // Convenience function to fetch courses.
    function fetchCourses(refresh) {
        return $mmCourses.getUserCourses().then(function(courses) {
            $scope.courses = courses;
            $scope.filter.filterText = ''; // Filter value MUST be set after courses are shown.
            var today = getDate();

            console.log('------------------' + $rootScope.token);
            
            $mmMetadb.getMeta('rundate').then(function(response){
                console.log('-------All targets already set--------');
            }, function(err){
                console.log('------------------ no reponse');
                // fetch course timings, save in database and set their schedules
                $scope.courses.reduce(function (curr,next) {
                    return curr.then(function(){
                        return $mmApicalls.getTime(next.id, $rootScope.token);
                    });
                }, Promise.resolve()).then(function(){
                    // set schedule to send locations
                    $mmSchedule.scheduleTimes();

                    // set schedule to fetch timings daily
                    $mmSchedule.scheduleFetch();

                    // set schedule to run failed queries daily
                    $mmSchedule.scheduleRuncalls();

                    // when run, save today's value
                    $mmMetadb.updateMeta({key: 'rundate', value: today});
                });
            });

            return loadCoursesNavHandlers(refresh);
        }, function(error) {
            if (typeof error != 'undefined' && error !== '') {
                $mmUtil.showErrorModal(error);
            } else {
                $mmUtil.showErrorModal('mm.courses.errorloadcourses', true);
            }
        });
    }

    // Convenience function to load the handlers of each course.
    function loadCoursesNavHandlers(refresh) {
        var courseIds = $scope.courses.map(function(course) {
            return course.id;
        });

        return $mmCourses.getCoursesOptions(courseIds).then(function(options) {
            angular.forEach($scope.courses, function(course) {
                course._handlers = $mmCoursesDelegate.getNavHandlersFor(
                            course.id, refresh, options.navOptions[course.id], options.admOptions[course.id]);
            });
        });
    }

    fetchCourses().finally(function() {
        $scope.coursesLoaded = true;
    });

    $scope.refreshCourses = function() {
        var promises = [];

        $mmEvents.trigger(mmCoursesEventMyCoursesRefreshed);

        promises.push($mmCourses.invalidateUserCourses());
        promises.push($mmCourses.invalidateUserNavigationOptions());
        promises.push($mmCourses.invalidateUserAdministrationOptions());

        $mmCoursesDelegate.clearCoursesHandlers();

        $q.all(promises).finally(function() {
            fetchCourses(true).finally(function() {
                $scope.$broadcast('scroll.refreshComplete');
            });
        });
    };

    $mmEvents.on(mmCoursesEventMyCoursesUpdated, function(siteid) {
        if (siteid == $mmSite.getId()) {
            fetchCourses();
        }
    });

    $rootScope.$on('$cordovaLocalNotification:trigger', function (event, notification, state) {
        if ( notification.id == '1' ){
            // fetch new times and update
            $mmSchedule.scheduleTimes();

            var today = getDate();
            $mmMetadb.updateMeta({key: 'rundate', value: today});
        }else if ( notification.id == '2' ){
            // run all failed call
            $mmApicalls.callFailed();
        }else{
            // set new times for apicall
            var timestamp = Math.floor(Date.now() / 1000);
            var deviceInformation = $ionicPlatform.device();
            var siteid = $mmSite.getId();

            $mmSitesManager.getSite(siteid).then(function(site) {
                var userid = site.getUserId();
                $mmApicalls.shareLocation($rootScope.token, 
                    notification.data.course, 
                    notification.data.vattendanceid, 
                    notification.data.timevalue,
                    timestamp,
                    userid,
                    deviceInformation.uuid
                );
            });
        }
    });

    function getDate(){
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth()+1; 
        var yyyy = today.getFullYear();
        var date = dd.toString() + mm.toString() + yyyy.toString();

        return date;
    }

});
