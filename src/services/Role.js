"use strict";

const moment = require("moment");

const {
  RamenServices,
} = require("@ordentco/ramenbox/src/Services/RamenServices");

class RoleService extends RamenServices {
  constructor(base) {
    super(base);
    this.repositories = {};
  }
}

exports.RoleService = RoleService;
