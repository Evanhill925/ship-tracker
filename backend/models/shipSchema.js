const mongoose = require("mongoose")
const Schema = mongoose.Schema

const midSchema = new mongoose.Schema({
  MessageID: { type: Number },
  RepeatIndicator: { type: Number },
  UserID: { type: Number },
  Valid: { type: Boolean },
  AisVersion: { type: Number },
  ImoNumber: { type: Number },
  CallSign: { type: String },
  Name: { type: String },
  Type: { type: Number },
  Dimension: { type: mongoose.Schema.Types.Mixed }, // For ShipStaticData_Dimension
  FixType: { type: Number },
  Eta: { type: mongoose.Schema.Types.Mixed }, // For ShipStaticData_Eta
  MaximumStaticDraught: { type: Number },
  Destination: { type: String },
  Dte: { type: Boolean },
  Spare: { type: Boolean }

})
const Entry = mongoose.model("static-ships", midSchema)
const mySchemas = { Entry: Entry }

module.exports = mySchemas


