require('../Utilities/CustomLocators.js');
var HomePage =  require('../Pages/Home.page.js');
var BankManagerPage = require('../Pages/BankManager.page.js');
var Base = require('../Utilities/Base.js');
var AddCustomerPage = require('../Pages/AddCustomerPage.page.js');
var Customers = require('../Pages/Customers.page.js');
var BankData = require('../TestData/BankData.json')

//var Excel = require('excel.js');
// var wb = new Excel.Workbook();  //create workbook
// var sh;                         //getting existing worksheet
// var filePath = "../TestData/CustomerList.xlsx";  
// var sheetName="Sheet1";
// var accountNumbers = [];  

// var SelectHelper = require('../Utilities/Select.helper.js');
// var customerSelectBox = new SelectHelper(by.id('userSelect'));
// var currencySelectBox = new SelectHelper(by.id('currency'));


describe('Add Customer', function() {
    describe('Adding a Customer', () => {
        beforeAll(function(){
            // wb.xlsx.readFile(filePath).then(function(){
            //     sh = wb.getWorkSheet(sheetName);
            // })
            Base.navigateToHome();
            HomePage.managerLoginButton.click();
            AddCustomerPage.goToAddCustomer();
        });
        it('should display form for Adding Customer', () => {
            Base.navigateToHome();
            HomePage.managerLoginButton.click();
            AddCustomerPage.goToAddCustomer();
            expect(AddCustomerPage.customerForm.isDisplayed()).toBe(true);
            expect(AddCustomerPage.formLabels.count()).toEqual(3);
        });
        it('should list all the labels', () => {
            expect(AddCustomerPage.formLabels.get(0).getText()).toEqual('First Name :')
            expect(AddCustomerPage.formLabels.get(1).getText()).toEqual('Last Name :')
            expect(AddCustomerPage.formLabels.get(2).getText()).toEqual('Post Code :')
        });
        it('should require first name', () => {
            expect(AddCustomerPage.formRequiredFields.get(0).getAttribute('required')).toEqual('true'); 
        });
        it('should require last name', () => {
            expect(AddCustomerPage.formRequiredFields.get(1).getAttribute('required')).toEqual('true'); 
        });
        it('should require post code', () => {
            expect(AddCustomerPage.formRequiredFields.get(2).getAttribute('required')).toEqual('true'); 
        });
        it('should add customer', () => {
                //AddCustomerPage.firstNameInputBox.sendKeys('Jeff');
                for (var i = 0; i < BankData.customers.length; i++) {
                    AddCustomerPage.goToAddCustomer();
                    AddCustomerPage.firstNameInputBox.sendKeys(BankData.customers[i].fName);
                    AddCustomerPage.lastNameInputBox.sendKeys(BankData.customers[i].lName);
                    AddCustomerPage.postalCodeInputBox.sendKeys(BankData.customers[i].pCode);
                    AddCustomerPage.formAddCustomerButton.click();
                    expect(browser.switchTo().alert().getText()).toContain('added successfully');
                    browser.switchTo().alert().accept();
                    BankManagerPage.customersButton.click();
                    expect(Customers.getLastRowValue(1).getText()).toEqual(BankData.customers[i].fName);
                    expect(Customers.getLastRowValue(2).getText()).toEqual(BankData.customers[i].lName);
                    expect(Customers.getLastRowValue(3).getText()).toEqual(BankData.customers[i].pCode);
                }  
        });
    });
});
    