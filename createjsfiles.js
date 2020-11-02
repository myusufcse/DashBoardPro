const parser = require('xml2json');
const fs = require('fs');
const path = require('path');
const propertiesReader = require('properties-reader');
var totalPass = 0;
var totalFail = 0;
var totalSkip = 0;
var total = 0;
var totalHours = 0;
var executedDate = "";
var moduleStatus = [];
var dataSet = [];

async function parseXmlFilesIntoJS(result) {
  return new Promise((resolve) => {
    const directoryPath = path.join(result + "/");
    if (fs.existsSync(directoryPath)) {
      console.log('Directory exists!');
      fs.readdir(directoryPath, function (err, files) {
        //handling error
        if (err) {
          return console.log('Unable to scan directory: ' + err);
        }
        //listing all files using forEach
        files.forEach(function (file) {
          console.log(file);
          if (file.endsWith(".xml")) {
            //console.log("parsing value from " + file);
            let xml_string = fs.readFileSync(directoryPath + file, "utf8");
            var resultJson = {};
            var module = "";
            var pass = 0, fail = 0, skip = 0;
            var json = JSON.parse(parser.toJson(xml_string, { reversible: true }));
            //console.log(json);
            resultJson = json.testsuite;
            if (parseInt(resultJson.tests) == 1) {
              var test = resultJson.testcase;
              var clsarr = test["classname"].split('.');
              var len = clsarr.length;
              test["classname"] = clsarr[len - 2] + "." + clsarr[len - 1];
              if (test.failure) {
                fail++;
                test["status"] = "FAILED";
                test["log"] = test.failure.$t;
                delete test["failure"];
              } else if (test.skipped) {
                skip++;
                test["status"] = "SKIPPED";
                test["log"] = test.skipped.$t;
                delete test["skipped"];
              } else {
                pass++;
                test["status"] = "PASSED";
                test["log"] = "";
              }
              module = resultJson.testcase.classname.split('.')[0];
              dataSet.push("\"" + module + "\":[" + JSON.stringify(resultJson.testcase) + "]");

            } else {
              resultJson.testcase.forEach(function (test) {
                var clsarr = test["classname"].split('.');
                var len = clsarr.length;
                test["classname"] = clsarr[len - 2] + "." + clsarr[len - 1];
                if (test.failure) {
                  fail++;
                  test["status"] = "FAILED";
                  test["log"] = JSON.stringify(test.failure);
                  delete test["failure"];
                } else if (test.skipped) {
                  skip++;
                  test["status"] = "SKIPPED";
                  test["log"] = JSON.stringify(test.skipped);
                  delete test["skipped"];
                } else {
                  pass++;
                  test["status"] = "PASSED";
                  test["log"] = "";
                }
              });
              module = resultJson.testcase[0].classname.split('.')[0];
              dataSet.push("\"" + module + "\":" + JSON.stringify(resultJson.testcase));
            }

            var mjson = {};
            mjson["moduleName"] = module;
            mjson["passed"] = pass;
            mjson["failed"] = fail;
            mjson["skipped"] = skip;
            mjson["total"] = parseInt(resultJson.tests);
            mjson["executedOn"] = isRealValue(resultJson.timestamp)? resultJson.timestamp : new Date().toISOString().substr(0,19);
            executedDate = mjson["executedOn"];
            // console.log(mjson);
            // input for the total cases
            totalPass += pass;
            totalFail += fail;
            totalSkip += skip;
            total += parseInt(resultJson.tests);
            totalHours += parseFloat(resultJson.time);
            moduleStatus.push(JSON.stringify(mjson));
            return resolve(true);
          } else if (file.endsWith(".json")) {

          }
        });
      });
    } else {
      console.log('Directory not found.');
    }
  });
}

module.exports = function createjsfiles(result) {
  copyFolderSync(__dirname + "/report", "./report").then(() => {
    if (!fs.existsSync("./jsfiles")) {
      fs.mkdirSync("./jsfiles");
    }
    var prop = null;
    var props = {};
    try {
      prop = propertiesReader('./dashboardpro.properties');
      props = prop.getAllProperties();
    }
    catch(err) {
      fs.copyFileSync(__dirname + "/dashboardpro.properties", "./dashboardpro.properties");
      props.line0 = 'Team Details';
      props.line1 = 'NAME : YOUR TEAM';
      props.line2 = 'APP VERSION : 1.1.1';
      props.line3 = 'ENVIRONMENT : QA';
      props.line4 = 'EXECUTED BY : YOUR NAME';
    }

    var details = props.line0 + '","' + props.line1 + '","' + props.line2 + '","' + props.line3 + '","' + props.line4;

    fs.writeFileSync('./jsfiles/squadDetails.js', 'var squadDetails = ["' + details + '"];', function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log('created squadDetails.js');
      }
    });
  });

  parseXmlFilesIntoJS(result).then(() => {
    createfiles().then((result) => {
      copyFolderSync("./jsfiles", "./report/jsonFiles/").then(() => {
        console.log('./jsfiles/' + ' was copied to destination ' + './report/jsonFiles/');
      });
    });
  });
}

async function createfiles() {
  return new Promise((resolve) => {
    //console.log(moduleStatus);
    fs.writeFileSync('./jsfiles/testcases.js', 'var dataSet = {' + dataSet + '};', function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log('updated testcases.js');
      }
    });

    fs.writeFileSync('./jsfiles/modulesStatus.js', 'var modulesStatus =  [' + moduleStatus + '];', function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log('updated moduleStatus.js');
      }
    });

    var tempjson = {};
    tempjson["passPercentage"] = parseFloat(((totalPass / (total - totalSkip)) * 100).toFixed(2));
    tempjson["totalPass"] = totalPass;
    tempjson["totalFail"] = totalFail;
    tempjson["totalSkip"] = totalSkip;
    tempjson["total"] = total;
    tempjson["totalHours"] = secondsToHms(totalHours);
    tempjson["executedDate"] = new Date().toISOString().split('.')[0];

    //console.log(tempjson);
    fs.writeFileSync('./jsfiles/todayStatus.js', 'var todayStatus = ' + JSON.stringify(tempjson) + ';', function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log('updated todayStatus.js');
      }
    });

    return resolve(true);
  });
}

async function copyFolderSync(from, to) {
  return new Promise((resolve) => {
    if (!fs.existsSync(to)) {
      fs.mkdirSync(to);
    }
    fs.readdirSync(from).forEach(element => {
      if (fs.lstatSync(path.join(from, element)).isFile()) {
        fs.copyFileSync(path.join(from, element), path.join(to, element));
        // console.log(from + " copied to " + to);
      } else {
        copyFolderSync(path.join(from, element), path.join(to, element));
      }
    });
    return resolve(true);
  });
}

function secondsToHms(d) {
  d = Number(d);
  var h = Math.floor(d / 3600);
  var m = Math.floor(d % 3600 / 60);
  var s = Math.floor(d % 3600 % 60);

  var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
  return hDisplay + mDisplay + sDisplay;
}

function isRealValue(obj)
{
 return obj && obj !== 'null' && obj !== 'undefined';
}