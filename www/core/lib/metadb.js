// pouch db angular module 
// for storing site meta and values


angular.module('mm.core')
.factory('$mmMetadb', function($q) {

	var _db; 

	return {
        initDB: initDB,
       
        addMeta: addMeta,
        updateMeta: updateMeta,
        deleteMeta: deleteMeta,
        getMeta: getMeta,
        getAllcourses: getAllcourses
    };

    function initDB() {
        _db = new PouchDB('vbdata', {adapter: 'websql'});
    };

    function addMeta(meta) {  
    	meta._id = 'meta_' + meta.key;
    	console.log('_______adding meta________' + meta);  
	    return $q.when(_db.put(meta));
	};

	function updateMeta(meta) {
    	meta._id = 'meta_' + meta.key;
    	console.log('_______updating meta________' + meta); 
	    return $q.when(_db.put(meta));
	};

	function deleteMeta(meta) {  
		console.log('_______deleting meta________' + meta); 
	    return $q.when(_db.remove(meta));
	};

	function getMeta(id) {
		id = 'meta_' + id;
		console.log('_______getting meta________' + id); 
		return $q.when(_db.get(id));
	}

	function getAllcourses(){
		console.log('_______getting all courses________'); 
		return $q.when(_db.allDocs({ include_docs: true, startkey: 'meta_course_', endkey: "meta_course_\uffff"}));
	}

});