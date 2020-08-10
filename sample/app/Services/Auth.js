const {
  RamenAuthService,
} = require("@ordentco/ramenbox-auth/src/services/Auth");

const User = use("App/Models/User");

class AuthService extends RamenAuthService {
  constructor() {
    // super(userModel)
    super(User);
  }
}

module.exports = AuthService;
