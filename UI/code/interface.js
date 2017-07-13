// to do:
//wipe out epsilon + accuracy for unchecked stats (done line 364)
// fd + fe should be sent when they are available
// add clear button for secrecy sample 
// population size/database size (secrecy of sample/global variable * e or * d (w/ ss> n))
// don't send an empty
// multivariate analysis

// tell the thing the action is "accuracy change"
// change fe and fd when e and d are changed.

// checkbox, paragraph, text string, drop down


// JSON data of r-libraries and functions (Fanny's work will provide these)
var JSON_file = '{"rfunctions":[' +
    '{"statistic": "Mean", "stat_info": "Release the arithmetic mean of the chosen variable", "statistic_type": [{"stype": "Numerical", "parameter": ["Lower Bound", "Upper Bound"]}, {"stype": "Boolean", "parameter": []}]},' + 
    '{"statistic": "Histogram", "stat_info": "Release counts of the categories represented in the chosen variable", "statistic_type": [{"stype": "Numerical", "parameter": ["Lower Bound", "Upper Bound", "Number of Bins"]}, {"stype": "Categorical", "parameter": ["Bin Names"]}]},' +
    // '{"statistic": "Causal Inference", "stat_info": "Inferences", "statistic_type": [{"stype": "Numerical", "parameter": ["Lower Bound", "Upper Bound", "Treatment Variable"]}, {"stype": "Boolean", "parameter": ["Treatment Variable"]}]},' +     
    '{"statistic": "Quantile", "stat_info": "Release a cumulative distribution function at the given level of granularity (can extract median, percentiles, quartiles, etc from this).", "statistic_type": [{"stype": "Numerical", "parameter": ["Lower Bound", "Upper Bound", "Granularity"]}]} ],' +
    '"type_label": [ {"stype": "Numerical", "type_info": "Data should be treated as numbers"}, {"stype": "Boolean", "type_info": "Data contains two possible categories"}, {"stype": "Categorical", "type_info": "Datapoints should be treated as categories/bins"} ],' +
    '"parameter_info": [ {"parameter": "Lower Bound", "entry_type": "number", "pinfo": "Minimum value that the chosen variable can take on", "input_type": "text"}, {"parameter": "Upper Bound", "entry_type": "number", "pinfo": "Maximum value that the chosen variable can take on", "input_type": "text"}, {"parameter": "Number of Bins", "entry_type": "pos_integer", "pinfo": "Number of distinct categories the variable can take on", "input_type": "text"}, {"parameter": "Granularity", "entry_type": "pos_integer", "pinfo": "The minimum positive distance between two different records in the data", "input_type": "text"}, {"parameter": "Treatment Variable", "entry_type": "none", "pinfo": "Other axis variable", "input_type": "multiple_choice_with_other_variables"}, {"parameter": "Bin Names", "entry_type": "none", "pinfo": "Give the names of all the bins", "input_type": "text"} ] }';

// , "function": "none"
// multiple_choice_with_other_variables

// List of variables to make form bubbles (Fanny's work will provide these)
var JSON_file2 = '{ "varlist": ["name", "gender", "age", "income", "education", "IQ", "employed"] }'; 




// Parses the function and varlist data structure
var rfunctions = JSON.parse(JSON_file);
var varlist = JSON.parse(JSON_file2);

// List of possible variable
var variable_list = varlist.varlist;



// Active and inactive variable list
var varlist_active = [];
var varlist_inactive = variable_list; 

// Array that is to be passed to the R-servers
// Format: inputted_metadata[variable_name] = ['Variable_Type', 'Statistic1', 'Epsilon1', 'Accuracy1', 'Hold1', ... Repeats for all possible statistics ... All Possible Metadata];
var inputted_metadata = {};

// Memory of the previous table
var previous_inputted_metadata = {};


// Function epsilon, delta, and secrecy of the sample.
var global_size = 0;
var SS_value_past = "";

var varColor = '#f0f8ff';   //d3.rgb("aliceblue");
var selVarColor = '#fa8072';    //d3.rgb("salmon");

var released_statistics = "not yet built";


// CSS when variable selected
var variable_selected_class = 
    "color: black;" +
    "list-style: none;" +
    "padding: 5px;" + 
    "margin: 5px 0;" +
    "background: #fa8072;"+
    "opacity:0.5;"+
    "text-align: center;";

// CSS when variable unselected
var variable_unselected_class = 
    "color: black;" +
    "list-style: none;" +
    "padding: 5px;" + 
    "margin: 5px 0;" +
    "background: #f0f8ff;"+
    "opacity:0.5;"+
    "text-align: center;";


var global_epsilon = 0.1;
var global_delta = 0.000001;
var global_beta = 0.05;
var reserved_epsilon = 0;
var reserved_delta = 0;
var global_sliderValue = 0;
var reserved_epsilon_toggle = false;
// secrecy of sample/global variable * e or * d
//JM: changed functioning epsilon and delta to default to global eps and del
var global_fe = global_epsilon;
var global_fd = global_delta;

//color and size of information buttons
var qmark_color = "#090533"; //old value: #FA8072
var qmark_size = "15px"; // old value: 12px

//tutorial mode globals
var tutorial_mode = true;
var first_edit_window_closed = true;
var first_variable_selected = true;
var first_type_selected = true;
var first_stat_selected = true;
var first_completed_statistic = true;
var first_reserved_epsilon = true;

// List of possible statisitics
var statistic_list = [];
for (n = 0; n < rfunctions.rfunctions.length; n++) {
    statistic_list.push(rfunctions.rfunctions[n].statistic.replace(/\s/g, '_'));
};

// List of all types
var type_list = [];
for (n = 0; n < rfunctions.type_label.length; n++) {
    type_list.push(rfunctions.type_label[n].stype);
};


// List of statistics per type and metadata required
for (n = 0; n < type_list.length; n++) {
    var var_type = type_list[n];
    eval("var " + var_type.replace(/\s/g, '_') + "_stat_list = [];");
    eval("var " + var_type.replace(/\s/g, '_') + "_stat_parameter_list = [];");
    for (m = 0; m < rfunctions.rfunctions.length; m++) {
        for (l = 0; l < rfunctions.rfunctions[m].statistic_type.length; l++) {
            if (rfunctions.rfunctions[m].statistic_type[l].stype == var_type) {
                eval(var_type.replace(/\s/g, '_') + "_stat_list.push('" + rfunctions.rfunctions[m].statistic + "');");
                eval(var_type.replace(/\s/g, '_') + "_stat_parameter_list.push({'rfunctions_index': " + m + ", 'parameter_index': " + l + "});");
            }
            else {}
        };
    };
};

// List of all metadata
var metadata_list = [];
for (n = 0; n < rfunctions.parameter_info.length; n++) {
    metadata_list.push(rfunctions.parameter_info[n].parameter.replace(/\s/g, '_'));
};






// Column index dictionary
// Format: inputted_metadata[variable_name] = ['Variable_Type', 'Statistic1', 'Epsilon1', 'Accuracy1', 'Hold1', ... Repeats for all possible statistics ... All Possible Metadata];
var column_index = {}
column_index["Variable_Type"] = 0; 
for (n = 0; n < statistic_list.length; n ++) {
    var m = 4 * n; 
    var statistic_index = statistic_list[n].replace(/\s/g, '_');
    column_index[statistic_index] = m + 1;
    column_index["epsilon_" + statistic_index] = m + 2;
    column_index["accuracy_" + statistic_index] = m + 3;
    column_index["hold_" + statistic_index] = m + 4;
};
for (n = 0; n < metadata_list.length; n++) {
    m = 4 * statistic_list.length + 1;
    column_index[metadata_list[n].replace(/\s/g, '_')] = m + n;
};

column_index_length = 1 + 4 * statistic_list.length + metadata_list.length;




// Reverse column_index: http://stackoverflow.com/questions/1159277/array-flip-in-javascript
var index_column = {};
$.each(column_index, function(i, el) {
    index_column[el]=i;
});


console.log(variable_list);





//////////////
// Globals

var production = true;
var hostname = "";
var metadataurl = "";
var ddiurl = "";

var dataverse_available = true;  // When Dataverse repository goes down, or is otherwise unavailable, this is a quick override for searching for metadata by url.

// Set the fileid (Dataverse reference number) for dataset to use 
var fileid = "";
var possiblefileid = location.href.match(/[?&]fileid=(.*?)[$&]/);
console.log(possiblefileid);


// Move between UI test and prototype modes
var UI = false;
var possibleUI = location.href.match(/[?&]UI=(.*?)[$&]/);
console.log(possibleUI);
if(possibleUI){
  UI = true;
  console.log("switching from prototype to test mode");
  var element = document.getElementById("setdataset");     // delete the dataset selection header
  element.outerHTML = "";
  delete element;
  fileid = 5265;                                             // define the default dataset as PUMS
}else{
  if(possiblefileid){
  	fileid = location.href.match(/[?&]fileid=(.*?)[$&]/)[1];   	// get fileid from URL 
  	$('#dataselect').val(fileid);         						// change value in selector box
  } else {
  	fileid = document.getElementById('dataselect').value;		// get fileid from selector box which will be at default value
  };
};

// When beta.dataverse.org is down, need to override getting files live from Repository:

if(!dataverse_available){
  fileid = "";    // This is overriding the lines above that set fileid by the header/selection bar
}




console.log(fileid)

if(production && fileid=="") {
    alert("Error: No fileid has been provided.");
    throw new Error("Error: No fileid has been provided.");
}

if (!hostname && !production) {
    hostname="localhost:8080";
} else if (!hostname && production) {
    hostname="beta.dataverse.org"; 		//this will change when/if the production host changes
}

if (!production) {
    var rappURL = "http://0.0.0.0:8000/custom/";  		// base URL for the R apps:
} else {
    var rappURL = "https://beta.dataverse.org/custom/";	//this will change when/if the production host changes
}


// read DDI metadata with d3:
if (ddiurl) {
    // a complete ddiurl is supplied:
    metadataurl=ddiurl;
} else if (fileid) {
    // file id supplied; we're going to cook a standard dataverse
    // metadata url, with the file id provided and the hostname
    // supplied or configured:
    metadataurl="https://beta.dataverse.org/api/meta/datafile/"+fileid;
} else {
    // neither a full ddi url, nor file id supplied; use one of the sample DDIs that come with
    // the app, in the data directory:
    //metadataurl="../../data/Census_PUMS5_California_Subsample-ddi.xml";  // This is PUMS example metadata file
    metadataurl="../../data/pumsmetaui.xml"; //For UI/UX
    console.log("Retrieving Metadata Locally");
}


