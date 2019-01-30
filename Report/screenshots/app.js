var app = angular.module('reportingApp', []);

//<editor-fold desc="global helpers">

var isValueAnArray = function (val) {
    return Array.isArray(val);
};

var getSpec = function (str) {
    var describes = str.split('|');
    return describes[describes.length - 1];
};
var checkIfShouldDisplaySpecName = function (prevItem, item) {
    if (!prevItem) {
        item.displaySpecName = true;
    } else if (getSpec(item.description) !== getSpec(prevItem.description)) {
        item.displaySpecName = true;
    }
};

var getParent = function (str) {
    var arr = str.split('|');
    str = "";
    for (var i = arr.length - 2; i > 0; i--) {
        str += arr[i] + " > ";
    }
    return str.slice(0, -3);
};

var getShortDescription = function (str) {
    return str.split('|')[0];
};

var countLogMessages = function (item) {
    if ((!item.logWarnings || !item.logErrors) && item.browserLogs && item.browserLogs.length > 0) {
        item.logWarnings = 0;
        item.logErrors = 0;
        for (var logNumber = 0; logNumber < item.browserLogs.length; logNumber++) {
            var logEntry = item.browserLogs[logNumber];
            if (logEntry.level === 'SEVERE') {
                item.logErrors++;
            }
            if (logEntry.level === 'WARNING') {
                item.logWarnings++;
            }
        }
    }
};

var defaultSortFunction = function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) {
        return -1;
    }
    else if (a.sessionId > b.sessionId) {
        return 1;
    }

    if (a.timestamp < b.timestamp) {
        return -1;
    }
    else if (a.timestamp > b.timestamp) {
        return 1;
    }

    return 0;
};


//</editor-fold>

