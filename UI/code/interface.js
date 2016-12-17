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
    '{"statistic": "Mean", "stat_info": "Average", "statistic_type": [{"stype": "Numerical", "parameter": ["Lower Bound", "Upper Bound"]}, {"stype": "Boolean", "parameter": []}]},' + 
    '{"statistic": "Histogram", "stat_info": "Frequency", "statistic_type": [{"stype": "Numerical", "parameter": ["Lower Bound", "Upper Bound", "Number of Bins"]}, {"stype": "Categorical", "parameter": ["Bin Names"]}]},' +
    // '{"statistic": "Causal Inference", "stat_info": "Inferences", "statistic_type": [{"stype": "Numerical", "parameter": ["Lower Bound", "Upper Bound", "Treatment Variable"]}, {"stype": "Boolean", "parameter": ["Treatment Variable"]}]},' +     
    '{"statistic": "Quantile", "stat_info": "Range", "statistic_type": [{"stype": "Numerical", "parameter": ["Lower Bound", "Upper Bound", "Granularity"]}]} ],' +
    '"type_label": [ {"stype": "Numerical", "type_info": "Numbers"}, {"stype": "Boolean", "type_info": "True or False"}, {"stype": "Categorical", "type_info": "Categories"} ],' +
    '"parameter_info": [ {"parameter": "Lower Bound", "entry_type": "number", "pinfo": "Lowest Value", "input_type": "text"}, {"parameter": "Upper Bound", "entry_type": "number", "pinfo": "Highest Value", "input_type": "text"}, {"parameter": "Number of Bins", "entry_type": "pos_integer", "pinfo": "Number of Categories", "input_type": "text"}, {"parameter": "Granularity", "entry_type": "pos_integer", "pinfo": "Spread", "input_type": "text"}, {"parameter": "Treatment Variable", "entry_type": "none", "pinfo": "Other axis variable", "input_type": "multiple_choice_with_other_variables"}, {"parameter": "Bin Names", "entry_type": "none", "pinfo": "Give the names of all the bins", "input_type": "text"} ] }';

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
var global_size = 2000;
var SS_value_past = "";

// secrecy of sample/global variable * e or * d

var global_fe = "";
var global_fd = "";

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

var production=true;
var hostname="";
var metadataurl = "";
var ddiurl = "";

var dataverse_available = true;  // When Dataverse repository goes down, or is otherwise unavailable, this is a quick override for searching for metadata by url.

// Set the fileid (Dataverse reference number) for dataset to use 

