"use strict";

const {
  RamenBoxAuthController,
} = require("../../src/Controllers/Auth");

class UserController extends RamenBoxAuthController {
  constructor() {
    super();
  }
}

module.exports = UserController;
