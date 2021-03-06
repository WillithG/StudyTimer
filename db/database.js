var mysql = require('mysql');
var input_utils = require('./../utils/validation_util.js');
var time_utils = require('../utils/time_util.js');
module.exports = {
    post_time: post_time,
    get_time_today: get_time_today,
    get_time_past_week: get_time_past_week,
    close_connection: close_connection
};

// TODO, make this an open function
var con =  mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'studystopwatch',
    multipleStatements: true
});

function close_connection() {
    con.end();
}

/* Private: wrapper function for executing an SQL query;
    Throws error if the query is not sucessful.
   inputs:
    query :: string; the query to be executed
    callback :: function(error, result) the callback function after the query has been executed 
*/
var execute_query = function(query, callback) {
    con.query(query, function(err, result) {
         if (err) {
             callback(err, null);
        }
        else {
            callback(null, result);
        }
    });
};


/*
    Public: used to submit times to push a new study time to the database
    inputs:
      id :: string; name of user to associate the time with
      time :: int; the time in number of milliseconds
      type :: string; the type of time to be pushed, either 'break' or 'study'
    output: bool; success of query
*/
function post_time(id, time, type, cb) {
    // validate the input
    var id_valid = input_utils.validate_userid(id);
    var time_valid = input_utils.validate_time(time);
    var type_valid = type == 'break' || type == 'study';
    // execute query
    query = `
    INSERT INTO times (userid, timeofperiod, dateofperiod, typeofperiod)
    VALUES (${id}, ${time}, CURDATE(), '${type}');
    `;
    execute_query(query, cb);
 }
/*
    query the database for the total time studied today for the passed user
    inputs:
        userid :: int; id of user to be queried
        callback :: function(err, result); function to be called upon query completion.
*/
function get_time_today(userid, callback) {
    query = `
    SELECT timeofperiod
    FROM times
    WHERE dateofperiod=CURDATE();
    `
    con.query(query, function(err, res) {
        if (err) {callback(err, null);}
        else {callback(null, res);} 
    })
}


/**
 * Returns array of integers indicating the total time of each day for the last seven days. First element is the most recent date
 * @param {int} userid the id of the user to be queried
 */
function get_time_past_week(userid, cb) {
    // get JSON query objects every day for last 7 days.
    // convert JSON objects to total time per day
    // index = 0 => MOST RECENT DATE
    var toReturn = [0,0,0,0,0,0,0];
    // push JSON object of every time for a given date 
    var allTimeQueries = '';
    for (var i=0; i<toReturn.length; i++) {
        allTimeQueries += `
            SELECT timeofperiod
            FROM times
            WHERE userid=${userid} AND dateofperiod=DATE_ADD(CURDATE(), INTERVAL -${i} DAY);
        `;
    }
    var callb = function(err, res) {
        if (err == null) {
            // convert JSON object to pure seconds
            toReturn = res.map(time_utils.convert_JSON_to_seconds);
            cb(toReturn);
        } else {
            console.log('callb ' + err);
        }
    };
    execute_query(allTimeQueries, callb);
}


/* Private: Sanitize the input provided by the client
   inputs:  
   refer to this https://flaviocopes.com/express-sanitize-input/
   https://expressjs.com/en/advanced/best-practice-security.html
*/
// no need for sanitization at this time, because all user inputs are integers.
