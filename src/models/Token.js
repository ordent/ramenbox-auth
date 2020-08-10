"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
// const Model = use('Model')
const { RamenModel } = require("@ordentco/ramenbox/src/Model/RamenModel");
// const { RamenTransformerGenerator } = require('@ordentco/ramenbox/src/Transformer/RamenTransformerGenerator')

class Token extends RamenModel {
  static get properties() {
    return [
      "user_id",
      "token",
      "type",
      "is_revoked",
      "created_at",
      "updated_at",
    ];
  }

  static get hidden() {
    return ["id"];
  }

  static get relations() {
    return [{ user: "available" }];
  }

  user() {
    return this.belongsTo("App/Models/User", "user_id", "id");
  }

  // static get transformers () {
  // 	return 'test'
  // }
}

exports.Token = Token;
