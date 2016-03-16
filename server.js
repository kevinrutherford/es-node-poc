var readModel = require('./readModel')

var uniqueEventTypes = {}
var organisations = {}

readModel.onAnyEvent(function(evt) {
  if(!uniqueEventTypes[evt.eventType])
    uniqueEventTypes[evt.eventType] = {count:0}

  uniqueEventTypes[evt.eventType].count++
})

readModel.handleEvents({
  organisationCreated: function(data) {
    if(!organisations[data.streamId])
      organisations[data.streamId] = {code: data.code}
  },
  OrganisationCreated_v1: function(data) {
    if(!organisations[data.streamId])
      organisations[data.streamId] = {code: data.code}
  }
})

readModel.endpoint({
  path:'/',
  handler: () => ({
    _links: {
      getOrganisations: "/organisations",
      getUniqueEventTypes: "/uniqueeventtypes"
    }
  })
})

readModel.endpoint({
  path:'/uniqueeventtypes',
  handler: () => uniqueEventTypes
})

readModel.endpoint({
  path: '/organisations',
  handler: () => ({
    count: Object.keys(organisations).length,
    organisations: organisations
  })
})

readModel.subscribeToEvents()

module.exports = readModel
