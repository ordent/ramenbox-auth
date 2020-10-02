"use strict";

const {
  RamenBoxAuthController,
} = require("../../src/Controllers/Auth");

const AuthService = use("App/Services/Auth");

class UserController extends RamenBoxAuthController {
  constructor() {
    super(new AuthService());
  }
}

module.exports = UserController;
