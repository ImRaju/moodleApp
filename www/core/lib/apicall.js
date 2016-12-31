// scheduling for the location

angular.module('mm.core')
.factory('$mmApicalls', function($q, $mmMetadb, $cordovaGeolocation, $http, $mmApicalldb) {
	
	var API_TOKEN_URL = "http://demo.sprytechies.net/vidyabhawan/login/token.php?service=vattendanceapi";
	var API_TIME_URL = "http://demo.sprytechies.net/vidyabhawan/webservice/rest/server.php?wsfunction=mod_wsvattendance_fetchtime&moodlewsrestformat=json";
	var API_LOCATION_URL = "http://demo.sprytechies.net/vidyabhawan/webservice/rest/server.php?wsfunction=mod_wsvattendance_addcoordinates&moodlewsrestformat=json";
	
	$mmMetadb.initDB();
	$mmApicalldb.initDB();

	return {
        getToken: getToken,
       
        getIds: getIds,
        getTime: getTime,
        shareLocation: shareLocation,
        callFailed: callFailed
    };

	// get token from api and return
	function getToken(username, password){
		var token_url = API_TOKEN_URL + "&username=" + username + '&password=' + password;
		console.log("__________Fetching token________");
		return $q.when($http.get(token_url)).then(function(response){
			var token_var = { key: 'token', value: response.data.token };
			$mmMetadb.updateMeta(token_var);
			console.log("__________token saved________ ");
			return response.token;
		}, function(err){
			console.log("________API returned an error_______");
            setTimeout(function () {
               getToken(username, password); 
            }, 600000);
		});
	}


	// requires course ids
	// returns an array of elements with nomenclature id_courseid_vattendanceid_timevalue
	function getIds(courses, token){
		var course_ids = [];
		courses.reduce(function (curr,next) {
	        return curr.then(function(){
	            return getTime(course_ids, next, token)
	        });
		}, Promise.resolve()).then(function(){
		    var time_var = { key: 'schedule', value: course_ids };
			MetaService.updateMeta(time_var);
		});
	}


	// call timming api
	function getTime(course, token){
		var time_url = API_TIME_URL + '&wstoken=' + token + '&course=' + course;
		console.log("________Calling API to get times_______");
		return $q.when($http.get(time_url)).then(function(response){
				console.log("________API call successful_______" + JSON.stringify(response.data));
				
				var course_ids = [ {course: response.data.course, vattendance: response.data.id , timevalue: response.data.timevalue1, time: 'timevalue1'},
				 	{course: response.data.course, vattendance: response.data.id , timevalue: response.data.timevalue2, time: 'timevalue2'},
				 	{course: response.data.course, vattendance: response.data.id , timevalue: response.data.timevalue3, time: 'timevalue3'},
				 	{course: response.data.course, vattendance: response.data.id , timevalue: response.data.timevalue4, time: 'timevalue4'}
				];
				
				$mmMetadb.updateMeta({key: 'course_' + response.data.course, value: course_ids});
			});
	}

	function shareLocation(token, courseid, vattendanceid, timetaken, timevalue, userid, device){
		var posOptions = {timeout: 10000, enableHighAccuracy: false};

		promise = $cordovaGeolocation.getCurrentPosition(posOptions);
        
        return promise.then(function (position) {
            var lat  = position.coords.latitude;
            var long = position.coords.longitude;
            var location_url = API_LOCATION_URL  + '&wstoken=' + token + '&coordinates[vattendanceid]=' + vattendanceid + '&coordinates[userid]=' + userid + '&coordinates[timetaken]=' + timetaken + '&coordinates[timevalue]=' + timevalue + '&coordinates[latitude]=' + lat + '&coordinates[longitude]=' + long + '&coordinates[device]=' + device;
            $q.when($http.get(location_url)).then(function(res){
                    return true;
                }, function(error) {
                	var url_var = {key: courseid + '_' + vattendanceid + '_' + timevalue, value: location_url};
                	$mmMetadb.updateMeta(url_var);
                });
            return true;
        }, function(err) {
        	return false;
            console.log("__________Location could not be obtained________",err)
        });
	}

	function callFailed(){
		$mmApicalldb.getAllApicalls().then(function(response){
			if(response.total_rows > 0){
				for (var i = 0; i < response.total_rows; i++) {
					call_and_delete(response.rows[i].doc);
				}
			}
		});
	}

	function call_and_delete(row){
		$http.get(row.value).then(function(res){
        	return $mmMetadb.deleteMeta(row);
        }, function(error) {
            console.log('________Bulk API call failed_______');
        });
	}


});