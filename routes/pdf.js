var express = require('express');
var router = express.Router();
var phantom = require('phantom');
var versionUrl = 'http://localhost:3000';
var util = require('util');
var exec = require('child_process').exec;
var fs = require('fs');

function waitFor(testFx, onReady, timeOutMillis) {
  var start = new Date().getTime();
  var condition = false;
  if (!testFx) {
    setTimeout(function () {
      typeof(onReady) === "string" ? eval(onReady) : onReady();
    }, timeOutMillis);
  } else {
    var interval = setInterval(function() {
      if ( (new Date().getTime() - start < timeOutMillis) && !condition ) {
        // If not time-out yet and condition not yet fulfilled
        condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
      } else {
        if(!condition) {
          // If condition still not fulfilled (timeout but condition is 'false')
          console.log("'waitFor()' timeout");
        } else {
          // Condition fulfilled (timeout and/or condition is 'true')
          console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
        }
        typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
        clearInterval(interval); //< Stop this interval
      }
    }, 233);
  }
}

function execAndProcess(command, callback) {
  return exec(command, function (error, stdout, stderr) {
    console.log(command);
    if (stdout) console.log('stdout: ' + stdout);
    if (stderr) console.log('stderr: ' + stderr);
    if (error !== null) console.log('exec error: ' + error);
    if (callback) return callback();
  });
}

function pdf (url, cookie, conditionalNodeId, cacheObject, cb) {
  var pdfNamedPipe = cacheObject.pdfNamedPipe;
  var randomTmpFile = cacheObject.randomTmpFile;
  var sitepage;
  var createNewPipe = execAndProcess('mkfifo ' + pdfNamedPipe, function () {
    // pipe the stdout to cat and write that to the temporary file
    return execAndProcess('cat < ' + pdfNamedPipe + ' > ' + randomTmpFile + ' &');
  });

  return phantom.create()
    .then(function (ph) {
      return ph.createPage();
    })
    .then(function (page) {
      sitepage = page;
      var paperSize = {
        format: 'A2',
        orientation: 'portrait',
        margin: '1cm'
      };
      var widthInInches = 8.27;
      var heightInInches = 11.69;
      var cmToInchFactor = 0.393701;
      widthInInches-= 2*cmToInchFactor;
      heightInInches-= 2*cmToInchFactor;
      var dpi = 300;
      var pdfViewportWidth = dpi*widthInInches;
      var pdfViewportHeight = dpi*heightInInches;
      var viewportSize = {
        width: 1024,
        height: 786
      };
      page.setting('userAgent', 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36');
      return page.property('paperSize', paperSize).then(function () {
        return sitepage.property('viewportSize', viewportSize).then(function () {
          sitepage.addCookie(cookie);
          return page.open(url);
        })
        .then(function (status) {
          var condition = function () {
            if (!conditionalNodeId) return undefined;
            return function () {
              sitepage.evaluate(function() {
                return $('#' + conditionalNodeId).is(":visible");
              });
            }
          };
          var final = function () {
            return sitepage.render(pdfNamedPipe)
              .then(function (status) {
                cb(null, status);
                sitepage.close();
                ph.exit();
              });
          };
          return waitFor(condition(), final, 4181);
        })
      })
    })
}

router.get('/', function(req, res, next) {
  var cacheBuster = Math.floor(1000000 * Math.random());
  var cacheObject = {
    pdfNamedPipe: 'tmp/pdfnamedstream' + cacheBuster + '.pdf',
    randomTmpFile: 'tmp/tmpfile' + cacheBuster + '.pdf'
  };
  var url = req.query.url;
  var cookie = JSON.parse(req.query.cookie);
  var conode = req.query.conode;
  var machineTitle = 'pdfoutput_';
  var showInViewer = req.query.viewer;
  var title = (req.query.title || machineTitle);
  title += new Date().getTime() + '.pdf';
  return pdf(url, cookie, conode, cacheObject, function (err, result) {
    if (err) throw err;
    var removePipe = execAndProcess('rm ' + cacheObject.pdfNamedPipe);
    if (showInViewer) {
      execAndProcess('cp ' + cacheObject.randomTmpFile + ' public/' + cacheObject.randomTmpFile);
      setTimeout(execAndProcess.bind(this, 'rm ' + cacheObject.randomTmpFile), 15000);
      setTimeout(execAndProcess.bind(this, 'rm public/' + cacheObject.randomTmpFile), 300000);
      var host = process.env.PDFHOST || 'localhost:' + process.env.PORT;
      return res.redirect('/pdfjs/web/viewer.html?file=' + encodeURIComponent('http://' + host + '/' + cacheObject.randomTmpFile));
    }
    setTimeout(execAndProcess.bind(this, 'rm ' + cacheObject.randomTmpFile), 1597);
    return res.download(cacheObject.randomTmpFile, title);
  });
});

module.exports = router;
