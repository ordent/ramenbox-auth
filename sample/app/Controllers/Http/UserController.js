"use strict";

const {
  RamenController,
} = require("@ordentco/ramenbox/src/Controller/RamenController");

const AuthService = use("App/Services/Auth");
class UserController extends RamenController {
  constructor() {
    super(new AuthService());
  }
}

module.exports = UserController;
