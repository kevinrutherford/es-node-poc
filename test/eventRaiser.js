var request = require('request')
var uuid = require('node-uuid')

module.exports = function(streamName, eventType, data) {
  var evtId = uuid.v4()
  request({
    method: 'POST',
    url: 'http://172.17.0.2:2113/streams/' + streamName,
    json: data,
    headers: {
      "ES-EventType":eventType,
      "ES-EventId":evtId
    }
  })
}
