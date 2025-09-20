const mongoose = require("mongoose")
const Schema = mongoose.Schema

const midSchema = new mongoose.Schema({
  MessageID: { type: Number },
  RepeatIndicator: { type: Number },
  UserID: { type: Number },
  Valid: { type: Boolean },
  NavigationalStatus: { type: Number },
  RateOfTurn: { type: Number },
  Sog: { type: Number },
  PositionAccuracy: { type: Boolean },
  Longitude: { type: Number },
  Latitude: { type: Number },
  Cog: { type: Number },
  TrueHeading: { type: Number },
  Timestamp: { type: Number },
  SpecialManoeuvreIndicator: { type: Number },
  Spare: { type: Number },
  Raim: { type: Boolean },
  CommunicationState: { type: Number }
})
const Entry = mongoose.model("position-reports", midSchema)
const mySchemas = { Entry: Entry }

module.exports = mySchemas

