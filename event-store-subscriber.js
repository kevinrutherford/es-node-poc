var request = require('request')

var config = {}
var hasCaughtUp = false
var timeTakenToCatchUp
var timeStarted = new Date()
var totalNumberOfEvents = 0
var lastPollTimestamp = "Not yet polling"
var handleEvent

function getNextPageUri (evt) {
  var links = evt.links.filter(link => link.relation === 'previous')
  return links.length === 0 ? null : links[0].uri
}

var getNextEvents = function(uri, etagOfLastPage) {
  request({
    method: 'GET',
    url: uri,
    headers: {
      "Accept": "application/json",
      "If-None-Match": etagOfLastPage,
      "ES-LongPoll": 5
    },
    auth: {
      user: config.user,
      password: config.password
    }
  }, function (err, response, bodyString) {
    if(err)
      throw err

    if(response.statusCode === 304){
      lastPollTimestamp = new Date()
      getNextEvents(uri, etagOfLastPage)
    } else {
      try{
        var body = JSON.parse(bodyString)
      } catch(ex) {
        console.log("Error parsing bodyString>" + bodyString + "<")
        throw ex
      }

      if(body.entries.length === 0) {
        hasCaughtUp = true
        timeTakenToCatchUp = (new Date() - timeStarted) / 1000
        getNextEvents(uri, response.headers.etag)
      } else {
        var numberOfEvents = body.entries.length
        totalNumberOfEvents = totalNumberOfEvents + numberOfEvents

        for(var i=numberOfEvents-1; i>=0; i--){
          var evt = body.entries[i]
          handleEvent(evt)
        }
        var nextEventUri = getNextPageUri(body)
        getNextEvents(nextEventUri + "?embed=body", null)
      }
    }
  })
}

module.exports = function(handler) {
  config.esServer = process.env.EVENTSTORE_HTTP_HOST || 'http://127.0.0.1:2113'
  config.user = process.env.EVENTSTORE_USERNAME || 'admin'
  config.password = process.env.EVENTSTORE_PASSWORD || 'changeit'
  handleEvent = handler

  return {
    start: function() {
      getNextEvents(config.esServer + '/streams/%24all/00000000000000000000000000000000/forward/20?embed=body', '')
    },

    info: function() {
      return {
        hasCaughtUp: hasCaughtUp,
        timeTakenToCatchUp: timeTakenToCatchUp,
        totalNumberOfEvents: totalNumberOfEvents,
        lastPollTimestamp: lastPollTimestamp
      }
    }
  }
}