app.controller('ScreenshotReportController', function ($scope, $http) {
    var that = this;
    var clientDefaults = {};

    $scope.searchSettings = Object.assign({
        description: '',
        allselected: true,
        passed: true,
        failed: true,
        pending: true,
        withLog: true
    }, clientDefaults.searchSettings || {}); // enable customisation of search settings on first page hit

    var initialColumnSettings = clientDefaults.columnSettings; // enable customisation of visible columns on first page hit
    if (initialColumnSettings) {
        if (initialColumnSettings.displayTime !== undefined) {
            // initial settings have be inverted because the html bindings are inverted (e.g. !ctrl.displayTime)
            this.displayTime = !initialColumnSettings.displayTime;
        }
        if (initialColumnSettings.displayBrowser !== undefined) {
            this.displayBrowser = !initialColumnSettings.displayBrowser; // same as above
        }
        if (initialColumnSettings.displaySessionId !== undefined) {
            this.displaySessionId = !initialColumnSettings.displaySessionId; // same as above
        }
        if (initialColumnSettings.displayOS !== undefined) {
            this.displayOS = !initialColumnSettings.displayOS; // same as above
        }
        if (initialColumnSettings.inlineScreenshots !== undefined) {
            this.inlineScreenshots = initialColumnSettings.inlineScreenshots; // this setting does not have to be inverted
        } else {
            this.inlineScreenshots = false;
        }
    }

    this.showSmartStackTraceHighlight = true;

    this.chooseAllTypes = function () {
        var value = true;
        $scope.searchSettings.allselected = !$scope.searchSettings.allselected;
        if (!$scope.searchSettings.allselected) {
            value = false;
        }

        $scope.searchSettings.passed = value;
        $scope.searchSettings.failed = value;
        $scope.searchSettings.pending = value;
        $scope.searchSettings.withLog = value;
    };

    this.isValueAnArray = function (val) {
        return isValueAnArray(val);
    };

    this.getParent = function (str) {
        return getParent(str);
    };

    this.getSpec = function (str) {
        return getSpec(str);
    };

    this.getShortDescription = function (str) {
        return getShortDescription(str);
    };

    this.convertTimestamp = function (timestamp) {
        var d = new Date(timestamp),
            yyyy = d.getFullYear(),
            mm = ('0' + (d.getMonth() + 1)).slice(-2),
            dd = ('0' + d.getDate()).slice(-2),
            hh = d.getHours(),
            h = hh,
            min = ('0' + d.getMinutes()).slice(-2),
            ampm = 'AM',
            time;

        if (hh > 12) {
            h = hh - 12;
            ampm = 'PM';
        } else if (hh === 12) {
            h = 12;
            ampm = 'PM';
        } else if (hh === 0) {
            h = 12;
        }

        // ie: 2013-02-18, 8:35 AM
        time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;

        return time;
    };


    this.round = function (number, roundVal) {
        return (parseFloat(number) / 1000).toFixed(roundVal);
    };


    this.passCount = function () {
        var passCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.passed) {
                passCount++;
            }
        }
        return passCount;
    };


    this.pendingCount = function () {
        var pendingCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.pending) {
                pendingCount++;
            }
        }
        return pendingCount;
    };


    this.failCount = function () {
        var failCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (!result.passed && !result.pending) {
                failCount++;
            }
        }
        return failCount;
    };

    this.passPerc = function () {
        return (this.passCount() / this.totalCount()) * 100;
    };
    this.pendingPerc = function () {
        return (this.pendingCount() / this.totalCount()) * 100;
    };
    this.failPerc = function () {
        return (this.failCount() / this.totalCount()) * 100;
    };
    this.totalCount = function () {
        return this.passCount() + this.failCount() + this.pendingCount();
    };

    this.applySmartHighlight = function (line) {
        if (this.showSmartStackTraceHighlight) {
            if (line.indexOf('node_modules') > -1) {
                return 'greyout';
            }
            if (line.indexOf('  at ') === -1) {
                return '';
            }

            return 'highlight';
        }
        return true;
    };

    var results = [
    {
        "description": "should have correct page title|Manager Login|Bank Manager",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 8069,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.81"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/002300c9-00d7-00f8-0027-00160063004f.png",
        "timestamp": 1548883814239,
        "duration": 3868
    },
    {
        "description": "should display home button|Manager Login|Bank Manager",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 8069,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.81"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/001400fb-008e-0084-00fb-007e002400b3.png",
        "timestamp": 1548883818609,
        "duration": 777
    },
    {
        "description": "should display page header|Manager Login|Bank Manager",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 8069,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.81"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00bb00da-0038-007a-00c7-004c005d003f.png",
        "timestamp": 1548883819799,
        "duration": 704
    },
    {
        "description": "should display login option for Bank Manager|Manager Login|Bank Manager",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 8069,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.81"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/004e00e8-009e-005e-00fd-00cf002600da.png",
        "timestamp": 1548883820913,
        "duration": 571
    },
    {
        "description": "should stay at the homepage when Home Button is clicked|Manager Login|Bank Manager",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 8069,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.81"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00c1008d-00d7-0036-00c8-0049008f000c.png",
        "timestamp": 1548883821912,
        "duration": 517
    },
    {
        "description": "should login as Bank Manager|Manager Login|Bank Manager",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 8069,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.81"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00600068-00c8-006e-003a-00900065007a.png",
        "timestamp": 1548883822866,
        "duration": 1026
    },
    {
        "description": "should display  options for manager|Manager Login|Bank Manager",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 8069,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.81"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0059005b-000d-0081-0024-00e800e80017.png",
        "timestamp": 1548883824302,
        "duration": 781
    },
    {
        "description": "should navigate back to home page from Manager Login Page|Manager Login|Bank Manager",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 8069,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.81"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/007f00d4-00ce-008d-0080-00ae000700d6.png",
        "timestamp": 1548883825497,
        "duration": 836
    },
    {
        "description": "should check if element is displayed|Demonstrating Jasmine spec reporter",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 8069,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.81"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/001f00df-0024-0001-006b-005f001d00a0.png",
        "timestamp": 1548883826755,
        "duration": 4011
    },
    {
        "description": "should add customer: Elon Musk|Jasmine Data Provider ",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 8069,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.81"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00390077-0070-002f-0086-00d600e80036.png",
        "timestamp": 1548883831942,
        "duration": 1541
    },
    {
        "description": "should add customer: Warren Buffet|Jasmine Data Provider ",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 8069,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.81"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/0089009f-0046-007a-0017-00be00c40023.png",
        "timestamp": 1548883833925,
        "duration": 421
    },
    {
        "description": "should add customer: Amanico Ortega|Jasmine Data Provider ",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 8069,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.81"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/000d00bb-00cf-0010-0001-00a100b3007a.png",
        "timestamp": 1548883834787,
        "duration": 424
    },
    {
        "description": "should display form for Adding Customer|Adding a Customer|Add Customer",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 8069,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.81"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00c300b1-0062-001f-00bd-0069006200b0.png",
        "timestamp": 1548883836485,
        "duration": 777
    },
    {
        "description": "should list all the labels|Adding a Customer|Add Customer",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 8069,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.81"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/009500d7-00d7-00fe-0099-0009002800e7.png",
        "timestamp": 1548883837716,
        "duration": 76
    },
    {
        "description": "should require first name|Adding a Customer|Add Customer",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 8069,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.81"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00f60039-00e4-006a-0002-006700c40097.png",
        "timestamp": 1548883838206,
        "duration": 20
    },
    {
        "description": "should require last name|Adding a Customer|Add Customer",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 8069,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.81"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/00e9006a-0050-007b-004f-0082006c00df.png",
        "timestamp": 1548883838638,
        "duration": 17
    },
    {
        "description": "should require post code|Adding a Customer|Add Customer",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 8069,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.81"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images/002900b1-00a1-0011-005c-00ce00b6002a.png",
        "timestamp": 1548883839081,
        "duration": 19
    },
    {
        "description": "should add customer|Adding a Customer|Add Customer",
        "passed": false,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 8069,
        "browser": {
            "name": "chrome",
            "version": "72.0.3626.81"
        },
        "message": [
            "Failed: No element found using locator: By(xpath, //tbody/tr[last()]/td[1])"
        ],
        "trace": [
            "NoSuchElementError: No element found using locator: By(xpath, //tbody/tr[last()]/td[1])\n    at elementArrayFinder.getWebElements.then (/usr/local/lib/node_modules/protractor/built/element.js:814:27)\n    at ManagedPromise.invokeCallback_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1376:14)\n    at TaskQueue.execute_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3067:27)\n    at asyncRun (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2927:27)\n    at /usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:668:7\n    at process._tickCallback (internal/process/next_tick.js:68:7)Error\n    at ElementArrayFinder.applyAction_ (/usr/local/lib/node_modules/protractor/built/element.js:459:27)\n    at ElementArrayFinder.(anonymous function).args [as getText] (/usr/local/lib/node_modules/protractor/built/element.js:91:29)\n    at ElementFinder.(anonymous function).args [as getText] (/usr/local/lib/node_modules/protractor/built/element.js:831:22)\n    at UserContext.it (/Users/mac/Desktop/Bank/Tests/AddCustomer.spec.js:63:57)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:112:25\n    at new ManagedPromise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:1077:7)\n    at ControlFlow.promise (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2505:12)\n    at schedulerExecute (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:95:18)\n    at TaskQueue.execute_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3084:14)\n    at TaskQueue.executeNext_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:3067:27)\nFrom: Task: Run it(\"should add customer\") in control flow\n    at UserContext.<anonymous> (/usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:94:19)\n    at attempt (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4297:26)\n    at QueueRunner.run (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4217:20)\n    at runNext (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4257:20)\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4264:13\n    at /usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4172:9\n    at /usr/local/lib/node_modules/protractor/node_modules/jasminewd2/index.js:64:48\n    at ControlFlow.emit (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/events.js:62:21)\n    at ControlFlow.shutdown_ (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2674:10)\n    at shutdownTask_.MicroTask (/usr/local/lib/node_modules/protractor/node_modules/selenium-webdriver/lib/promise.js:2599:53)\nFrom asynchronous test: \nError\n    at Suite.describe (/Users/mac/Desktop/Bank/Tests/AddCustomer.spec.js:52:9)\n    at addSpecsToSuite (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Suite.<anonymous> (/Users/mac/Desktop/Bank/Tests/AddCustomer.spec.js:22:5)\n    at addSpecsToSuite (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1107:25)\n    at Env.describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1074:7)\n    at describe (/usr/local/lib/node_modules/protractor/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:4399:18)\n    at Object.<anonymous> (/Users/mac/Desktop/Bank/Tests/AddCustomer.spec.js:21:1)"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://ajax.googleapis.com/ajax/libs/angularjs/1.4.7/angular.min.js 106:208 \"Error: [ngRepeat:dupes] http://errors.angularjs.org/1.4.7/ngRepeat/dupes?p0=cust%20in%20Customers%20%7C%20orderBy%3AsortType%3AsortReverse%20%7C%20filter%3AsearchCustomer&p1=object%3A27&p2=%7B%22fName%22%3A%22Amanico%22%2C%22lName%22%3A%22Ortega%22%2C%22postCd%22%3A%22112233%22%2C%22id%22%3A8%2C%22date%22%3A%222019-01-30T21%3A30%3A34.993Z%22%2C%22%24%24hashKey%22%3A%22object%3A27%22%7D\\n    at https://ajax.googleapis.com/ajax/libs/angularjs/1.4.7/angular.min.js:6:416\\n    at https://ajax.googleapis.com/ajax/libs/angularjs/1.4.7/angular.min.js:280:39\\n    at Object.fn (https://ajax.googleapis.com/ajax/libs/angularjs/1.4.7/angular.min.js:129:391)\\n    at n.$digest (https://ajax.googleapis.com/ajax/libs/angularjs/1.4.7/angular.min.js:130:483)\\n    at n.$apply (https://ajax.googleapis.com/ajax/libs/angularjs/1.4.7/angular.min.js:133:512)\\n    at h (https://ajax.googleapis.com/ajax/libs/angularjs/1.4.7/angular.min.js:87:376)\\n    at K (https://ajax.googleapis.com/ajax/libs/angularjs/1.4.7/angular.min.js:91:499)\\n    at XMLHttpRequest.z.onload (https://ajax.googleapis.com/ajax/libs/angularjs/1.4.7/angular.min.js:93:37)\"",
                "timestamp": 1548883839850,
                "type": ""
            }
        ],
        "screenShotFile": "images/009100a7-007e-005a-0057-00fb00b800de.png",
        "timestamp": 1548883839521,
        "duration": 370
    }
];

    this.sortSpecs = function () {
        this.results = results.sort(function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) return -1;else if (a.sessionId > b.sessionId) return 1;

    if (a.timestamp < b.timestamp) return -1;else if (a.timestamp > b.timestamp) return 1;

    return 0;
});
    };

    this.loadResultsViaAjax = function () {

        $http({
            url: './combined.json',
            method: 'GET'
        }).then(function (response) {
                var data = null;
                if (response && response.data) {
                    if (typeof response.data === 'object') {
                        data = response.data;
                    } else if (response.data[0] === '"') { //detect super escaped file (from circular json)
                        data = CircularJSON.parse(response.data); //the file is escaped in a weird way (with circular json)
                    }
                    else
                    {
                        data = JSON.parse(response.data);
                    }
                }
                if (data) {
                    results = data;
                    that.sortSpecs();
                }
            },
            function (error) {
                console.error(error);
            });
    };


    if (clientDefaults.useAjax) {
        this.loadResultsViaAjax();
    } else {
        this.sortSpecs();
    }


});

app.filter('bySearchSettings', function () {
    return function (items, searchSettings) {
        var filtered = [];
        if (!items) {
            return filtered; // to avoid crashing in where results might be empty
        }
        var prevItem = null;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item.displaySpecName = false;

            var isHit = false; //is set to true if any of the search criteria matched
            countLogMessages(item); // modifies item contents

            var hasLog = searchSettings.withLog && item.browserLogs && item.browserLogs.length > 0;
            if (searchSettings.description === '' ||
                (item.description && item.description.toLowerCase().indexOf(searchSettings.description.toLowerCase()) > -1)) {

                if (searchSettings.passed && item.passed || hasLog) {
                    isHit = true;
                } else if (searchSettings.failed && !item.passed && !item.pending || hasLog) {
                    isHit = true;
                } else if (searchSettings.pending && item.pending || hasLog) {
                    isHit = true;
                }
            }
            if (isHit) {
                checkIfShouldDisplaySpecName(prevItem, item);

                filtered.push(item);
                prevItem = item;
            }
        }

        return filtered;
    };
});