var fileid = "";
var possiblefileid = location.href.match(/[?&]fileid=(.*?)[$&]/);
console.log(possiblefileid);
if(possiblefileid){
  	fileid = location.href.match(/[?&]fileid=(.*?)[$&]/)[1];   	// get fileid from URL 
  	$('#dataselect').val(fileid);         						// change value in selector box
} else {
  	fileid = document.getElementById('dataselect').value;		// get fileid from selector box which will be at default value
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
    metadataurl="../../data/Census_PUMS5_California_Subsample-ddi.xml";  // This is PUMS example metadata file
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
    document.getElementsByName('SS')[0].placeholder='value > ' + global_size;  // set the secrecy of the sample placeholder message

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

   if (SS_value_past != "") {
    var jsonout = JSON.stringify({ dict: inputted_metadata, indices: column_index, stats: statistic_list, metadata: metadata_list, globals: {eps: global_fe, del: global_fd, Beta: global_beta, n: global_size}, action: action, variable: variable, stat: stat });
   }
   else {
    var jsonout = JSON.stringify({ dict: inputted_metadata, indices: column_index, stats: statistic_list, metadata: metadata_list, globals: {eps: global_epsilon, del: global_delta, Beta: global_beta, n: global_size}, action: action, variable: variable, stat: stat });
   }

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
	var submit_info = window.open("");  // Have to open in main thread, and then adjust in async callback, as most browsers won't allow new tab creation in async function
	talktoRtwo(submit_info);  // so we're going to use the btn argument, which is present, but no longer used, to carry the new window object
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

   if (SS_value_past != "") {
    var jsonout = JSON.stringify({ dict: inputted_metadata, indices: column_index, stats: statistic_list, metadata: metadata_list, globals: {eps: global_fe, del: global_fd, Beta: global_beta, n: global_size}, fileid: fileid });
   }
   else {
    var jsonout = JSON.stringify({ dict: inputted_metadata, indices: column_index, stats: statistic_list, metadata: metadata_list, globals: {eps: global_epsilon, del: global_delta, Beta: global_beta, n: global_size}, fileid: fileid });
   }

	console.log(jsonout)
    urlcall = base+"privateStatisticsapp";
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

// Variable selection boxes change to signify selection
function variable_selected (variable) {
    if (inputted_metadata[variable.replace(/\s/g, '_')] == undefined) {
        document.getElementById("selection_sidebar_" + variable.replace(/\s/g, '_')).style.cssText = variable_selected_class; 
        create_new_variable(variable);
    }
    else {
        delete_variable(variable);
    }
    document.getElementById("live-search-box").value = "";
    $('.live-search-list li').each(function() {
        $(this).show();
    });
};





// Updates varlist_active, varlist_inactive, and creates bubble
function create_new_variable (variable) {
    // fixes javascript pass by value/reference issue
    previous_inputted_metadata = JSON.parse(JSON.stringify(inputted_metadata));
    var variable_index = varlist_inactive.indexOf(variable);
    varlist_inactive.splice(variable_index, 1);
    varlist_active.push(variable);
    inputted_metadata[variable.replace(/\s/g, '_')] = array_default();
    $("#bubble_form").append(make_bubble(variable));
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

    console.log("inside pop sidebar");
    console.log(variable_list);


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
            "<button class='accordion' id='accordion_" + variable + "' onclick=jamestoggle(this)>" +
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
                    "<button type='button' class='manualinfo' data-load-url='psiIntroduction.html' data-toggle='modal' data-target='#myModal' data-id='statistics' style='float:right;'><span class='glyphicon glyphicon-question-sign' style='color:#ADD8E6;font-size:12px;'></span></button>" +
                "</div>" +
                "<hr style='margin-top: -0.25em'>" +
                "<div id='released_statistics_" + variable + "' class='released_statistics'>" +
                "</div>" +
                "<hr style='margin-top: -0.25em'>" +
                "<div id='necessary_parameters_" + variable + "' class='necessary_parameters'></div>" + 
                "<div><button onclick='delete_variable(\"" + variable_raw + "\")'>DELETE</button></div>" + 
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
    var parameter_field = "";

    // uses .unique() to get all unique values and iterate through
    for (j = 0; j < needed_parameters.length; j++) {
      // creates html list in .sort() (alphabet order)
      // parameter_field += "<span title='" + rfunctions.parameter_info[metadata_list.indexOf(needed_parameters[j].replace(/\s/g, '_'))].pinfo + "'>" + needed_parameters[j] + ":</span> <input type='text' value='" + inputted_metadata[variable][column_index[needed_parameters[j].replace(/\s/g, '_')]] + "' name='" + needed_parameters[j].replace(/\s/g, '_') + "'id='input_" + needed_parameters[j].replace(/\s/g, '_') + "_" + variable + "' onfocusin='record_table()' oninput='Parameter_Memory(this,\"" + variable + "\")' onfocusout='ValidateInput(this, \"" + rfunctions.parameter_info[metadata_list.indexOf(needed_parameters[j].replace(/\s/g, '_'))].entry_type + "\", \"" + variable + "\");'><br>";
      
      parameter_field += "<span title='" + rfunctions.parameter_info[metadata_list.indexOf(needed_parameters[j].replace(/\s/g, '_'))].pinfo + "'>" + needed_parameters[j] + ":</span> ";

      if (rfunctions.parameter_info[metadata_list.indexOf(needed_parameters[j].replace(/\s/g, '_'))].input_type == "text") {
        parameter_field += "<input type='text' value='" + inputted_metadata[variable][column_index[needed_parameters[j].replace(/\s/g, '_')]] + "' name='" + needed_parameters[j].replace(/\s/g, '_') + "'id='input_" + needed_parameters[j].replace(/\s/g, '_') + "_" + variable + "' onfocusin='record_table()' oninput='Parameter_Memory(this,\"" + variable + "\")' onchange='ValidateInput(this, \"" + rfunctions.parameter_info[metadata_list.indexOf(needed_parameters[j].replace(/\s/g, '_'))].entry_type + "\", \"" + variable + "\")'><br>";
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
          "</select><br>";
      }
    };
    // prints this all out, display seems smooth
    document.getElementById('necessary_parameters_' + variable).innerHTML = parameter_field; 
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
    console.log(previous_inputted_metadata);
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

// Creates Epsilon 
function generate_epsilon_table () {
    var epsilon_table = 
    "<button type='button' class='manualinfo' data-load-url='psiIntroduction.html' data-toggle='modal' data-target='#myModal' data-id='statistics' style='float:right;padding-top:0.5em;'><span class='glyphicon glyphicon-question-sign' style='color:#ADD8E6;font-size:12px;'></span></button>" +
    "<table id='epsilon_table' style='width: calc(100% - 24px);'>" +
        "<tr>" +
            "<td style='font-weight: bold;'>" +
                "Variable Name" +
            "</td>" +
            "<td style='font-weight: bold;'>" +
                "Statistic" +
            "</td>" +
            "<td title='Privacy parameter' style='font-weight: bold;'>" +
                "Epsilon" +
            "</td>" +
            "<td title='How accurate?' style='font-weight: bold;'>" +
                "Accuracy" +
            "</td>" +
            "<td title='Wanna fix the epsilon/accuracy value?' style='font-weight: bold;'>" +
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
                        epsilon_table += 
                        "<td>" +
                            (parseFloat(inputted_metadata[varlist_active[n].replace(/\s/g, '_')][stat_index + 1]).toFixed(4)).toString() +
                        "</td>" +
                        "<td>" +
                            "<input type='text' style='width:75px' value='" + (parseFloat(inputted_metadata[varlist_active[n].replace(/\s/g, '_')][stat_index + 2]).toFixed(4)).toString() + "' name='accuracy_" + statistic_list[m] + "' onclick='record_table()' onfocusout='ValidateAccuracy(this, \"pos_number\", \"" + varlist_active[n].replace(/\s/g, '_') + "\", \"" + statistic_list[m] + "\");' " +
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
                        epsilon_table += 
                        "<td title='Epsilon will be edittable after putting in the necessary metadata fields.'>" +
                        "</td>" +
                        "<td title='Accuracy will be edittable after putting in the necessary metadata fields.'>" +
                        "</td>" +
                        "<td title='Hold status will be edittable after putting in the necessary metadata fields.'>";
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

    document.getElementById('epsilon_sidebar').innerHTML = epsilon_table;
};



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



function calculate_fe () {
    var fe = Math.log(1+(Math.exp(global_epsilon)-1)*(SS_value_past / global_size));
    global_fe = fe;
    document.getElementById('FE').value = fe.toFixed(4);
    // alert(fe);
} 

function calculate_fd () {
    var fd = (SS_value_past / global_size) * global_delta;
    global_fd = fd;
    document.getElementById('FD').value = fd.toFixed(10);
    // alert(fd);
}

function global_parameters_SS (SS) {
    if (SS.value != SS_value_past && SS.value > global_size && (Validation("pos_number", SS.value) != "false")) {
        SS_value_past = SS.value;
        calculate_fe();
        calculate_fd();

        for (i = 0; i < varlist_active.length; i++) {
          for (j = 0; j < statistic_list.length; j++) {
            if (inputted_metadata[varlist_active[i]][4 * j + 1] == 2) {
              talktoR();
              return "false";
            }
          }
        }
        
        // talk to r bc e, d , and etc. changed
    }
    else {
        SS.value = SS_value_past;
        // alert("Please enter in a whole number greater than your sample size!");
    }
};

function clear_SS () {
    var SS_value_before_clear = SS_value_past;
    SS_value_past = "";
    global_fe = "";
    global_fd = "";
    document.getElementById('SS').value = "";
    document.getElementById('FE').value = "";
    document.getElementById('FD').value = "";
    

    if (SS_value_before_clear != "") {
      for (i = 0; i < varlist_active.length; i++) {
        for (j = 0; j < statistic_list.length; j++) {
          if (inputted_metadata[varlist_active[i]][4 * j + 1] == 2) {
            talktoR();
            return "false";
          }
        }
      }
    }
    
    // alert(varlist_active.length);
    // alert(statistic_list.length);
    // talktoR();
    // talk to R bc e, d, etc. changed
}

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
