let SpecReporter = require('jasmine-spec-reporter').SpecReporter;
var HtmlReporter = require('protractor-beautiful-reporter');

exports.config = {
    directConnect : true,
    capabilities: {
        browserName: 'chrome',
        chromeOptions: {
            args: [
                '--incognito'
            ]
        }
    },
    //specs: ['../Tests/BankManagerSimple.spec.js'], 
    suites : {
        smoke: ['../Tests/BankManagerSimple.spec.js','../Tests/demo.spec.js', '../Tests/DataProvider.spec.js'],
        regression: ['../Tests/*.spec.js']
    },

onPrepare: function () {
    browser.driver.manage().window().maximize();
    jasmine.getEnv().addReporter(new SpecReporter({
        displayFailuresSummary: true,
        displayFailuredSpec: true,
        displaySuiteNumber: true,
        displaySpecDuration: true,
        showstack: false
    }));
      // Add a screenshot reporter and store screenshots to `/tmp/screenshots`:
    jasmine.getEnv().addReporter(new HtmlReporter({
        baseDirectory: '../Report/screenshots',
        preserveDirectory: false,
        screenshotsSubfolder: 'images',
        jsonsSubfolder: 'jsons',
        docName: 'Sandisk-Report.html'
    }).getJasmine2Reporter());
},

jasmineNodeOpts: {
    showColors: true, 
    defaultTimeoutInterval: 60000,    
    print: function() {}    
}
};







// var myObject = {
//     foo: "bar",
//     func: function() {
//         var self = this;
//         console.log("outer func:  this.foo = " + this.foo);
//         console.log("outer func:  self.foo = " + self.foo);
//         (function() {
//             console.log("inner func:  this.foo = " + this.foo);
//             console.log("inner func:  self.foo = " + self.foo);
//         }());
//     }
// };
// myObject.func();