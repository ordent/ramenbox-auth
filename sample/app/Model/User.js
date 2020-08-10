const {
  RamenAuthUserModel,
} = require("@ordentco/ramenbox-auth/src/models/User");

class User extends RamenAuthUserModel {
  static boot() {
    super.boot();
  }
}

module.exports = User;