///////////
var grid;
var allResults = [];
var secSamp = false;
var data = [];
var VarList =[];
d3.xml(metadataurl, "application/xml", function(xml) {
    var vars = xml.documentElement.getElementsByTagName("var");
    var Variables = [];
    var type;
    var typeMap = {};
    var caseQnty = xml.documentElement.getElementsByTagName("caseQnty");

    // Set the sample size from the metadata
    
    global_size = caseQnty[0].childNodes[0].nodeValue;
    global_size = 1000; //for ui
    // document.getElementsByName('SS')[0].placeholder='value > ' + global_size;  // set the secrecy of the sample placeholder message

    for(var j =0; j < vars.length; j++ ) {
      Variables.push(vars[j].getAttribute('name').replace(/"/g,""));    // regular expression removes all quotes -- might need to adjust
      type = vars[j].getAttribute('intrvl').replace(/"/g,"");    // regular expression removes all quotes -- might need to adjust
      //if(type === "discrete"){
      //  type = "Categorical";
      //}
      //if(type === "contin"){
      //  type = "Numerical";
      //}
      //typeMap[Variables[j]] = type
    }
    //for demo only
    //typeMap[Variables[3]]="Numerical";
    
    // dataset name trimmed to 12 chars
    var temp = xml.documentElement.getElementsByTagName("fileName");
    var dataname = temp[0].childNodes[0].nodeValue.replace( /\.(.*)/, "") ;  // regular expression to drop any file extension 
    console.log("metadata query output");
    console.log(Variables);
    console.log(dataname);
    console.log(typeMap);
    // Put dataset name, from meta-data, into header
    d3.select("#datasetName").selectAll("h2")
    .html(dataname);

  	variable_list = Variables;


	console.log(variable_list);

	// Active and inactive variable list
	varlist_active = [];
	varlist_inactive = variable_list.slice(); 
	populate_variable_selection_sidebar();





	// Unique array function (source: http://stackoverflow.com/questions/11246758/how-to-get-unique-values-in-an-array)
	Array.prototype.unique = function () {
    	var arr = this;
    	return $.grep(arr, function (v, i) {
        return $.inArray(v, arr) === i;
    	});
	};

	// Element included in array function: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
	if (!Array.prototype.includes) {
  		Array.prototype.includes = function(searchElement /*, fromIndex*/) {
    		'use strict';
    		if (this == null) {
      			throw new TypeError('Array.prototype.includes called on null or undefined');
    		}

    		var O = Object(this);
    		var len = parseInt(O.length, 10) || 0;
    		if (len === 0) {
      			return false;
    		}
    		var n = parseInt(arguments[1], 10) || 0;
    		var k;
    		if (n >= 0) {
      			k = n;
    		} else {
      			k = len + n;
      			if (k < 0) {k = 0;}
    		}
    		var currentElement;
    		while (k < len) {
      			currentElement = O[k];
      			if (searchElement === currentElement ||
         			(searchElement !== searchElement && currentElement !== currentElement)) { // NaN !== NaN
        			return true;
      				}
      			k++;
    		}
    		return false;
  		};
	}

	// end JM 
	///////////////////////////////////////////////////////////////////////
});   // JH: Here is where asynchronous xml read ends



/////////////////////////////////////////////////////////////////////// 
// JM talk to R mini example
// Full list of inputs that talk to R needs:
// dict: inputted_metadata
// indices: column_index
// stats: ["Mean", "Quantile", "Histogram"]
// metadata: ["Lower_Bound","Upper_Bound","Number_of_Bins", "Granularity"]
// globals: {eps=.1, del=.0000001, Beta=.05, n=2000)}
// action: string. either "betaChange" if beta was just changed, "accuracyEdited" if 
//         accuracy was just edited, or an empty string otherwise
// var:    if accuracy was edited, the associated variable name. Otherwise empty string
// stat:   if accuracy was edited, the associated statistic. Otherwise empty string.

//function talktoR(action="", variable="", stat="") { JH: This default assignment is ES6 syntax not available in all browsers (Safari 10, but not 9, Chrome but not IE)
function talktoR(action, variable, stat) {
  var sh = number_of_complete_stats_and_holds();
  if (sh[0] != 0) {
    action = typeof action !== 'undefined' ? action : "";  // This gives the same behaviour: set as "" if undefined when function called
    variable = typeof variable !== 'undefined' ? variable : "";
    stat = typeof stat !== 'undefined' ? stat : "";


   //package the output as JSON
   var estimated=false;
   var base = rappURL;
   var btn = 0;
   function estimateSuccess(btn,json) {
     console.log("json in: ", json);
     if(json["error"][0] ==="T"){
        alert(json["message"]);
        //undo to previous state of page
        inputted_metadata = JSON.parse(JSON.stringify(previous_inputted_metadata)); 
         generate_epsilon_table();
    }

    else{
        // If all went well, replace inputted_metadata with the returned dictionary 
        // and rebuild the epsilon table.

        inputted_metadata = JSON.parse(JSON.stringify(json["prd"]));
        generate_epsilon_table();

    } 
     estimated=true;
   }
  

   function statisticsSuccess(btn,json) {  
     console.log("json in: ", json);
   }


   function estimateFail(btn) {
     estimated=true;
   }
// JMIdea: change below to just always send functioning
 //  if (SS_value_past != "") { 
    var jsonout = JSON.stringify({ dict: inputted_metadata, indices: column_index, stats: statistic_list, metadata: metadata_list, globals: {eps: global_fe, del: global_fd, Beta: global_beta, n: global_size}, action: action, variable: variable, stat: stat });
 //  }
   //else {
    //var jsonout = JSON.stringify({ dict: inputted_metadata, indices: column_index, stats: statistic_list, metadata: metadata_list, globals: {eps: global_epsilon, del: global_delta, Beta: global_beta, n: global_size}, action: action, variable: variable, stat: stat });
   //}

   console.log(jsonout)
   urlcall = base+"privateAccuraciesapp";
   console.log("urlcall out: ", urlcall);
   makeCorsRequest(urlcall, btn, estimateSuccess, estimateFail, jsonout);  
} 
}
 

function splash (releases) {
  var released_statistics = JSON.stringify(releases)
  var released_objects = JSON.parse(released_statistics)
  var paragraph = 
    "<h2>Splash Result Page</h2>" +
    "<h3>Global Values</h3>" +
    "<p>Epsilon: " + released_objects.globals["eps"] + "</p>" +
    "<p>Delta: " + released_objects.globals["del"] + "</p>" +
    "<p>Beta: " + released_objects.globals["Beta"] + "</p>" +
    "<p>Data Size (n): " + released_objects.globals["n"] + "</p>";

  var variable_num = 1;
  for (i = 0; i < released_objects.df.length; i++) {
    if (i != 0) {
      if (released_objects.df[i]["Variable"] == released_objects.df[i-1]["Variable"]) {
        paragraph += "<p>" + released_objects.df[i]["Statistic"] + " Releases: " + released_objects.df[i]["Releases"] + "</p>";
      }
      else {
        paragraph += "<h4>Variable " + variable_num + ": " + released_objects.df[i]["Variable"] + "</h4>" +
        "<p>" + released_objects.df[i]["Statistic"] + " Releases: " + released_objects.df[i]["Releases"] + "</p>";
        variable_num++;
      }
    }
    else {
      paragraph += "<h4>Variable " + variable_num + ": " + released_objects.df[i]["Variable"] + "</h4>" +
      "<p>" + released_objects.df[i]["Statistic"] + " Releases: " + released_objects.df[i]["Releases"] + "</p>";
      variable_num++;
    }
  }
  // console.log(released_objects.df[1]["Variable"]);
  // var paragraph = "<pre> <code>" + released_statistics + "</code> </pre>";
  return paragraph;
}

function submit(){
	if(confirm("This will finalize your current selections and spend your privacy budget on them. This action cannot be undone.")){
		var submit_info = window.open("");  // Have to open in main thread, and then adjust in async callback, as most browsers won't allow new tab creation in async function
		talktoRtwo(submit_info);  // so we're going to use the btn argument, which is present, but no longer used, to carry the new window object
	}
	
}

/////////////////////////////////////////////////////////////////////// 
// JH talk to R for generating release
// Previously, this used to be folded into the talktoR function,
// but that was pared down for this version
// so presently this is a stand alone shortened function
//
// Lots of duplicated code, however.  

function talktoRtwo(btn) {
    //check completeness here too
  	// if secrecy of the sample is active, provide boosted privacy parameters

   var estimated=false;
   var base = rappURL;
   

   function statisticsSuccess(btn,json) {  
   	 console.log("ran statisticsSuccess")
     console.log("json in: ", json);
     //if(json["error"][0] ==="T"){
     //   alert(json["message"]);
     //} else {
     	released_statistics = JSON.stringify(json);
     //}
     estimated=true;

	 var paragraph = "<pre> <code>" + released_statistics + "</code> </pre>";
  	 btn.document.write(splash(json));
   }

   function estimateFail(btn) {
     estimated=true;
     console.log("ran estimateFail")
   }
// JMIdea always use functioning
  // if (SS_value_past != "") {
    var jsonout = JSON.stringify({ dict: inputted_metadata, indices: column_index, stats: statistic_list, metadata: metadata_list, globals: {eps: global_fe, del: global_fd, Beta: global_beta, n: global_size}, fileid: fileid });
  // }
   //else {
   // var jsonout = JSON.stringify({ dict: inputted_metadata, indices: column_index, stats: statistic_list, metadata: metadata_list, globals: {eps: global_epsilon, del: global_delta, Beta: global_beta, n: global_size}, fileid: fileid });
   //}

	console.log(jsonout)
    urlcall = base+"privateStatistics";
    console.log("urlcall out: ", urlcall);
  
    makeCorsRequest(urlcall, btn, statisticsSuccess, estimateFail, jsonout);
}


// below from http://www.html5rocks.com/en/tutorials/cors/ for cross-origin resource sharing
// Create the XHR object.
function createCORSRequest(method, url, callback) {
     var xhr = new XMLHttpRequest();
     if ("withCredentials" in xhr) {
         // XHR for Chrome/Firefox/Opera/Safari.
         xhr.open(method, url, true);
     } else if (typeof XDomainRequest != "undefined") {
         // XDomainRequest for IE.
         xhr = new XDomainRequest();
         xhr.open(method, url);
     } else {
         // CORS not supported.
         xhr = null;
     }
     
     xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
     return xhr;  
}


// Make the actual CORS request.
function makeCorsRequest(url,btn,callback, warningcallback, json) {
     var xhr = createCORSRequest('POST', url);
     if (!xhr) {
         alert('CORS not supported');
         return;
     }
     // Response handlers for asynchronous load
     // onload or onreadystatechange?
    
     xhr.onload = function() {
        
       var text = xhr.responseText;
       console.log("text ", text);
       var json = JSON.parse(text);   // should wrap in try / catch
       var names = Object.keys(json);

       if (names[0] == "warning"){
         warningcallback(btn);
         alert("Warning: " + json.warning);
       }else{
         callback(btn, json);
       }
     };
     xhr.onerror = function() {
         // note: xhr.readystate should be 4, and status should be 200.  a status of 0 occurs when the url becomes too large
         if(xhr.status==0) {
             alert('xmlhttprequest status is 0. local server limitation?  url too long?');
         }
         else if(xhr.readyState!=4) {
             alert('xmlhttprequest readystate is not 4.');
         }
         else {
             alert('There was an error making the request.');
         }
         console.log(xhr);
     };
     console.log("sending")
     console.log(json);
     xhr.send("tableJSON="+json);   
}



// Variable selection boxes change to signify selection
function variable_selected (variable) {
    if (inputted_metadata[variable.replace(/\s/g, '_')] == undefined) {
        document.getElementById("selection_sidebar_" + variable.replace(/\s/g, '_')).style.cssText = variable_selected_class; 
        create_new_variable(variable);
    }
    else {
        //delete_variable(variable); //JM collapse box here
    }
    document.getElementById("live-search-box").value = "";
    $('.live-search-list li').each(function() {
        $(this).show();
    });
    if(first_variable_selected && tutorial_mode){
    	hopscotch.endTour(true);  
		var type_text =  "<ul><li>Numerical: The dataset entries for this variable should be treated as numbers.</li><li> Boolean: The dataset entries for this variable fall into two possible categories/bins. </li><li> Categorical: The dataset entries for this variable should be treated as categories/bins.</li></ul>";
		var tour_target = "variable_type_" + variable;
		var variable_selected_tour = {
		  "id": "type_selection",
		   "i18n": {
			"doneBtn":'Ok'
		  },
		  "steps": [
			{
			  "target": tour_target,
			  "placement": "right",
			  "title": "Select variable type",
			  "content": type_text,
			  "yOffset":-20,
			  "showCTAButton":true,
			  "ctaLabel": "Disable these messages",
			  "onCTA": function() {
				hopscotch.endTour(true);
				tutorial_mode = false;
			  },
			}
		  ],
		  "showCloseButton":false,
		  "scrollDuration": 300,
		  "onEnd":  function() {
			   first_variable_selected = false;
			  },
		};
    	hopscotch.startTour(variable_selected_tour);
    }
};





// Updates varlist_active, varlist_inactive, and creates bubble
function create_new_variable (variable) {
    // fixes javascript pass by value/reference issue
    previous_inputted_metadata = JSON.parse(JSON.stringify(inputted_metadata));
    var variable_index = varlist_inactive.indexOf(variable);
    varlist_inactive.splice(variable_index, 1);
    varlist_active.push(variable);
    inputted_metadata[variable.replace(/\s/g, '_')] = array_default();
    $("#bubble_form").prepend(make_bubble(variable));
    //Default to open accordion
    open_acc = "accordion_"+variable;
    jamestoggle(document.getElementById(open_acc));
    console.log(previous_inputted_metadata);
};


// // Remove variable
// function delete_variable (variable) {
//     // if deleting variable would result in all held statistics, don't delete. 
//     if(areAllHeld2(variable)){
//         alert("Deletion would result in all held statistics. Try removing some holds before deleting");
//     }
//     else{
//         previous_inputted_metadata = JSON.parse(JSON.stringify(inputted_metadata));
//         document.getElementById("selection_sidebar_" + variable.replace(/\s/g, '_')).style.cssText = variable_unselected_class; 
//         var variable_index = varlist_active.indexOf(variable);
//         varlist_active.splice(variable_index, 1);
//         varlist_inactive.push(variable);
//         delete inputted_metadata[variable.replace(/\s/g, '_')];
//         document.getElementById(variable.replace(/\s/g, '_')).remove();

    
//         var active_stat = 0;
//         for (j = 0; j < statistic_list.length; j++) {
//             stat_index = 4 * j + 1;
//             if (previous_inputted_metadata[variable][stat_index] == 2) {
//                 active_stat++;
//             }
//         };
//         //JM make sure at least one statistic is still being computed
//         if(varlist_active.length == 0){
//             active_stat=0;
//         }
//         if(active_stat != 0){
//             var noStats = true;
//             for(i = 0; i < varlist_active.length; i++){
//                 for (j = 0; j < statistic_list.length; j++) {
//                     stat_index = 4 * j + 1;
//                     if (inputted_metadata[varlist_active[i]][stat_index] == 2){
//                         noStats = false;
//                     } 
//                 }
//             }
//             if(noStats){
//                 active_stat=0;
//             }
//         }
//         // done JM
//         if (active_stat > 0) {
//             console.log("talk to r bc variable deleted and it had valid stats")
//             talktoR();
//         }

//         generate_epsilon_table();
//         console.log(previous_inputted_metadata);
//     }
// };

// Remove variable
function delete_variable (variable) {
    // if deleting variable would result in all held statistics, don't delete. 
        previous_inputted_metadata = JSON.parse(JSON.stringify(inputted_metadata));        
        delete inputted_metadata[variable.replace(/\s/g, '_')];
        var variable_index = varlist_active.indexOf(variable);
        varlist_active.splice(variable_index, 1);
        varlist_inactive.push(variable);

        // console.log(areAllHeld1())

        if (areAllHeld1()) {
          var variable_index = varlist_inactive.indexOf(variable);
          varlist_inactive.splice(variable_index, 1);
          varlist_active.push(variable);          
          inputted_metadata = JSON.parse(JSON.stringify(previous_inputted_metadata));
          alert("Deletion would result in all held statistics. Try removing some holds before deleting");

        }
        else {
        document.getElementById("selection_sidebar_" + variable.replace(/\s/g, '_')).style.cssText = variable_unselected_class; 
        document.getElementById(variable.replace(/\s/g, '_')).remove();
          talktoR();
        }
   
        generate_epsilon_table();
        console.log(previous_inputted_metadata);
    
};

// Adding variables to the variable selection column
function populate_variable_selection_sidebar () {
    document.getElementById('live-search-box').style.display = "inline";

    variable_selection_sidebar = 
    "<ul id='variable_sidebar' class='live-search-list'>";

    for (n = 0; n < variable_list.length; n++) {
        variable_selection_sidebar += "<li id='selection_sidebar_" + variable_list[n].replace(/\s/g, '_') + "' data-search-term='" + variable_list[n].toLowerCase() + "' onclick='variable_selected(\""+variable_list[n]+"\")'>" + variable_list[n] + "</li>";
    };
    
    variable_selection_sidebar += "</ul>";
    
    $(".variable_sidebar").append(variable_selection_sidebar);
};




// A reset function for rows
function reset (row) {
    row[0] = "default";
    for (m = 0; m < statistic_list.length; m ++) {
        var n = 4 * m + 1;
        row[n] = 0;
        row[n + 1] = "";
        row[n + 2] = "";
        row[n + 3] = 0;
    };
    for (l = 0; l < metadata_list.length; l++) {
        var n = 1 + 4 * statistic_list.length;
        row[n + l] = "";
    };
};

// A default array 
function array_default () {
    var array_default = ['default'];
    for (m = 0; m < statistic_list.length; m ++) {
        array_default.push(0);
        array_default.push("");
        array_default.push("");
        array_default.push(0);
    };
    for (l = 0; l < metadata_list.length; l++) {
        array_default.push("");
    };
    return array_default;
};


// Make the category dropdown
// Tooltip: http://stackoverflow.com/questions/682643/tooltip-on-a-dropdown-list
function list_of_types (variable) {
    type_menu = "";
    for (m = 0; m < type_list.length; m++) {
        type_menu += "<option id='" + type_list[m] + "_" + variable + "' value='" + type_list[m] + "' title='" + rfunctions.type_label[m].type_info + "'>" + type_list[m] + "</option>";
    };
    return type_menu;
};

// Produces checkboxes on selected type
function type_selected (type_chosen, variable) {
    variable = variable.replace(/\s/g, '_');
    previous_inputted_metadata = JSON.parse(JSON.stringify(inputted_metadata));
    reset(inputted_metadata[variable]);
    
    if (!areAllHeld1()) {
    inputted_metadata[variable][0] = type_chosen;
    generate_epsilon_table();

    if (type_chosen != "default") {
        document.getElementById("released_statistics_" + variable).innerHTML = list_of_statistics(type_chosen, variable);
        document.getElementById('necessary_parameters_' + variable).innerHTML = "";
    }
    else {
        document.getElementById("released_statistics_" + variable).innerHTML = "";
        document.getElementById('necessary_parameters_' + variable).innerHTML = "";
    }

    if (previous_inputted_metadata[variable][0] != "default") {
        var stat_changed = 0;
        eval("var ppparameter = " + previous_inputted_metadata[variable][0] + "_stat_parameter_list;"); 
        for (m = 0; m < ppparameter.length; m++) {
            stat_index = 4 * ppparameter[m].rfunctions_index + 1;
            if (previous_inputted_metadata[variable][stat_index] == 2) {
                stat_changed++;    
            }
        };
        if (stat_changed > 0) {
            console.log("talk to r bc type has changed and there was valid stats removed");
            talktoR();
        }
    }
  }
  else {
    inputted_metadata = JSON.parse(JSON.stringify(previous_inputted_metadata));
    $("#variable_type_" + variable).val(inputted_metadata[variable][column_index["Variable_Type"]]);
    alert("Changing types would result in all held statistics. Try removing some holds before changing types.")
  }
	if(first_type_selected && tutorial_mode){
		hopscotch.endTour(true);  
		var tour_content =  "<ul><li>Mean: Average of the variable.</li><li> Histogram: Bar graph/counts of the categories/bins in the variable. </li><li> Quantile: Cumulative distribution function from which all quantiles can be extracted (e.g. median, percentiles, etc.)</li></ul> Note: available statistics depend on variable type.";
		var tour_target = "released_statistics_" + variable;
		var type_selected_tour = {
		  "id": "stat_selection",
		   "i18n": {
			"doneBtn":'Ok'
		  },
		  "steps": [
			{
			  "target": tour_target,
			  "placement": "bottom",
			  "title": "Select statistics to release",
			  "content": tour_content,
			  "showCTAButton":true,
			  "ctaLabel": "Disable these messages",
			  "onCTA": function() {
				hopscotch.endTour(true);
				tutorial_mode = false;
			  },
			}
		  ],
		  "showCloseButton":false,
		  "scrollDuration": 300,
		  "onEnd":  function() {
			   first_type_selected = false;
			  },
		};
    	hopscotch.startTour(type_selected_tour);
}
    console.log(previous_inputted_metadata);
};

// Makes the checkboxes
function list_of_statistics (type_chosen, variable) {
    variable = variable.replace(/\s/g, '_');
    var options = "";
    eval("var type_chosen_list = " + type_chosen + "_stat_list;")
    for (n = 0; n < type_chosen_list.length; n++) {
        options += "<input type='checkbox' name='" + type_chosen_list[n].replace(/\s/g, '_') + "' onclick='Parameter_Populate(this," + n + ",\"" + variable + "\",\"" + type_chosen + "\"); generate_epsilon_table();' id='" + type_chosen_list[n].replace(/\s/g, '_') + "_" + variable + "'> <span title='" + rfunctions.rfunctions[(column_index[type_chosen_list[n].replace(/\s/g, '_')] - 1) / 4].stat_info + "'>" + type_chosen_list[n] + "</span><br>";
    };
    return options;
};



function jamestoggle(button) {
    accordion(button);
    //console.log(button);
    //console.log(button.classList.contains("active"));
    if (button.classList.contains("active")) {
      $(button).find(".glyphicon").removeClass("glyphicon-menu-up").addClass("glyphicon-menu-down");
    } else {
      $(button).find(".glyphicon").removeClass("glyphicon-menu-down").addClass("glyphicon-menu-up");
    }
  };

// Makes bubbles and takes in variable name as unique identifier
// Forces each variable to have an unique name
function make_bubble (variable) {
    var variable_raw = variable;
    variable = variable.replace(/\s/g, '_');
    var blank_bubble = 
    "<div id='" + variable + "'>" + 
        "<div class='bubble' id='bubble_" + variable + "'>" +
            "<button class='accordion' id='accordion_" + variable + "' onclick=jamestoggle(this);>" +
                variable_raw + 
            "<i class='glyphicon glyphicon-menu-up' style='color:#A0A0A0;font-size:16px;float:right;'></i>" +
            "</button>" +
            "<div id='panel_" + variable + "' class='panel'>" +
                "<div id='variable_types_" + variable + "' class='variable_types'>" +
                    "Variable Type: " +
                    "<select id='variable_type_" + variable + "' onchange='type_selected(value,\"" + variable + "\")'>" + 
                        "<option id='default_" + variable + "' value='default'>Please select a type</option>" +
                        list_of_types(variable) +
                    "</select>" +
                    "<button type='button' class='manualinfo' data-load-url='psiIntroduction.html' data-toggle='modal' data-target='#myModal' data-id='statistics' style='float:right;'><span class='glyphicon glyphicon-question-sign' style='color:"+qmark_color+";font-size:"+qmark_size+";'></span></button>" +
                "</div>" +
                "<hr style='margin-top: -0.25em'>" +
                "<div id='released_statistics_" + variable + "' class='released_statistics'>" +
                "</div>" +
                "<hr style='margin-top: -0.25em'>" +
                "<div id='necessary_parameters_" + variable + "' class='necessary_parameters'></div>" + 
                "<div><button onclick='delete_variable(\"" + variable_raw + "\")' style='float:right;'>Delete variable</button></div>" + 
            "<br>"+
            "</div>" +
        "</div>" +
        "<br>" +
    "</div>";
    return blank_bubble;
};

// Enables Collapsable Sections for JS Generated HTML
function accordion (bubble) {
    var variable = bubble.id.slice(10, bubble.id.length);
    if (bubble.className == "accordion") {
        bubble.className = "accordion active";
        document.getElementById("panel_" + variable).className = "panel show";
    }
    else {
        bubble.className = "accordion";
        document.getElementById("panel_" + variable).className = "panel";
    };
};

// Generates bubbles from variable list recieved
function variable_bubble () {
    for (i = 0; i < varlist_active.length; i++) {
        $("#bubble_form").append(make_bubble(varlist_active[i]));
    };
};


// Generates html based on statistics choosen
function parameter_fields (variable, type_chosen) {
    eval("var pparameter = " + type_chosen + "_stat_list;");
    eval("var ppparameter = " + type_chosen + "_stat_parameter_list;");

    var needed_parameters = [];
    for (i = 0; i < ppparameter.length; i++) {
        if (inputted_metadata[variable][column_index[pparameter[i].replace(/\s/g, '_')]] > 0) {
            needed_parameters = needed_parameters.concat(rfunctions.rfunctions[ppparameter[i].rfunctions_index].statistic_type[ppparameter[i].parameter_index].parameter);
        }
        else {}
    };
    needed_parameters = needed_parameters.unique();
    // makes blank html text     
    var parameter_field = "<table>";
    if(needed_parameters.length > 0){
    	parameter_field+="<div><p><span style='color:blue;line-height:1.1;display:block; font-size:small'>The selected statistic(s) require the metadata fields below. Fill these in with reasonable estimates that a knowledgeable person could make without having looked at the raw data. <b>Do not use values directly from your raw data as this may leak private information</b>. Click <button type='button' class='manualinfo' data-load-url='psiIntroduction.html' data-toggle='modal' data-target='#myModal' data-id='statistics'  style='padding-left:0'><u>here for more information.</u></button></span></p></div>";
    }
    
    //    "<button type='button' class='manualinfo' data-load-url='psiIntroduction.html' data-toggle='modal' data-target='#myModal' data-id='accuracy' style='float:right;padding-top:0.5em;'><span class='glyphicon glyphicon-question-sign' style='color:"+qmark_color+";font-size:"+qmark_size+";'></span></button>" +

    
    // uses .unique() to get all unique values and iterate through
    for (j = 0; j < needed_parameters.length; j++) {
      // creates html list in .sort() (alphabet order)
      // parameter_field += "<span title='" + rfunctions.parameter_info[metadata_list.indexOf(needed_parameters[j].replace(/\s/g, '_'))].pinfo + "'>" + needed_parameters[j] + ":</span> <input type='text' value='" + inputted_metadata[variable][column_index[needed_parameters[j].replace(/\s/g, '_')]] + "' name='" + needed_parameters[j].replace(/\s/g, '_') + "'id='input_" + needed_parameters[j].replace(/\s/g, '_') + "_" + variable + "' onfocusin='record_table()' oninput='Parameter_Memory(this,\"" + variable + "\")' onfocusout='ValidateInput(this, \"" + rfunctions.parameter_info[metadata_list.indexOf(needed_parameters[j].replace(/\s/g, '_'))].entry_type + "\", \"" + variable + "\");'><br>";
      parameter_field += "<tr><td style='width:150px;vertical-align:middle;'><span title='" + rfunctions.parameter_info[metadata_list.indexOf(needed_parameters[j].replace(/\s/g, '_'))].pinfo + "'>" + needed_parameters[j] + ":</span></td><td style='vertical-align:middle;'>";

      if (rfunctions.parameter_info[metadata_list.indexOf(needed_parameters[j].replace(/\s/g, '_'))].input_type == "text") {
        parameter_field += "<input type='text' value='" + inputted_metadata[variable][column_index[needed_parameters[j].replace(/\s/g, '_')]] + "' name='" + needed_parameters[j].replace(/\s/g, '_') + "'id='input_" + needed_parameters[j].replace(/\s/g, '_') + "_" + variable + "' onfocusin='record_table()' oninput='Parameter_Memory(this,\"" + variable + "\")' onchange='ValidateInput(this, \"" + rfunctions.parameter_info[metadata_list.indexOf(needed_parameters[j].replace(/\s/g, '_'))].entry_type + "\", \"" + variable + "\")'></td></tr>";
      }
      else if (rfunctions.parameter_info[metadata_list.indexOf(needed_parameters[j].replace(/\s/g, '_'))].input_type == "multiple_choice_with_other_variables") {
        parameter_field += 
          "<select name='" + needed_parameters[j].replace(/\s/g, '_') + "' id='input_" + needed_parameters[j].replace(/\s/g, '_') + "_" + variable + "' onchange='record_table(); Parameter_Memory(this,\"" + variable + "\"); ValidateInput(this, \"" + rfunctions.parameter_info[metadata_list.indexOf(needed_parameters[j].replace(/\s/g, '_'))].entry_type + "\", \"" + variable + "\");'>" +
            "<option value=''>---</option>";

        for (n = 0; n < variable_list.length; n++) {
          if (variable_list[n].replace(/\s/g, '_') != variable.replace(/\s/g, '_')) {
            if (variable_list[n].replace(/\s/g, '_') != variable.replace(/\s/g, '_')) {        
              if (variable_list[n].replace(/\s/g, '_') == inputted_metadata[variable][column_index[needed_parameters[j].replace(/\s/g, '_')]]) {
                parameter_field += "<option value='" + variable_list[n].replace(/\s/g, '_') + "' selected='selected'>" + variable_list[n] + "</option>";
              }
              else {
                parameter_field += "<option value='" + variable_list[n].replace(/\s/g, '_') + "'>" + variable_list[n] + "</option>";
              }
            };
          };
        };

        parameter_field += 
          "</select></td></tr>";
      }
    };
    // prints this all out, display seems smooth
    document.getElementById('necessary_parameters_' + variable).innerHTML = parameter_field + '</table>'; 
};


// Produce parameter fields
// http://www.w3schools.com/jsref/tryit.asp?filename=tryjsref_oninput
function Parameter_Populate (stat, stat_index, variable, type_chosen) {    
    eval("var ppparameter = " + type_chosen + "_stat_parameter_list;");

    previous_inputted_metadata = JSON.parse(JSON.stringify(inputted_metadata));

    // checks if thing is checked
    if ($("#" + stat.id).prop('checked')) {
        // Updating the master data-array
        inputted_metadata[variable][column_index[stat.name]] = 1;

        // In case zero parameters needed
        epsilon_table_validation(variable, "undefined"); 
        
        // calls the parameter HTML generating function
        parameter_fields(variable, type_chosen);
    }

    // if not checked
    else {
        // splice.() help: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_fobjects/Array/splice
        // index() help: https://api.jquery.com/index/

        // Updating the master data-array
        inputted_metadata[variable][column_index[stat.name]] = 0;
        inputted_metadata[variable][column_index["epsilon_" + stat.name]] = "";
        inputted_metadata[variable][column_index["accuracy_" + stat.name]] = "";
        inputted_metadata[variable][column_index["hold_" + stat.name]] = 0;

        if (areAllHeld1()) {
          inputted_metadata = JSON.parse(JSON.stringify(previous_inputted_metadata));
          $("#" + stat.id).prop('checked', true)
          alert("Deselecting stat would result in all held statistics. Try removing some holds before deselecting stat.")
        }
        else {
        // Updates epsilon table 
        if (previous_inputted_metadata[variable][column_index[stat.name]] == 2) {
            console.log("talk to r bc a statistics was removed");
            talktoR();
        }

        // calls the parameter HTML generating function
        parameter_fields(variable, type_chosen);
      }
    }
    if(first_stat_selected && tutorial_mode && type_chosen!="Boolean"){
		hopscotch.endTour(true);  
		var tour_content =  "Possible metadata:<ul><li>Upper Bound: Largest value this variable can take on.</li><li> Lower Bound: Smallest value this variable can take on. </li><li> Granularity: minimum positive distance between two different records.</li><li>Number of Bins: number of different categories the variable can take on.</li><li>Bin names: comma-separated list of categories the variable can take on (accepts shorthand 1:3 for 1,2,3 and A:C for A,B,C). </li></ul>When you have finished filling in the required metadata, hit tab, enter, or click anywhere outside the entry box to add your statistic.";
		var tour_target = "necessary_parameters_" + variable;
		var stat_selected_tour = {
		  "id": "metadata_tour",
		   "i18n": {
			"doneBtn":'Ok'
		  },
		  "steps": [
			{
			  "target": tour_target,
			  "placement": "bottom",
			  "title": "Fill in the requested metadata",
			  "content": tour_content,
			  "showCTAButton":true,
			  "ctaLabel": "Disable these messages",
			  "onCTA": function() {
				hopscotch.endTour(true);
				tutorial_mode = false;
			  },
			}
		  ],
		  "showCloseButton":false,
		  "scrollDuration": 300,
		  "onEnd":  function() {
			   first_stat_selected = false;
			  },
		};
		hopscotch.startTour(stat_selected_tour);
        console.log(previous_inputted_metadata);
    }
};

// Stores metadata in memory
function Parameter_Memory (parameter, variable) {
    inputted_metadata[variable][column_index[parameter.name]] = parameter.value;
};




function Validation (valid_entry, entry) {
    if (valid_entry == "none") {
        return "true";
    }

    if (valid_entry == "general_text") {
        if (!entry.match(/^[a-zA-Z0-9]+$/)) {
            alert("Invalid entry. Entry can only contain numbers and letters only!");
            return "false";
        }
    }

    if (valid_entry == "text_only") {
        if (!entry.match(/^[a-zA-Z]+$/)) {
            alert("Invalid entry. Entry can only contain letters only!");
            return "false";
        }
    }

    if (valid_entry == "pos_decimal") {
        if (!entry.match(/^[+]?[0-9]*[.]{1}[0-9]+$/)) {
            alert("Invalid entry. Entry can only be positive decimals!");
            return "false";
        }
    }

    if (valid_entry == "neg_decimal") {
        if (!entry.match(/^[-]{1}[0-9]*[.]{1}[0-9]+$/)) {
            alert("Invalid entry. Entry can only be negative decimals. Must have negative sign (-) in front!");
            return "false";
        }
    }
    
    if (valid_entry == "decimal") {
        if (!entry.match(/^[+-]?[0-9]*[.]{1}[0-9]+$/)) {
            alert("Invalid entry. Entry can only be decimals!");
            return "false";
        }
    }
    
    if (valid_entry == "pos_integer") {
        if (!entry.match(/^[+]?[0-9]+$/)) {
            alert("Invalid entry. Entry can only be positive integer!");
            return "false";
        }
    }
    
    if (valid_entry == "neg_integer") {
        if (!entry.match(/^[-]{1}[0-9]+$/)) {
            alert("Invalid entry. Entry can only be negative integer. Must have negative sign (-) in front!");
            return "false";
        }
    }
    
    if (valid_entry == "integer") {
        if (!entry.match(/^[+-]?[0-9]+$/)) {
            alert("Invalid entry. Entry can only be integers!");
            return "false";
        }
    }
    
    if (valid_entry == "pos_number") {
        if (!(entry.match(/^[+]?[0-9]+[.]?$/) || entry.match(/^[+]?[0-9]*[.]{1}[0-9]+$/))) {
            alert("Invalid entry. Entry can only be positive numbers!");
            return "false";
        }
    }
    
    if (valid_entry == "neg_number") {
        if (!(entry.match(/^[-]{1}[0-9]+[.]?$/) || entry.match(/^[-]{1}[0-9]*[.]{1}[0-9]+$/))) {
            alert("Invalid entry. Entry can only be negative numbers!");
            return "false";
        }
    }
    
    if (valid_entry == "number") {
        if (!(entry.match(/^[+-]?[0-9]+[.]?$/) || entry.match(/^[+-]?[0-9]*[.]{1}[0-9]+$/))) {
            alert("Invalid entry. Entry can only be numbers!");
            return "false";
        }
    }
};







// Regex: http://www.w3schools.com/jsref/jsref_obj_regexp.asp
// Validate form based on entry_type info
function ValidateInput (input, valid_entry, variable) {
    // Actual input validation
    var entry = input.value;

    if (entry == "") {
        epsilon_table_validation(variable, input);    
        return false;
    } 

    if (Validation(valid_entry, entry) == "false") {
        inputted_metadata[variable][column_index[input.name]] = previous_inputted_metadata[variable][column_index[input.name]];
        input.value = inputted_metadata[variable][column_index[input.name]];
    }

    epsilon_table_validation(variable, input);    
};





// Epsilon Table Validation
function epsilon_table_validation (variable, input) {
    var type_chosen = inputted_metadata[variable][0];
    eval("var pparameter = " + type_chosen + "_stat_list;");
    eval("var ppparameter = " + type_chosen + "_stat_parameter_list;"); 
    var previous_stat_state; 
    for (q = 0; q < pparameter.length; q++) {
        if (inputted_metadata[variable][column_index[pparameter[q].replace(/\s/g, '_')]] > 0) {
            var sparameter = rfunctions.rfunctions[(ppparameter[(pparameter.indexOf(pparameter[q]))].rfunctions_index)].statistic_type[ppparameter[pparameter.indexOf(pparameter[q])].parameter_index].parameter;
            inputted_metadata[variable][column_index[pparameter[q].replace(/\s/g, '_')]] = 2 + sparameter.length;
            for (r = 0; r < sparameter.length; r++) {
                if (inputted_metadata[variable][column_index[sparameter[r].replace(/\s/g, '_')]] != "") {  
                  inputted_metadata[variable][column_index[pparameter[q].replace(/\s/g, '_')]]--;
                }
            };
            // previous_stat_state = inputted_metadata[variable][column_index[pparameter[q]]];
            // alert(previous_stat_state);
        }
    };
    pass_to_r_metadata(variable, input, ppparameter);
    generate_epsilon_table();  
};


// call talktoR when form is updated
function pass_to_r_metadata (variable, input, ppparameter) {
    
    var number_changed_metadata = 0;
    var changed_metadata = 0;

    var should_call_r = 0;

    var metadata_changed_statistic_is_two = 0;

    for (k = 0; k < ppparameter.length; k++) {
        // stat_index = 4 * k + 1;
        stat_index = 4 * ppparameter[k].rfunctions_index + 1;
        var prev_state = previous_inputted_metadata[variable][stat_index];
        var curr_state = inputted_metadata[variable][stat_index];
        if (curr_state >= 2) {
            number_changed_metadata++;
        }
        if ((prev_state != 2 && curr_state == 2) || (prev_state == 2 && curr_state != 2)) {
            // console.log("JJJJ")
            inputted_metadata[variable][stat_index + 1] = "";
            inputted_metadata[variable][stat_index + 2] = "";
            inputted_metadata[variable][stat_index + 3] = 0;            
            should_call_r++;
        }
        if (prev_state == 2 && curr_state == 2 && input != "undefined") {
            if (previous_inputted_metadata[variable][column_index[input.name]] != inputted_metadata[variable][column_index[input.name]] && previous_inputted_metadata[variable][column_index[input.name]] != "") {
                changed_metadata++;
                if (rfunctions.rfunctions[ppparameter[k].rfunctions_index].statistic_type[ppparameter[k].parameter_index].parameter.includes(input.name.replace(/_/g, ' '))) {
                    metadata_changed_statistic_is_two++;
                }
            }
        }
    };
    
    if (areAllHeld1()) { 
      alert("Removing metadata would result in all held statistics. Try removing some holds before removing metadata."); 
      inputted_metadata = JSON.parse(JSON.stringify(previous_inputted_metadata));
      input.value = inputted_metadata[variable][column_index[input.name]]
    }
    else {
    if (should_call_r > 0) {
        console.log("talking to r bc statistic can now be editted but doesn't cover the later case where the field becomes null");
        talktoR();
    }
    
    if (number_changed_metadata == changed_metadata && number_changed_metadata > 0 && changed_metadata > 0 && should_call_r == 0) {
        console.log("talking to r bc metadata field just changed but all entry are filled/none are blank")
        talktoR();
    }

    if (metadata_changed_statistic_is_two > 0 && number_changed_metadata != changed_metadata) {
        console.log("talking to R bc a statistic which is now edittable has it's been changed w/ some fields blank");
        talktoR();
    }
  }
};






// Record the table when text-field being editted and has changed
function record_table () {
    previous_inputted_metadata = JSON.parse(JSON.stringify(inputted_metadata));
    console.log(previous_inputted_metadata);
}


// Does the hold function
function hold_status (hold_checkbox, variable, statistic) {
    
    previous_inputted_metadata = JSON.parse(JSON.stringify(inputted_metadata));
    if ($("#" + hold_checkbox.id).prop('checked')) {
        inputted_metadata[variable][column_index["hold_" + statistic]] = 1;
            console.log(number_of_complete_stats_and_holds());

        var allHeld = areAllHeld1();
        if(allHeld){
            alert("Cannot hold every statistic");
            inputted_metadata[variable][column_index["hold_" + statistic]] = 0;
            document.getElementById(hold_checkbox.id).checked=false;
        }
    }
    else {

        inputted_metadata[variable][column_index["hold_" + statistic]] = 0;
    }
    console.log(previous_inputted_metadata);
    console.log(number_of_complete_stats_and_holds());
};

// checks if every statistic is being held. If variable is not null, checks if 
// deleting that variable would result in all statistics being held.
// function areAllHeld (variable=null){  JH: This default assignment is ES6 syntax not available in all browsers (Safari 10, but not 9, Chrome but not IE)
//  function areAllHeld (variable){  
//     // var allHeld = false;
//     variable = typeof variable !== 'undefined' ? variable : null;  // This gives the same behaviour: set as null if undefined when function called
	
//     var allHeld = true;
//     var tempvarlist = JSON.parse(JSON.stringify(varlist_active));
//     //TO Do: If no statistics are active yet, just return false. 
//     if(variable){
//         var index = tempvarlist.indexOf(variable);
//         if(index > -1){
//             tempvarlist.splice(index, 1);
//         } 
//     }
//      for (n = 0; n < tempvarlist.length; n++) {
//         for (m = 0; m < statistic_list.length; m++) {
//             var stat_index = 4 * m + 1;
//             var hold_index = 4 * m + 4;
//             // if any completed statistic is unheld, return false
//             if (inputted_metadata[tempvarlist[n].replace(/\s/g, '_')][stat_index] == 2 && inputted_metadata[tempvarlist[n].replace(/\s/g, '_')][hold_index] == 0) {
//                 allHeld = false;
//             }
//         }
//     }
//     return allHeld;
// }

function number_of_complete_stats_and_holds (table) {
  table = typeof table !== 'undefined' ? table : inputted_metadata;

  var stat_count = 0;
  var hold_count = 0;
  for (i = 0; i < varlist_active.length; i++) {
    for (j = 0; j < statistic_list.length; j++) {
      var stat_index = 4 * j + 1;
      var hold_index = 4 * j + 4;
      if (table[varlist_active[i].replace(/\s/g, '_')][stat_index] == 2) {
        stat_count++;  
      }
      if (table[varlist_active[i].replace(/\s/g, '_')][hold_index] == 1) {
        hold_count++;  
      }
    }
  }
  return [stat_count, hold_count];
}

function areAllHeld1 () {  
  // var allHeld = true;
  // for (i = 0; i < varlist_active.length; i++) {
  //   for (j = 0; j < statistic_list.length; j++) {
  //     var stat_index = 4 * j + 1;
  //     var hold_index = 4 * j + 4;
  //     if (inputted_metadata[varlist_active[i].replace(/\s/g, '_')][stat_index] == 2 && inputted_metadata[varlist_active[i].replace(/\s/g, '_')][hold_index] == 0) {
  //       allHeld = false;
  //     }
  //   }
  // }
  // return allHeld; 
  var sh = number_of_complete_stats_and_holds();
  if (sh[0] == sh[1] && sh[0] != 0 && sh[1] != 0) {
    return true;
  }
  return false;
}

function areAllHeld2 (variable) {  
  
}

display_epsilon_bool = false;
reserved_epsilon_bool = false;

function toggle_epsilon_display () {
  display_epsilon_bool = !display_epsilon_bool;
  generate_epsilon_table();
}
function toggle_reserved_epsilon_tool () {
  reserved_epsilon_bool = !reserved_epsilon_bool;
  var sli = document.getElementById('slider_div');
    if (sli.style.display === 'none') {
        sli.style.display = 'block';
    } else {
        sli.style.display = 'none';
    }
  generate_epsilon_table();
}
// Creates Epsilon 
function generate_epsilon_table () {
    var completed_statistic = false;
    var epsilon_table = 
    "<button type='button' class='manualinfo' data-load-url='psiIntroduction.html' data-toggle='modal' data-target='#myModal' data-id='accuracy' style='float:right;padding-top:0.5em;'><span class='glyphicon glyphicon-question-sign' style='color:"+qmark_color+";font-size:"+qmark_size+";'></span></button>" +
    "<table id='epsilon_table' style='width: calc(100% - 30px);'>" +
        "<tr>" +
            "<td style='font-weight: bold;'>" +
                "Variable Name" +
            "</td>" +
            "<td style='font-weight: bold;'>" +
                "Statistic" +
            "</td>";
    if (display_epsilon_bool) {
      epsilon_table +=
            "<td title='Privacy parameter' style='font-weight: bold;'>" +
                "Epsilon" +
            "</td>";
      }
    epsilon_table +=
            "<td title='Error measures differ across statistics. Click the red question mark next to any error value to learn more' style='font-weight: bold;'>" +
                "Error" +
            "</td>" +
            "<td title='The portion of the privacy budget will stay fixed for all statistics being Held' style='font-weight: bold;'>" +
                "Hold" +
            "</td>" +
        "</tr>";
    for (n = 0; n < varlist_active.length; n++) {
        for (m = 0; m < statistic_list.length; m++) {
            var stat_index = 4 * m + 1;
           	if (inputted_metadata[varlist_active[n].replace(/\s/g, '_')][stat_index] > 0) {
			// if (inputted_metadata[varlist_active[n].replace(/\s/g, '_')][stat_index] == 2) {
                epsilon_table += 
                "<tr>" +
                    "<td>" +
                        varlist_active[n] +
                    "</td>" +
                    "<td>" +
                        rfunctions.rfunctions[m].statistic +
                    "</td>"; 

                  if (inputted_metadata[varlist_active[n].replace(/\s/g, '_')][stat_index] == 2) {
                  		completed_statistic = true;
                        if (display_epsilon_bool) {
                          epsilon_table += 
                          "<td>" +
                              (parseFloat(inputted_metadata[varlist_active[n].replace(/\s/g, '_')][stat_index + 1]).toFixed(4)).toString() +
                          "</td>";
                        }
                        epsilon_table +=
                        "<td>" +
                            "<div style='text-align:center'><input type='text' style='width:50px' value='" + (parseFloat(inputted_metadata[varlist_active[n].replace(/\s/g, '_')][stat_index + 2]).toFixed(4)).toString() + "' name='accuracy_" + statistic_list[m] + "' onclick='record_table()' onchange='ValidateAccuracy(this, \"pos_number\", \"" + varlist_active[n].replace(/\s/g, '_') + "\", \"" + statistic_list[m] + "\")'>" + "<button type='button' class='manualinfo' onclick='explain_accuracy(\"" + varlist_active[n] + "\",\"" + rfunctions.rfunctions[m].statistic + "\",\"" + (parseFloat(inputted_metadata[varlist_active[n].replace(/\s/g, '_')][stat_index + 2]).toFixed(4)).toString() + "\",\"" + inputted_metadata[varlist_active[n].replace(/\s/g, '_')][0] + "\")' style='cursor:help;width:0px;' title='Explains what the error measure means.'><span class='glyphicon glyphicon-question-sign' style='color:#FA8072;;font-size:"+qmark_size+";cursor:help;'></button></div>" + 
                        "</td>" +
                        "<td>";
                        
                        if (inputted_metadata[varlist_active[n].replace(/\s/g, '_')][column_index["hold_" + statistic_list[m]]] == 1) {    
                            epsilon_table += "<input type='checkbox' id='hold_" + varlist_active[n].replace(/\s/g, '_') + "_" + statistic_list[m] + "' onclick='hold_status(this,\"" + varlist_active[n].replace(/\s/g, '_') + "\",\"" + statistic_list[m] + "\")' checked>";
                        }
                        else {
                            epsilon_table += "<input type='checkbox' id='hold_" + varlist_active[n].replace(/\s/g, '_') + "_" + statistic_list[m] + "' onclick='hold_status(this,\"" + varlist_active[n].replace(/\s/g, '_') + "\",\"" + statistic_list[m] + "\")'>";
                        }
                  }

                    else {
                        if (display_epsilon_bool) {
                          epsilon_table += 
                            "<td title='Epsilon will be editable after putting in the necessary metadata fields.'>"
                        }
                        epsilon_table += 
                        "</td>" +
                        "<td title='Error will be editable after putting in the necessary metadata fields.'>" +
                        "</td>" +
                        "<td title='Hold status will be editable after putting in the necessary metadata fields.'>";
                    }
                    
                epsilon_table +=    
                    "</td>" +
                "</tr>";
            }
            else {}
        };
    };
    epsilon_table += 
    "</table>";

    var epsilon_toggle_button_text = display_epsilon_bool ? 'Hide Epsilon' : 'Show Epsilon';
    var reserved_epsilon_toggle_button_text = reserved_epsilon_bool ? "Hide Slider" : "Reserve budget for future users";

    epsilon_table += "<br><div style='text-align:center; float:left; margin:0 0 0 70px'><input onclick='toggle_epsilon_display()' type='button' value='" + epsilon_toggle_button_text + "' id='epsilon_toggle_button' style='width:125px'> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Confidence Level (&alpha;) <input name='beta' id='global_beta_edit' onfocusout='global_parameters_beta(this)' title='Confidence level for error estimates' value='" + global_beta + "' style='color: black;' size='4' type='text' placeholder='Beta'><button type='button' class='manualinfo' data-load-url='psiIntroduction.html' data-toggle='modal' data-target='#myModal' data-id='accuracy'><span class='glyphicon glyphicon-question-sign' style='color:"+qmark_color+";font-size:"+qmark_size+";'></span></button>";
     $("#reserve_epsilon_toggle_button").remove();  // JM hacky solution to weird but that I can't figure out.
    epsilon_table += "<br><div style='text-align:center; float:left; margin:20px 0 0 0'><input onclick='toggle_reserved_epsilon_tool()' type='button' value='" + reserved_epsilon_toggle_button_text + "' id='reserve_epsilon_toggle_button' style='width:225px'> </button>";
   // epsilon_table += "<br><input  style='text-align:center; float:left; margin:20px 0 0 0' onclick='toggle_reserved_epsilon_tool()' type='button' value='" + reserved_epsilon_toggle_button_text + "' id='reserve_epsilon_toggle_button' style='width:225px'> </button></div>";

    // <br><br><input onclick='toggle_reserved_epsilon_tool();' value='" + reserved_epsilon_toggle_button_text + "' id='reserved_epsilon_toggle_button' type='button'></div>"

//     if (reserved_epsilon_bool) {
//     epsilon_table += '' + '<div style="text-align:center">' +
//                   'Slider reserves a percentage of your budget for future users (optional) </br> (This will reduce the spendable budget in the current session)' +
//                  '<br>'+
//                 '<input style="width:90%;" id="re_slider" data-slider-id="RES" type="text" data-slider-min="0" data-slider-max="100" data-slider-step="1" data-slider-value="0" />' +
//                  '<br>'+
//                   '<span id="re_label">Reserved Budget: <span id="re_value">0</span>%</span>'+
//                   "<button type='button' class='manualinfo' data-load-url='psiIntroduction.html' data-toggle='modal' data-target='#myModal' data-id='reserve'><span class='glyphicon glyphicon-question-sign' style='color:"+qmark_color+";font-size:"+qmark_size+";'></span></button>" +
//                 '</div>';
//       // epsilon_table += '' +
// //         '<table id="reserved_epsilon_table">' +
// //             '<tr id="reserved_epsilon_row">' +
// //               '<td id="reserved_epsilon_slide">' +
// //                 '<input id="reserved_epsilon_slider" data-slider-id="reserved_epsilon_slider" data-slider-min="0" data-slider-max="100" data-slider-step="1" data-slider-value="0" />' +
// //               '</td>' +
// //               '<td id="reserved_epsilon_type">' +
// //                 '<input id="reserved_epsilon_input" type="number" onchange="reserved_epsilon_input_change(this)" value="0" style="width:45px;">' +
// //               '</td>' +
// //             '</tr>' +
// //         '</table>';
//     }
    
    /////
    document.getElementById('epsilon_sidebar_top').innerHTML = epsilon_table;
    if(completed_statistic && first_completed_statistic && tutorial_mode){
    	hopscotch.endTour(true);  
		var variable_selected_tour = {
		  "id": "completed_stat",
		  "steps": [
			{
			  "target": "epsilon_table",
			  "arrowOffset":260,
			  "xOffset":50,
			  "placement": "bottom",
			  "title": "See the worst-case error estimates in your statistics",
			  "content": "To request that certain statistics be made more or less accurate, you can directly edit the error cell corresponding to each statistic. <br><br>Since your entire budget is spent on the set of statistics that you have selected at any given time, you may only alter the errors when you have more than one statistic selected. Click the red question mark for an interpretation of the error. <br><br> Click Next to continue the tour.",
			  "xOffset":70,
			  "showCTAButton":true,
			  "ctaLabel": "Disable these messages",
			  "onCTA": function() {
				hopscotch.endTour(true);
				tutorial_mode = false;
			  },
			},
			{
			  "target": "hold_" + varlist_active[0].replace(/\s/g, '_') + "_" + statistic_list[0],
			  "placement": "bottom",
			  "xOffset":-280,
			  "arrowOffset":260,
			  "title": "Clicking 'hold' for a particular statistic fixes the portion of your budget to be spent on that statistic",
			  "content": "As you add or edit the error for other statistics, the held statistics will maintain their portion of the budget.You cannot hold every statistic. <br><br> Click Next to continue the tour.",
			  "showCTAButton":true,
			  "ctaLabel": "Disable these messages",
			  "onCTA": function() {
				hopscotch.endTour(true);
				tutorial_mode = false;
			  },
			},
			{
			  "target": global_beta_edit,
			  "placement": "left",
			  "yOffset":-20,
			  //"arrowOffset":260,
			  "title": "Change the confidence level of the error estimates here",
			  "content": "When this number is set to &alpha;, the probability that the worst-case error for each of the above statistics will not exceed the estimates shown in the table is 1-&alpha;. By default, &alpha; is set to 0.05, providing a 95 percent confidence level in the error estimates. <br><br> Click Next to continue the tour.",
			  "showCTAButton":true,
			  "ctaLabel": "Disable these messages",
			  "onCTA": function() {
				hopscotch.endTour(true);
				tutorial_mode = false;
			  },
			},
			{
			  "target": "edit_button",
			  //"arrowOffset":260,
			  "yOffset":-20,
			  "placement": "left",
			  "title": "You can change your global privacy loss parameters and population size here",
			  "content": "Click Next to continue the tour.",
			  "showCTAButton":true,
			  "ctaLabel": "Disable these messages",
			  "onCTA": function() {
				hopscotch.endTour(true);
				tutorial_mode = false;
			  },
			},
			{
			  "target": "reserve_epsilon_toggle_button",
			  "placement": "bottom",
			  "title": "Slide to reserve a percentage of your budget for future users (optional)",
			  "content":"The privacy budget for any given dataset is finite. Each time someone requests statistics from a dataset, the overall budget is depleted. As the data depositor, you decide how your budget will be spent. <br> <br>You can reserve some or all of the budget for future users, allowing other researchers to choose which differentially private statistics are calculated. In turn, however, you reduce the amount of the budget that you get to spend on releasing statistics of your choice. Keep in mind that, as the data depositor, you may have the best sense of which statistics are the most valuable in your data. <br><br> Click Next to continue the tour.",
			  "yOffset":40,
			  "showCTAButton":true,
			  "ctaLabel": "Disable these messages",
			  "onCTA": function() {
				hopscotch.endTour(true);
				tutorial_mode = false;
			  },
			  "onShow": function(){
			  	var sli = document.getElementById('slider_div');
                sli.style.display = 'block';
                generate_epsilon_table();
			  },
			  "onNext": function(){
			  	var sli = document.getElementById('slider_div');
                sli.style.display = 'none';
                generate_epsilon_table();
			  },
			},
			{
			  "target": "submit_button",
			  //"arrowOffset":260,
			  //"xOffset":50,
			  "placement": "top",
			  "title": "Finalize your set of statistics here",
			  "content": "When you have finished selecting which statistics to release, have provided the necessary metadata, and are satisfied with the error estimates, submit your decisions here. This will spend your budget and calculate your statistics. This cannot be undone.<br><br> Click Next to continue the tour.",
			  "showCTAButton":true,
			  "ctaLabel": "Disable these messages",
			  "onCTA": function() {
				hopscotch.endTour(true);
				tutorial_mode = false;
			   },
			 },
             {
			  "target": "submit_info_button",
			  //"arrowOffset":260,
			  //"xOffset":50,
			  "placement": "top",
			  "title": "For more detailed information click any of the info buttons around the page",
			  "content": "",
			  "showCTAButton":true,
			  "xOffset":-20,
			  "ctaLabel": "Disable these messages",
			  "onCTA": function() {
				hopscotch.endTour(true);
				tutorial_mode = false;
			  },
			  },
		  ],
		  "showCloseButton":false,
		  "scrollDuration": 300,
		  "onEnd":  function() {
			   first_completed_statistic = false;
			  },
		};
    	hopscotch.startTour(variable_selected_tour);
    }
};



// https://github.com/seiyria/bootstrap-slider
  
var slider = new Slider("#re_slider", {
  formatter: function(value) {
    return 'Reserved: ' + value + "%";
  },
});

slider.on("slide", function(sliderValue) {
  document.getElementById("re_value").textContent = sliderValue;
});

 slider.on("slideStop", function(sliderValue) {
  // If reserving entire budget, warn user and give them an option to take it back
  if(sliderValue == 100){
  	if(confirm("This will give your entire privacy budget to future users. Your session will end and the only statistics released about your data will be those requested by other researchers. Are you sure you would like to continue?")){
  		//Session ends
  		//location.reload();
  	}
  	else{
  		sliderValue = global_sliderValue;
  		
        //JM can't figure out how to set slider back to slidervalue
  	}
  }
  if(sliderValue == 0){
  	reserved_epsilon_toggle = false;
  }
  else{
  	reserved_epsilon_toggle = true;
  }
  document.getElementById("re_value").textContent = sliderValue;
  global_sliderValue = sliderValue;
  reserved_epsilon = global_epsilon*(sliderValue/100);
  reserved_delta = global_delta*(sliderValue/100);
  calculate_fe();
  calculate_fd();
  display_params();
  talktoR();
 });
 


// JM function for displaying the privacy parameters 
function display_params () {
  var delta_split = parseFloat(global_delta);
  if (delta_split.toString().length > 10) {
    delta_split = delta_split.toFixed(10);
  }
  delta_split = parseFloat(delta_split).toExponential();
  delta_split = delta_split.split('e');

  var delta_split2 = parseFloat(global_fd);
  if (delta_split2.toString().length > 10) {
    delta_split2 = delta_split2.toFixed(10);
  }
  delta_split2 = parseFloat(delta_split2).toExponential();
  delta_split2 = delta_split2.split('e');
  //JM displaying function parameters even if sec of samp is off but reserved epsilon is on
  if (SS_value_past == '') {
  	if(reserved_epsilon_toggle){
  		var html = '<table align="center"><tr><td style="text-align:right; padding-right: 15px;">Epsilon (&epsilon;):</td><td style="text-align:left;">' + parseFloat(global_epsilon).toFixed(4) + '</td><td style="text-align:left; padding-left:15px;">( ' + parseFloat(global_fe).toFixed(4) + '</td><td style="text-align:left; padding-left:5px;"> Functioning Epsilon )</td></tr><tr><td style="text-align:right; padding-right: 15px; padding-left: 60px;">Delta (&delta;):</td><td style="text-align:left;">' + delta_split[0] + '&times;10<sup>' + delta_split[1] + '</sup></td><td style="text-align:left; padding-left:15px;">( ' + delta_split2[0] + '&times;10<sup>' + delta_split2[1] + '</sup></td><td style="text-align:left; padding-left:5px;"> Functioning Delta )</td></tr></table>';
   		document.getElementById('display_parameters').innerHTML = html;
  	}
  	else{
  		var html = '<table align="center"><tr><td style="text-align:right; padding-right: 15px;">Epsilon (&epsilon;):</td><td style="text-align:left;">' + parseFloat(global_epsilon).toFixed(4) + '</td></tr><tr><td style="text-align:right; padding-right: 15px;">Delta (&delta;):</td><td style="text-align:left;">' + delta_split[0] + '&times;10<sup>' + delta_split[1] + '</sup></td></tr><tr><td style="text-align:right; padding-right: 15px;"> </td><td style="text-align:left; padding-left: 15px;"> </td></tr></table>';
   	    document.getElementById('display_parameters').innerHTML = html;
  	}   
  }  
  else {
    var html = '<table align="center"><tr><td style="text-align:right; padding-right: 15px;">Epsilon (&epsilon;):</td><td style="text-align:left;">' + parseFloat(global_epsilon).toFixed(4) + '</td><td style="text-align:left; padding-left:15px;">( ' + parseFloat(global_fe).toFixed(4) + '</td><td style="text-align:left; padding-left:5px;"> Functioning Epsilon )</td></tr><tr><td style="text-align:right; padding-right: 15px; padding-left: 60px;">Delta (&delta;):</td><td style="text-align:left;">' + delta_split[0] + '&times;10<sup>' + delta_split[1] + '</sup></td><td style="text-align:left; padding-left:15px;">( ' + delta_split2[0] + '&times;10<sup>' + delta_split2[1] + '</sup></td><td style="text-align:left; padding-left:5px;"> Functioning Delta )</td></tr><tr><td style="text-align:center" colspan="4">Population size (optional): <span style="text-align:left; padding-left:15px;">' + SS_value_past + '</span></td></tr></table>';
    document.getElementById('display_parameters').innerHTML = html;
  }
}

function explain_accuracy (variable, statistic, accuracy, variable_type) {
	//Might want to put these in the JSON file so we don't have to write a separate one for each statistic (JM) 
	var prob = 1-global_beta;
	//var unnormed_acc = (accuracy*global_size).toFixed(3);
	var acc_explanation = "";
	var acc_prefix = "Releasing " + statistic + " for the variable " + variable +"." 
	var acc_suffix = " Here the units are the same units the variable has in the dataset.";
	if(statistic == "Mean"){
		acc_explanation =  acc_prefix + " With probability " + prob +" the output mean will differ from the true mean by at most "+accuracy +" units." +acc_suffix;
	}
	if(statistic == "Histogram"){
		acc_explanation =  acc_prefix + " Each output count will differ from its true count by at most "+accuracy+" records with probability "+prob+".";
	}
	if(statistic == "Quantile"){
		acc_explanation =  acc_prefix + " For each t, the output count of the number of datapoints less than t will differ from the true count by at most "+accuracy+" records with probability "+prob+".";
	}
	alert(acc_explanation);
 // alert("Releasing the " + statistic + " for the variable: " + variable +", which is a " + variable_type + ". The accuracy at which this is released is: " + accuracy + ", which means (INSERT SIMPLE EXPLANATION).");
}

// call talktoR when epsilon table is updated
function pass_to_r_epsilon (statistic, variable) {
    if (previous_inputted_metadata[variable][column_index[statistic] + 2] !=  inputted_metadata[variable][column_index[statistic] + 2]) {
        console.log("talk to r bc accuracy has changed; can extract var name and stat is necessary");
        talktoR("accuracyEdited", variable, statistic);
    }
};


function ValidateAccuracy (input, valid_entry, variable, statistic) {
    // Actual input validation
    var entry = input.value;

    if (Validation(valid_entry, entry) == "false") {
        inputted_metadata[variable][column_index[input.name]] = previous_inputted_metadata[variable][column_index[input.name]];
        input.value = previous_inputted_metadata[variable][column_index[input.name]];
        return false;
    }   

    inputted_metadata[variable][column_index[input.name]] = entry;
    pass_to_r_epsilon(statistic, variable);
};




// Search box logic: https://www.html5andbeyond.com/live-search-a-html-list-using-jquery-no-plugin-needed/
jQuery(document).ready(function($) {
    $('.live-search-list li').each(function() {
        $(this).attr('data-search-term', $(this).text().toLowerCase());
    });

    $('.live-search-box').on('keyup', function() {
        var searchTerm = $(this).val().toLowerCase();

        $('.live-search-list li').each(function() {
            if ($(this).filter('[data-search-term *= ' + searchTerm + ']').length > 0 || searchTerm.length < 1) {
                $(this).show();
            } 
            else {
                $(this).hide();
            }
        });
    });
});



// Get length of js dictionary length: http://jsfiddle.net/simevidas/nN84h/
// Generates a HTML datapage with all the info collected 
function report () {
    info =
    "<style>" +
    "#epsilon_table table, #epsilon_table th, #epsilon_table td {" +
        "border: 1px solid black;" +
        "border-collapse: collapse;" +
    "}" +
    "#epsilon_table th, #epsilon_table td {" +
        "padding: 5px;" +
        "text-align: center;" +
    "}" +
    "</style>" + 
    "<table id='epsilon_table' style='width: 100%;'>" +
        "<tr>" +
            "<td style='font-weight: bold;'>" +
                "Variable Name" +
            "</td>";

    for (n = 0; n < column_index_length; n++) {
        info +=             
        "<td style='font-weight: bold;'>" +
            index_column[n] +
        "</td>";
    };
    
    info += "</tr>";

    for (m = 0;  m < varlist_active.length; m++) {
        info += 
        "<tr>" +
            "<td>" +
                varlist_active[m] +
            "</td>";
        
        for (l = 0; l < column_index_length; l++) {
            info +=             
            "<td>" +
                inputted_metadata[varlist_active[m].replace(/\s/g, '_')][l] +
            "</td>";
        };

        info += "</tr>";
    };

    var report_info = window.open("");
    report_info.document.write(info + "</table>");
};


var window_global_epsilon = global_epsilon;
var window_global_delta = global_delta;
var window_global_fe = global_fe;
var window_global_fd = global_fd;
var window_SS_value_past = SS_value_past;
var window_reserved_epsilon = reserved_epsilon;

var window_global_delta_base = (parseFloat(window_global_delta).toExponential()).split('e')[0];
var window_global_delta_power = (parseFloat(window_global_delta).toExponential()).split('e')[1].substr(1);

var base_toFixed_amt = 0;
var scientific_notion_for_delta_toggle = false;
var window_reserved_epsilon_toggle = false;
var submitted_reserved_epsilon_toggle = false;

function global_parameters_beta (beta) {
    if (Validation("pos_number", beta.value) == "false") {
        beta.value = global_beta;
        return false;
    }
    else {
        if (global_beta != beta.value) {
            global_beta = beta.value;

            var is_active_stat = 0;
            for (n = 0; n < varlist_active.length; n++) {
                for (m = 0; m < statistic_list.length; m++) {
                    var stat_index = 4 * m + 1;
                    if (inputted_metadata[varlist_active[n]][stat_index] == 2) {
                        is_active_stat++;
                    }
                    if (is_active_stat > 0) {
                        break;
                    }
                }
                if (is_active_stat > 0) {
                    break;
                }
            }

            if (is_active_stat >  0) {
                console.log("talk to r bc beta changed but talks even when no stat presents has been fixed");
                talktoR("betaChange", "", "");
            }
        }
    }
}

function global_parameters_delta (delta) {
    if (Validation("pos_number", delta.value) == "false") {
        delta.value = global_delta;
        return false;
    }
    else {
        if (global_delta != delta.value) {
            global_delta = delta.value;

            var is_active_stat = 0;
            for (n = 0; n < varlist_active.length; n++) {
                for (m = 0; m < statistic_list.length; m++) {
                    var stat_index = 4 * m + 1;
                    if (inputted_metadata[varlist_active[n]][stat_index] == 2) {
                        is_active_stat++;
                    }
                    if (is_active_stat > 0) {
                        break;
                    }
                }
                if (is_active_stat > 0) {
                    break;
                }
            }

            if (is_active_stat >  0) {
                console.log("talk to r bc delta changed but talks even when no stat presents has been fixed");
                talktoR();
            }
            
            if (SS_value_past != "") {
              calculate_fd();

                for (i = 0; i < varlist_active.length; i++) {
                  for (j = 0; j < statistic_list.length; j++) {
                      if (inputted_metadata[varlist_active[i]][4 * j + 1] == 2) {
                        talktoR();
                        return "false";
                      }
                  }
                }
            }
        }
    }
}

function global_parameters_epsilon (epsilon) {
    if (Validation("pos_number", epsilon.value) == "false") {
        epsilon.value = global_epsilon;
        return false;
    }
    else {
        if (global_epsilon != epsilon.value) {
            global_epsilon = epsilon.value;

            var is_active_stat = 0;
            for (n = 0; n < varlist_active.length; n++) {
                for (m = 0; m < statistic_list.length; m++) {
                    var stat_index = 4 * m + 1;
                    if (inputted_metadata[varlist_active[n]][stat_index] == 2) {
                        is_active_stat++;
                    }
                    if (is_active_stat > 0) {
                        break;
                    }
                }
                if (is_active_stat > 0) {
                    break;
                }
            }

            if (is_active_stat >  0) {
                console.log("talk to r bc epsilon changed but talks even when no stat presents has been fixed");
                talktoR();
            }  

            if (SS_value_past != "") {
              calculate_fe();

              for (i = 0; i < varlist_active.length; i++) {
                for (j = 0; j < statistic_list.length; j++) {
                  if (inputted_metadata[varlist_active[i]][4 * j + 1] == 2) {
                    talktoR();
                    return "false";
                  }
                }
              }
            }
        }
    }
}



function delta_check (delta) {
    var format_bool = (Validation("pos_number", delta.value) == "false");
    if (format_bool || delta.value >= 1) {
        delta.value = window_global_delta;
        if (!format_bool) {
          alert("The input should be less than 1.");
        }
        return false;
    }
    else {
        if (window_global_delta != delta.value) {
            window_global_delta = delta.value;
            window_global_delta_base = (parseFloat(window_global_delta).toExponential()).split('e')[0];
            window_global_delta_power = (parseFloat(window_global_delta).toExponential()).split('e')[1].substr(1);
			global_delta = delta.value;
            
            if (window_SS_value_past != "") {
              calculate_fd();
            }
        }
    }
}

function delta_check_exp (delta, part) {
  
  if (part == 'base') {
    var format_bool = (Validation("pos_number", delta.value) == "false");  
    if (format_bool || delta.value < 1 || delta.value >= 10) {
        delta.value = window_global_delta_base;
        if (!format_bool) {
          alert("This input should be between 1 and 10.");
        }
        return false;
    }
    else {
      if (window_global_delta_base != delta.value) {
            window_global_delta_base = delta.value;
            window_global_delta = window_global_delta_base * Math.pow(10, -1 * window_global_delta_power);

            //if (window_SS_value_past != "") { //JM
              calculate_fd();
              talktoR(); //JM
            //}
        }
    }
  }
  else if (part == 'power') {
    if (Validation("pos_integer", delta.value) == "false") {
        delta.value = window_global_delta_power;
        return false;
    }
    else {
      if (window_global_delta_power != delta.value) {
            window_global_delta_power = delta.value;
            window_global_delta = window_global_delta_base * Math.pow(10, -1 * window_global_delta_power);
            
          //  if (window_SS_value_past != "") { //JM
              calculate_fd();
              talktoR(); //JM
            //}
        }
    }
  };
}

function epsilon_check (epsilon) {
    if (Validation("pos_number", epsilon.value) == "false") {
        epsilon.value = window_global_epsilon;
        return false;
    }
    else {
        if (window_global_epsilon != epsilon.value) {
            window_global_epsilon = epsilon.value;
			
			global_epsilon = epsilon.value;   //JM
           // if (window_SS_value_past != "") {
              calculate_fe();
              talktoR(); //JM
            //}
        }
    }
}

function reserved_epsilon_check (reserved_epsilon) {
  if (Validation("pos_number", reserved_epsilon.value) == "false") {
        reserved_epsilon.value = window_reserved_epsilon;
        return false;
  }
  else {
    if (window_reserved_epsilon != reserved_epsilon.value) {
        window_reserved_epsilon = reserved_epsilon.value;

           
        //if (window_SS_value_past != "") {
          calculate_fe();
          talktoR();
        //}
      }
    }
}

// function calculate_fe () {
// 	//var fe = 0;
//     var fe = Math.log(1+(Math.exp(window_global_epsilon)-1)*(window_SS_value_past / global_size));
//     
//     window_global_fe = fe;
//     $('#FE').show();
//     document.getElementById('FE_value').innerHTML = fe.toFixed(4);
//     // alert(fe);
// } 
// 
// function calculate_fd () {
//     var fd = (window_SS_value_past / global_size) * window_global_delta;
//     window_global_fd = fd;
//     $('#FD').show();
//     if (scientific_notion_for_delta_toggle) {
//       document.getElementById('FD_value').innerHTML = convert_to_scientific_notion(window_global_fd.toFixed(10));
//     }
//     else {
//       document.getElementById('FD_value').innerHTML = fd.toFixed(10);
//     }
//     // alert(fd);
// }
//JM rewrite function parameter functions:
function calculate_fe () {
	var fe = global_epsilon;
	var display = false;
	if (window_SS_value_past != "") {
    	fe = Math.log(1+(Math.exp(window_global_epsilon)-1)*(window_SS_value_past / global_size));
    	display = true;
    }
    if(reserved_epsilon_toggle){
    	fe = fe*(1-(global_sliderValue/100));
    	display = true;
    }
    global_fe = fe;
    window_global_fe = fe;
    //console.log(document.getElementById('FE_value'));
    //document.getElementById('FE_value').innerHTML = fe.toFixed(4);
    
    if(display){
  	  $('#FE').show();
    }
    else{
      $('#FE').hide();
    }
    // alert(fe);
} 

function calculate_fd () {
	var fd = global_delta;
	var display = false;
	if (window_SS_value_past != "") {
    	 fd = (window_SS_value_past / global_size) * window_global_delta;
    	 display = true;
    }
     if(reserved_epsilon_toggle){
    	fd = fd*(1-(global_sliderValue/100));
    	display = true;
    }
    global_fd = fd;
    window_global_fd = fd;
    if(display){
     $('#FD').show();
   	 if (scientific_notion_for_delta_toggle) {
  //  	  document.getElementById('FD_value').innerHTML = convert_to_scientific_notion(window_global_fd.toFixed(10));
   	 }
   	 else {
  // 	   document.getElementById('FD_value').innerHTML = fd.toFixed(10);
   	 }
   	}
   	else{
   	 $('#FD').hide();
   	}
    // alert(fd);
}
///////////////////// 
function global_parameters_SS (SS) {
    // console.log(SS.value);
    // console.log(window_global_size);
    // console.log(SS.value > window_global_size);
    // console.log('reset');
    console.log(SS.value);
    if(SS.value == "" || SS.value == " "){
		clear_SS();
	}
    // remove commas
    SS.value = parseFloat(SS.value.replace(/,/g, ''));

	
    if (SS.value != window_SS_value_past && SS.value > global_size && (Validation("pos_number", SS.value) != "false")) {
        window_SS_value_past = SS.value;
        calculate_fe();
        calculate_fd();
		talktoR();//JM added
        // for (i = 0; i < varlist_active.length; i++) {
        //   for (j = 0; j < statistic_list.length; j++) {
        //     if (inputted_metadata[varlist_active[i]][4 * j + 1] == 2) {
        //       talktoR();
        //       return "false";
        //     }
        //   }
        // }
        
        // talk to r bc e, d , and etc. changed
    }
    else {
        SS.value = window_SS_value_past;
        //alert("Please enter in a whole number greater than your sample size!");
    }
};

function clear_SS () {
    var SS_value_before_clear = window_SS_value_past;
    window_SS_value_past = "";
    document.getElementById('SS').value = "";
    calculate_fe();
    calculate_fd();
    display_params();
    talktoR();
    //JM blocked below for new reserve epsilon functionality
// 	window_global_fe = "";
// 	window_global_fd = "";
// 	document.getElementById('SS').value = "";
// 	$('#FE').hide();
// 	$('#FD').hide();

    


    // if (SS_value_before_clear != "") {
    //   for (i = 0; i < varlist_active.length; i++) {
    //     for (j = 0; j < statistic_list.length; j++) {
    //       if (inputted_metadata[varlist_active[i]][4 * j + 1] == 2) {
    //         talktoR();
    //         return "false";
    //       }
    //     }
    //   }
    // }
    
    // alert(varlist_active.length);
    // alert(statistic_list.length);
    // talktoR();
    // talk to R bc e, d, etc. changed
}

function edit_parameters_window () {
    window_global_epsilon = global_epsilon;
    window_global_delta = global_delta;
    window_global_fe = global_fe;
    window_global_fd = global_fd;
    window_SS_value_past = SS_value_past;

    window_global_delta_base = (parseFloat(window_global_delta).toExponential()).split('e')[0];
    window_global_delta_power = (parseFloat(window_global_delta).toExponential()).split('e')[1].substr(1);

    var html = '<table id="parameter_editing_table" align="center"><tr><td style="text-align:right; padding-right: 15px;"><span title="Epsilon from definition of differential privacy. Smaller values correspond to more privacy.">Epsilon (&epsilon;):</span></td><td style="padding-left: 15px;"><input id="epsilon_value" name="epsilon" onfocusout="epsilon_check(this)" title="Epsilon from definition of differential privacy. Smaller values correspond to more privacy." value="' + global_epsilon + '" style="color: black;" type="text" placeholder="Epsilon"> <!-- JM restricting reserve epsilon to slider <input title="Reserving epsilon will decrease your privacy budget, but will enable future researchers to make queries on your dataset." type="button" style="color:gray; width:200px;" onclick="add_reserved_epsilon_field()" value="Reserve Epsilon"></td></tr>-->';

    html += '<tr id="reserved_epsilon_row" style="display:none;"><td style="text-align:right; padding-right: 15px;"><span title="Epsilon from definition of differential privacy. Smaller values correspond to more privacy.">Reserved Budget:</span></td><td style="padding-left: 15px;"><input id="reserved_epsilon_value" name="reserved_epsilon" onfocusout="reserved_epsilon_check(this)" title="Reserving epsilon will decrease your privacy budget, but will enable future researchers to make queries on your dataset." value="' + reserved_epsilon + '" style="color: black;" type="text" placeholder="Reserved Budget"> <input title="" type="button" style="color:gray; width:200px;" onclick="remove_reserved_epsilon_field()" value="Remove Reserve Epsilon"></td></tr>';

    html += '<tr><td style="text-align:right; padding-right: 15px;"><span title = "Delta from definition of differential privacy. Smaller values correspond to more privacy.">Delta (&delta;):</span></td><td style="padding-left: 15px;" id="delta_row"><input id="delta_value" name="delta" onfocusout="delta_check(this)" title = "Delta from definition of differential privacy. Smaller values correspond to more privacy." value="' + global_delta + '" style="color: black;" type="text" placeholder="Delta"> <!-- <input title="Use exponential notation to enter in delta as delta is normally very small and using exponential notation to convey it is more convenient." type="button" style="color:gray; width:200px;" onclick="change_to_exponential_form(\'D\')" value="Use Exponential Notation">--></td></tr>';
    
    if (SS_value_past == '') {
      html += '<tr><td style="text-align:right; padding-right: 15px;"><span title="Is the data a random and secret sample from a larger population of known size? Here, secret means that the choice of the people in the sample has not been revealed. If this is the case, you can improve the accuracy of your statistics without changing the privacy guarantee. Estimate the size of the larger population. It is important to be conservative in your estimate. In other words, it is okay underestimate but could violate privacy if you overestimate.">Population size (optional):</span></td><td style="padding-left: 15px;"><input id="SS" name="SS" onfocusout="global_parameters_SS(this)" title="Is the data a random and secret sample from a larger population of known size? Here, secret means that the choice of the people in the sample has not been revealed. If this is the case, you can improve the accuracy of your statistics without changing the privacy guarantee. Estimate the size of the larger population. It is important to be conservative in your estimate. In other words, it is okay underestimate but could violate privacy if you overestimate." value="" style="color: black;" type="text" placeholder=""> <input title="Remove any entered value for the secrecy of the sample, and revert privacy parameters to the values without adjustment." type="button" style="color:gray; width:200px;" onclick="clear_SS()" value="Clear"></td></tr><tr id="FE" style="display:none;"><td style="text-align:right; padding-right: 15px; padding-top:15px;"><span title="When using secrecy of the sample, you get a boost in epsilon, which is represented here. This value can only be edited by changing the epsilon or secrecy of the sample fields.">Functioning Epsilon:</span></td><td style="padding-left: 15px; padding-top:15px;"><div id="FE_value" name="FE" title="When using secrecy of the sample, you get a boost in epsilon, which is represented here. This value can only be edited by changing the epsilon or secrecy of the sample fields." style="color: black;"></div></td></tr><tr id="FD" style="display:none;"><td style="text-align:right; padding-right: 15px;"><span title="When using secrecy of the sample, you get a boost in delta, which is represented here. This value can only be edited by changing the delta or secrecy of the sample fields.">Functioning Delta:</span></td><td style="padding-left: 15px;"><div id="FD_value" name="FD" title="When using secrecy of the sample, you get a boost in delta, which is represented here. This value can only be edited by changing the delta or secrecy of the sample fields." style="color: black;" ></div></td></tr></table>';
    }
    else {
      html += '<tr><td style="text-align:right; padding-right: 15px;"><span title="Is the data a random and secret sample from a larger population of known size? Here, secret means that the choice of the people in the sample has not been revealed. If this is the case, you can improve the accuracy of your statistics without changing the privacy guarantee. Estimate the size of the larger population. It is important to be conservative in your estimate. In other words, it is okay underestimate but could violate privacy if you overestimate.">Population size (optional):</span></td><td style="padding-left: 15px;"><input id="SS" name="SS" onfocusout="global_parameters_SS(this)" title="Is the data a random and secret sample from a larger population of known size? Here, secret means that the choice of the people in the sample has not been revealed. If this is the case, you can improve the accuracy of your statistics without changing the privacy guarantee. Estimate the size of the larger population. It is important to be conservative in your estimate. In other words, it is okay underestimate but could violate privacy if you overestimate." value="' + SS_value_past + '" style="color: black;" type="text" placeholder=""> <input title="Remove any entered value for the secrecy of the sample, and revert privacy parameters to the values without adjustment." type="button" style="color:gray; width:200px;" onclick="clear_SS()" value="Clear"></td></tr><tr id="FE" style=""><td style="text-align:right; padding-right: 15px; padding-top:15px;"><span title="When using secrecy of the sample, you get a boost in epsilon, which is represented here. This value can only be edited by changing the epsilon or secrecy of the sample fields.">Functioning Epsilon:</span></td><td style="padding-left: 15px; padding-top:15px;"><div id="FE_value" name="FE" title="When using secrecy of the sample, you get a boost in epsilon, which is represented here. This value can only be edited by changing the epsilon or secrecy of the sample fields." style="color: black;">' + global_fe.toFixed(4) + '</div></td></tr><tr id="FD" style=""><td style="text-align:right; padding-right: 15px;"><span title="When using secrecy of the sample, you get a boost in delta, which is represented here. This value can only be edited by changing the delta or secrecy of the sample fields.">Functioning Delta:</span></td><td style="padding-left: 15px;"><div id="FD_value" name="FD" title="When using secrecy of the sample, you get a boost in delta, which is represented here. This value can only be edited by changing the delta or secrecy of the sample fields." style="color: black;" >' + global_fd.toFixed(10) + '</div></td></tr></table>';
    }
    
    html += '<div style="text-align:center; padding-top: 40px;"><div>';//JM removed second submit button//<button type="button" class="btn btn-default" data-dismiss="modal" onclick="edit_window_closed()">Submit</button><div>';

    document.getElementById("modal-body-edit-window").innerHTML = html;

    if (scientific_notion_for_delta_toggle) {
      change_to_exponential_form('D');
    }

    if (submitted_reserved_epsilon_toggle) {
      add_reserved_epsilon_field();
    }

    $('#myModal2').modal('show');
    // $('#myModal2').find('.modal-body').replaceWith(html);
}

function change_to_exponential_form (key) {
  if (key == 'D') {
    var entry = document.getElementById('delta_value').value;
    var digits = entry.toString().length - window_global_delta_power;
    if (entry.includes('.') && !entry.includes('0.')) {
      digits = digits - 1;
    }
    if (entry.includes('0.')) {
      digits = digits - 2;
    }
    if (digits < 0 || digits > 20) {
      digits = base_toFixed_amt;
    }
    var delta_html = '<input id="delta_value_base" name="delta_base" onfocusout="delta_check_exp(this,\'base\')" title = "Delta from definition of differential privacy. Smaller values correspond to more privacy." value="' + parseFloat(window_global_delta_base).toFixed(digits) + '" style="color: black;width:107.5px" type="text" placeholder="Delta Base">&times;10<sup>-<input id="delta_value_power" name="delta_power" onfocusout="delta_check_exp(this, \'power\')" title = "Delta from definition of differential privacy. Smaller values correspond to more privacy." value="' + window_global_delta_power + '" style="color: black;width:25px;" type="text" placeholder="Delta Power"></sup> <!-- <input title="Use exponential notation to enter in delta as delta is normally very small and using exponential notation to convey it is more convenient." type="button" style="color:gray; width:200px;" onclick="change_to_exponential_form(\'E\')" value="Use Decimal Notation">-->';
    document.getElementById('delta_row').innerHTML = delta_html;
    scientific_notion_for_delta_toggle = true;

    if (window_SS_value_past != '') {
      document.getElementById('FD_value').innerHTML = convert_to_scientific_notion(window_global_fd.toFixed(10));
    }
  }
  else if (key == 'E') {
    var entry = document.getElementById('delta_value_base').value;
    var digits = parseInt(window_global_delta_power) + entry.toString().length - 1;
    if (entry.includes('.')) {
      digits = digits - 1;
    }

    if (digits < 20) {
      var delta_html = '<input id="delta_value" name="delta" onfocusout="delta_check(this)" title = "Delta from definition of differential privacy. Smaller values correspond to more privacy." value="' + parseFloat(window_global_delta).toFixed(digits) + '" style="color: black;" type="text" placeholder="Delta"> <!--<input title="Use exponential notation to enter in delta as delta is normally very small and using exponential notation to convey it is more convenient." type="button" style="color:gray; width:200px;" onclick="change_to_exponential_form(\'D\')" value="Use Exponential Notation">-->';
      document.getElementById('delta_row').innerHTML = delta_html;
      scientific_notion_for_delta_toggle = false;

      if (window_SS_value_past != '') {
        document.getElementById('FD_value').innerHTML = window_global_fd.toFixed(10);
      }
    }
    else {
      alert('Since your proposed delta is so small, the convention for expressing delta will be locked in scientific notation');
    }
  }
}

function edit_window_closed () {
  global_epsilon = window_global_epsilon;
  global_delta = window_global_delta;
  global_fe = window_global_fe;
  global_fd = window_global_fd;
  SS_value_past = window_SS_value_past;
  display_params();

  submitted_reserved_epsilon_toggle = window_reserved_epsilon_toggle;


  if (document.getElementById('delta_value_base') != null) {
    var entry = document.getElementById('delta_value_base').value;
    var digits = parseInt(window_global_delta_power) + entry.toString().length - 1;
    if (entry.includes('.')) {
      digits = digits - 1;
    }

    if (digits > 20) {
      base_toFixed_amt = entry.toString().length - 1;
      if (entry.toString().includes('.')) {
        base_toFixed_amt = base_toFixed_amt - 1;
      }
    }
  }

  for (i = 0; i < varlist_active.length; i++) {
    for (j = 0; j < statistic_list.length; j++) {
      if (inputted_metadata[varlist_active[i]][4 * j + 1] == 2) {
        talktoR();
        return "false";
      }
    }
  }

  var delta_split = parseFloat(global_delta);
  if (delta_split.toString().length > 10) {
    delta_split = delta_split.toFixed(10);
  }
  delta_split = parseFloat(delta_split).toExponential();
  delta_split = delta_split.split('e');

  var delta_split2 = parseFloat(global_fd);
  if (delta_split2.toString().length > 10) {
    delta_split2 = delta_split2.toFixed(10);
  }
  delta_split2 = parseFloat(delta_split2).toExponential();
  delta_split2 = delta_split2.split('e');


  if (SS_value_past == '') {
    var html = '<table align="center"><tr><td style="text-align:right; padding-right: 15px;">Epsilon (&epsilon;):</td><td style="text-align:left;">' + parseFloat(global_epsilon).toFixed(4) + '</td></tr><tr><td style="text-align:right; padding-right: 15px;">Delta (&delta;):</td><td style="text-align:left;">' + delta_split[0] + '&times;10<sup>' + delta_split[1] + '</sup></td></tr><tr><td style="text-align:right; padding-right: 15px;"> </td><td style="text-align:left; padding-left: 15px;"> </td></tr></table>';
    document.getElementById('display_parameters').innerHTML = html;
  }
  else {
    var html = '<table align="center"><tr><td style="text-align:right; padding-right: 15px;">Epsilon (&epsilon;):</td><td style="text-align:left;">' + parseFloat(global_epsilon).toFixed(4) + '</td><td style="text-align:left; padding-left:15px;">( ' + parseFloat(global_fe).toFixed(4) + '</td><td style="text-align:left; padding-left:5px;"> Functioning Epsilon )</td></tr><tr><td style="text-align:right; padding-right: 15px; padding-left: 60px;">Delta (&delta;):</td><td style="text-align:left;">' + delta_split[0] + '&times;10<sup>' + delta_split[1] + '</sup></td><td style="text-align:left; padding-left:15px;">( ' + delta_split2[0] + '&times;10<sup>' + delta_split2[1] + '</sup></td><td style="text-align:left; padding-left:5px;"> Functioning Delta )</td></tr><tr><td style="text-align:center" colspan="4">Population size (optional): <span style="text-align:left; padding-left:15px;">' + SS_value_past + '</span></td></tr></table>';

    document.getElementById('display_parameters').innerHTML = html;
  }
  if(tutorial_mode && first_edit_window_closed){
  	hopscotch.startTour(var_panel_tour);
  }
}





function add_reserved_epsilon_field () {
  $('#reserved_epsilon_row').show();
  window_reserved_epsilon_toggle = true;
}

function remove_reserved_epsilon_field () {
  $('#reserved_epsilon_row').hide();  
  window_reserved_epsilon_toggle = false;
}

// what happens if power is exceptionally small ???/

function convert_to_scientific_notion (number) {
  number = parseFloat(number).toExponential().split('e');
  return number[0] + '&times;10<sup>' + number[1] + '</sup>';
}
// function clear_SS () {
//   //var table = document.getElementById('parameter_editing_table');
//   $('#FE').show()
// }

// Cases when SS is activate:
// Epsilon availible and then SS added
// epsolon not available and SS is added
// cleared SS when nothing is affected
// SS cleared when table has something

// Take a bin names, as a string separate comma, for categorical


//////////////////////////////////////////////
// functions for changing exemplar datasets

function UrlExists(url, cb){
    jQuery.ajax({
        url:      url,
        dataType: 'text',
        type:     'GET',
        complete:  function(xhr){
            if(typeof cb === 'function')
               cb.apply(this, [xhr.status]);
        }
    });
}

function changedataset(newfileid) {
  	var newurl = window.location.href.split('?')[0] + "?fileid=" + newfileid +"&";
  	console.log(newurl);
  	window.location.href = newurl;
}

function overridedataset(newfileid) {
	var checkmetadataurl="https://beta.dataverse.org/api/meta/datafile/"+newfileid;
  	// Need to check if fileid is valid
  	// Need to 

  	UrlExists(checkmetadataurl, function(status){
    if(status === 200){  // file was found
  		var newurl = window.location.href.split('?')[0] + "?fileid=" + newfileid +"&";
  		console.log(newurl);
  		window.location.href = newurl;
    }
    else if(status === 404){  // 404 not found
    	window.alert("No Dataset with fileid of " + newfileid + " found on beta.dataverse.org");
    }
});
}

//////////////// 
// Define tutorial mode tours.
var var_panel_tour = {
  "id": "var_panel",
 "i18n": {
  	"doneBtn":'Ok'
  },
  "steps": [
    {
      "target": "variable_sidebar",
      "placement": "right",
      "title": "Welcome to the PSI Budgeter!",
      "content": "To begin, select a variable from your dataset.",
      "showCTAButton":true,
      "ctaLabel": "Disable these messages",
      "onCTA": function() {
        hopscotch.endTour(true);
        tutorial_mode = false;
      },
    }
  ],
  
  "showCloseButton":false,
  "scrollDuration": 300,
  "onEnd":  function() {
       first_edit_window_closed = false;
      },
};









// reserved epsilon -> slider bar -> percentage as oppose to a number
// need to display reserved epsilon outside edit window
// use (1-reserved epsilon) * epsilon to send out to the R-server

// additional feedback:
// automated helper that can be turned off/tutorial mode (like making a new gmail/gmail user)/use cookies.


// toggle for slider reserved epsilon on right hand table button
// start at zero then -> go there.






// to do:

// put alpha (edittable on third column) and put button and aplha (beta) under the table as fixed item [DONE]
// Modal window /edit button
// dynamic fixed heights
// bring back ss (should be shown)
// if ss is on, then show FE and FD (show e and d) (can't edit FE/FD)
// edit button -> Modal Windows -> should tell if edit
// accuracy inituative?? 
// tooltip faster -> red question next to accuracies -> breakdowns what the accuracy means (bootstrap library)
// change buttons designs add button to accuracy[DONE]
// delta scientific notions 
// change tooltip info (Jack)
// CHange the width of the accuracy box (since it is only four numbers) [done]
// Button aesthestics [done]
// Fix an issue where "1" for secrecy of sample is not working/responding