// scheduling for the location
// 1. schedule a daily call at 5am to fetch required times for projects
// 2. schedule multiple times when locations are to be calculated
// 3. schedule a daily call when failed calls to be recalled

angular.module('mm.core')
.factory('$mmSchedule', function($q, $cordovaLocalNotification, $mmApicalldb,$mmMetadb) {

    $mmMetadb.initDB();
    $mmApicalldb.initDB();

	return {
        scheduleFetch: scheduleFetch,
        scheduleTimes: scheduleTimes,
        scheduleRuncalls: scheduleRuncalls
    };
    

	function scheduleFetch(){
        // fetch all courses
		var date = new Date();
        date.setHours(02);
        date.setMinutes(00);
        date.setSeconds(00);

        $cordovaLocalNotification.schedule({
            id: 1,
            title: 'Updating time intervals',
            text: 'Updating time intervals',
            every: 'day',
            at: date,
            data: {}
        });
	}

	function scheduleTimes(){

        $mmMetadb.getAllcourses().then(function(response){
            console.log('all data fetched' + JSON.stringify(response));
            for (var i = 0; i < response.total_rows; i++) {
                var length = response.rows[i].doc.value.length
                for (var j = 0; j < length; j++) {
                    console.log('looping through' + JSON.stringify(response.rows[i].doc.value[j]));

                    var time_split = response.rows[i].doc.value[j].timevalue.split(':');
                    var schedule_id = response.rows[i].doc.value[j].course.toString() + 
                                      response.rows[i].doc.value[j].vattendance.toString() + 
                                      time_split[0] +
                                      time_split[1];


                    console.log('setting schedule with id' + schedule_id);
                    var date = new Date();
                    date.setHours(time_split[0]);
                    date.setMinutes(time_split[1]);
                    date.setSeconds(00);

                    $cordovaLocalNotification.schedule({
                        id: schedule_id,
                        title: 'Updating time intervals',
                        text: 'Updating time intervals',
                        every: 'day',
                        at: date,
                        data: {courseid: response.rows[i].doc.value[j].course, 
                            vattendanceid: response.rows[i].doc.value[j].vattendance, 
                            timevalue: response.rows[i].doc.value[j].time
                        }
                    });

                    console.log('schedule set with id' + schedule_id);
                }
            }
        });
	}

	function scheduleRuncalls(){
		var date = new Date();
        date.setHours(3);
        date.setMinutes(00);
        date.setSeconds(00);

        $cordovaLocalNotification.schedule({
            id: 2,
            title: 'Updating time intervals',
            text: 'Updating time intervals',
            every: 'day',
            at: date,
            data: {}
        });
	}
	
});