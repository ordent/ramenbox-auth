"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const { RamenModel } = require("@ordentco/ramenbox/src/Model/RamenModel");

class Mail extends RamenModel {
  static get table() {
    return "mails";
  }
}

exports.Mail = Mail;
