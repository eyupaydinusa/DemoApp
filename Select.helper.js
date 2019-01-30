var SelectHelper = function(selector){
    this.webElement = element(selector);
}
SelectHelper.prototype.getOptions = ()=>{
    return this.WebElement.all(by.tagName('option'));
};
SelectHelper.prototype.getSelectedOptions = ()=>{
    return this.WebElement.all(by.css('option[selected="selected"]'));
};
SelectHelper.prototype.selectByValue = (value)=>{
    return this.WebElement.all(by.css('option[value=" ' +value+ '"]')).click();
};
SelectHelper.prototype.selectByPartialText = (text)=>{
    return this.WebElement.all(by.cssContainingText('option',text)).click();
};
SelectHelper.prototype.getOptions = ()=>{
    return this.WebElement.all(by.xpath('option[.="' +text+ '"]')).click();
};

module.exports = SelectHelper;