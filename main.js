// two dimensional arrays used to represent tables
// to get value use name_of_array[row][collumn]

function GetSQL() {
    var locations = [[]]; // two dimensional array (table) for locations
    var doors = [[]]; // two dimensional array (table) for doors
  
    // load csv data and type OK if loaded properly
    if(!(locations = CSVToArray( document.getElementById('loc_csv').value, ',' )) ||
       !(doors = CSVToArray( document.getElementById('dor_csv').value, ',' ))) {
        if(!locations) document.getElementById('loc_ok').innerHTML = "";
        else document.getElementById('loc_ok').innerHTML = "OK";
        
        if(!doors) document.getElementById('dor_ok').innerHTML = "";
        else document.getElementById('dor_ok').innerHTML = "OK";
        
        alert("Paste both CSV files.");
        return false;
    } else 
      document.getElementById('dor_ok').innerHTML = document.getElementById('loc_ok').innerHTML = "OK";

    var whs_code = locations[0][0]; // get warehouse code (whs_code) from locations[0][0]
    
    var output = ""; // we will store generated sql code in variable output

    output += "--TDK Config - Shipment types<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'SHT', 'EI', 'Export - Stock In');<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'SHT', 'EO', 'Export - Stock Out');<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'SHT', 'II', 'Import - Stock In');<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'SHT', 'IO', 'Import - Stock Out');<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'SHT', 'TS', 'Transhipment');<br />";
    output += "<br />"

    // define array (table) with two collumns area id [0] and area code [1]
    var unique_area = [[]];
    
    // extract unique areas and store it in array unique_area
    output += "-- system variables (how many TDK areas, so many integers)<br />";
    for(var i = 0; i < locations.length; i++) {
        if(locations[i][7]==="" || typeof locations[i][7] === 'undefined') continue;
        unique_area[0][0] = "area1";
        unique_area[0][1] = locations[i][7];
        break;
    }

    for(var i = 0; i < locations.length; i++) {
        var ual = unique_area.length;
        var add = true;
        
        for(var x = 0; x < ual; x++) {
            if(unique_area[x][1] == locations[i][7]) {
                add = false;
                break;
            }
        }
        
        if(locations[i][7]==="" || typeof locations[i][7] === 'undefined') add=false;
        
        if(add) {
            unique_area.push([]);
            unique_area[ual][0] = "area" + (ual + 1);
            unique_area[ual][1] = locations[i][7];
        }
    }
    
    for(var i = 0; i < unique_area.length; i++) {
        output += "create or replace variable "+unique_area[i][0]+" integer;<br />";
    }
    output += "<br />";
    
    output += "--system variables filled with unique sequence<br />";
    for(var i = 0; i < unique_area.length; i++) {
        output += "set "+unique_area[i][0]+" = next value for TDKCFG_SEQ;<br />";
    }
    output += "<br />";

    output += "-- Creating TDK AREAS, using system variables filled with sequence<br />";
    for(var i = 0; i < unique_area.length; i++) {
        output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES("+unique_area[i][0]+", '"+whs_code+"', 'WHA', null, '"+unique_area[i][1]+"');<br />";
    }
    output += "<br />";
    
    unique_area.FindAreaID = function (area_code) {
        for(var i = 0; i < unique_area.length; i++) {
            if(unique_area[i][1] == area_code) return unique_area[i][0];
        }
    } // returns area id from area code needed below

    output += "-- Assigning door codes to TDK areas<br />";
    for(var i = 0; i < doors.length; i++) {
        var area_id = unique_area.FindAreaID(doors[i][1]);
        if (typeof area_id === 'undefined') continue;
        var door_code = doors[i][0];
        output += "INSERT INTO TDK_CARPRK (CARPARKURN, CFGURN_WHS_AREA, CODE) VALUES(NEXT VALUE FOR CARURN_SEQ,"+area_id+",'"+door_code+"');<br />";
    }
    output += "<br />";
    
    output += "-- Assigment of whs locvations to TDK Area<br />";
    for(var i = 0; i < locations.length; i++) {
        var area_id = unique_area.FindAreaID(locations[i][7]);
        if (typeof area_id === 'undefined') continue;
        var loc_code = locations[i][1];
        output += "INSERT INTO TDK_WHSLOC(WHSLOCURN, WHS_LOCATION_CODE,CFGURN_WHS_AREA) VALUES (NEXT VALUE FOR TDKLOC_SEQ,'"+loc_code+"',"+area_id+");<br />";
    }
    output += "<br />";
    
    // droping created sql variables
    for(var i = 0; i < unique_area.length; i++) {
        output += "drop variable "+unique_area[i][0]+";<br />";
    }
    output += "<br />";
    
    // see sql comment
    output += "--obligatory<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'RPT', 'HC', 'Hand Carry');<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'RPT', 'TR', 'Truck');<br />";
    output += "<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'CHT', 'CSH', 'Cash');<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'CHT', 'OCT', 'Octopus');<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'CHT', 'WAI', 'Waived');<br />";
    output += "<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'CHA', null, '0');<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'CHA', null, '60');<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'CHA', null, '100');<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'CHA', null, '120');<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'CHA', null, '180');<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'CHA', null, '200');<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'CHA', null, '240');<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'CHA', null, '300');<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'CHA', null, '360');<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'CHA', null, '400');<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'CHA', null, '480');<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'CHA', null, '500');<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'CHA', null, '600');<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'CHA', null, '700');<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'CHA', null, '800');<br />";
    output += "INSERT INTO TDK_CONFIG (CFGURN, WHCD, DOMAIN, NAME, VALUE) VALUES(NEXT VALUE FOR TDKCFG_SEQ, '"+whs_code+"', 'CHA', null, '900');<br />";
    
    document.getElementById('sql').innerHTML = output; // put output into <code id="sql"> in our html file

    return true;
}

// from http://www.bennadel.com/blog/1504-ask-ben-parsing-csv-strings-with-javascript-exec-regular-expression-command.htm
function CSVToArray(strData, strDelimiter) {
    if(strData === "") return false;
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ",");

    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp(
    (
    // Delimiters.
    "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

    // Quoted fields.
    "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

    // Standard fields.
    "([^\"\\" + strDelimiter + "\\r\\n]*))"), "gi");


    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [
        []
    ];

    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;


    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec(strData)) {

        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[1];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
        strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter)) {

            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push([]);

        }


        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[2]) {

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            var strMatchedValue = arrMatches[2].replace(
            new RegExp("\"\"", "g"), "\"");

        }
        else {

            // We found a non-quoted value.
            var strMatchedValue = arrMatches[3];

        }


        // Now that we have our value string, let's add
        // it to the data array.
        arrData[arrData.length - 1].push(strMatchedValue);
    }

    // Return the parsed data.
    return (arrData);
}
