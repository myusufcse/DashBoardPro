const parser = require('xml2json');
const fs = require('fs');
const path = require('path');
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
              test["classname"] = test["classname"].replace(/com.bnppf.easybanking./g, '');
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
                test["classname"] = test["classname"].replace(/com.bnppf.easybanking./g, '');
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
            mjson["executedOn"] = resultJson.timestamp;
            executedDate = resultJson.timestamp;
            console.log(mjson);
            // input for the total cases
            totalPass += pass;
            totalFail += fail;
            totalSkip += skip;
            total += parseInt(resultJson.tests);
            totalHours += parseFloat(resultJson.time);
            moduleStatus.push(JSON.stringify(mjson));
            return resolve(true);
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
    if (!fs.existsSync('./jsfiles/lastTenHistory.js')) {
      fs.writeFileSync('./jsfiles/lastTenHistory.js', 'var lastTenHistory = []; module.exports = lastTenHistory;', function (err) {
        if (err) {
          console.log(err);
        } else {
          const data = fs.readFileSync('./jsfiles/lastTenHistory.js', 'utf8')
          console.log("*************",data);
          console.log('created lastTenHistory.js');
        }
      });
    }
  });

  parseXmlFilesIntoJS(result).then(() => {
    createfiles().then((result) => {
      console.log("************", result);
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

    console.log(tempjson);
    fs.writeFileSync('./jsfiles/todayStatus.js', 'var todayStatus = ' + JSON.stringify(tempjson) + ';', function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log('updated todayStatus.js');
      }
    });

    var trendjson = {};
    trendjson["totalPass"] = totalPass;
    trendjson["totalFail"] = totalFail;
    trendjson["totalSkip"] = totalSkip;
    trendjson["executedDate"] = new Date().toISOString().split('T')[0];

    var trendReport = require('../../jsfiles/lastTenHistory');
    console.log("##########",trendReport);

    var history = [];
    trendReport.forEach(report => {
      console.log("##########",JSON.stringify(report));
      history.push(JSON.stringify(report));
    });

    history.push(JSON.stringify(trendjson));
    if (history.length > 10) {
      history.shift();
    }

    fs.writeFileSync('./jsfiles/lastTenHistory.js', 'var lastTenHistory = [' + history + ']; module.exports = lastTenHistory;', function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log('updated lastTenHistory.js');
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
