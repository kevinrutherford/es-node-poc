var readModel = require('./readModel');

var uniqueEventTypes = {};
var organisations = {};

readModel.onAnyEvent(function(evt) {
  if(!uniqueEventTypes[evt.eventType])
    uniqueEventTypes[evt.eventType] = {count:0};

  uniqueEventTypes[evt.eventType].count++;
});

readModel.handleEvents({
  organisationCreated: function(data) {
    if(!organisations[data.streamId])
      organisations[data.streamId] = {code: data.code}
  },
  OrganisationCreated_v1: function(data) {
    if(!organisations[data.streamId])
      organisations[data.streamId] = {code: data.code}
  }  
});

readModel.get({
  path:'/', 
  handler: function () {
    return {
      _links: {
        getOrganisations: "/organisations",
        getUniqueEventTypes: "/uniqueeventtypes"
      }
    }
  }
});

readModel.get({
  path:'/uniqueeventtypes', 
  handler: function () {
    return uniqueEventTypes;
  }
});

readModel.get({
  path: '/organisations',
  handler: function() {
    return {
      count: Object.keys(organisations).length,
      organisations: organisations
    };
  }
});

readModel.subscribeToEvents();

module.exports = readModel;
