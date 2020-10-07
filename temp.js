const propertiesReader = require('properties-reader');
const prop = propertiesReader('./dashboardpro.properties');
var details = prop.getAllProperties();
console.log(details.line0);

const createjsfiles = require('./createjsfiles');

createjsfiles('./result');