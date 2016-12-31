// pouch db angular module 
// for storing apidb values


angular.module('mm.core')
.factory('$mmApicalldb', function($q) {

	var _db;    

	return {
        initDB: initDB,
       
        addApicall: addApicall,
        updateApicall: updateApicall,
        deleteApicall: deleteApicall,
        getAllApicalls: getAllApicalls
    };

    function initDB() {
        // Creates the database or opens if it already exists
        _db = new PouchDB('vbdata', {adapter: 'websql'});
    };

    function addApicall(apicall) { 
    	apicall._id = 'api_' + apicall.key;
	    return $q.when(_db.put(apicall));
	};

	function updateApicall(apicall) {  
    	apicall._id = 'api_' + apicall.key;
	    return $q.when(_db.put(apicall));
	};

	function deleteApicall(apicall) {  
	    return $q.when(_db.remove(apicall));
	};

	function getAllApicalls(){
		return $q.when(_db.allDocs({ include_docs: true, startkey: 'meta_course_', endkey: "meta_course_\uffff"}));
	}

});