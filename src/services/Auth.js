"use strict";
// import { sanitize } from 'indicative/sanitizer'

const {
  RamenServices,
} = require("@ordentco/ramenbox/src/Services/RamenServices");
const {
  NotFoundException,
  UnauthorizedException,
} = require("@ordentco/ramenbox/src/Exception");
const {
  RamenRepository,
} = require("@ordentco/ramenbox/src/Repository/RamenRepository");
// const RamenFilter = require('@ordentco/ramenbox/src/RamenFilter')
const shortid = require("shortid");
const { requestBody } = require("@ordentco/ramenbox/src/Utilities");
const { MailService } = require("./Mail");

const { Role } = require("../models/Role");
const { Token } = require("../models/Token");

class RamenAuthService extends RamenServices {
  constructor(userModel) {
    super(userModel);
    this.Role = Role;
    this.Token = Token;
    this.mail = new MailService();

    this.repositories = {
      roles: this.Role,
    };
  }

  async login({ request }, auth) {
    const value = await this.getValidator().sanitize(requestBody(request));
    await this.getValidator().validate(value, "login");
    const { email, password } = value;
    let data = null;
    try {
      data = await auth.withRefreshToken().attempt(email, password);
    } catch (e) {
      throw new UnauthorizedException("Email or Password is Incorrect");
    }
    if (!data) {
      throw new UnauthorizedException("Account Not Found");
    }
    data.users = await this.getRepository()
      .getModel()
      .query()
      .where("email", email)
      .first();
    return this.getResponse().setStatus(200).rawItem(data);
  }

  async refresh({ request }, auth) {
    const value = await this.getValidator().sanitize(requestBody(request));
    await this.getValidator().validate(value, "refresh");
    const { refresh_token } = value;
    const data = await auth
      .newRefreshToken()
      .generateForRefreshToken(refresh_token);
    return this.getResponse().setStatus(200).rawItem(data);
  }

  async revokeToken(auth) {
    const user = auth.current.user;
    const token = auth.getAuthHeader();

    const data = await user
      .tokens()
      .where("token", token)
      .update({ is_revoked: true });

    return this.getResponse().setStatus(200).rawItem(data);
  }

  async check(auth) {
    let check = null;
    try {
      check = await auth.check();
    } catch (error) {
      throw new UnauthorizedException("Token Not Found");
    }
    return this.getResponse().setStatus(200).rawItem(check);
  }

  async postConfirmationEmail({ request }) {
    const data = await this.getRepository().getItem(request.params.email);
    if (data.status > 1) {
      return this.getResponse()
        .setMeta({
          status: 400,
          message: "Account already confirmed",
        })
        .setStatus(400)
        .rawItem({
          email: request.params.email,
          email_confirmation_sent: false,
        });
    }
    this.verifyOnRegister(data);
    return this.getResponse().setStatus(200).rawItem({
      email: request.params.email,
      email_confirmation_sent: true,
    });
  }

  async verifyOnRegister(data = null) {
    if (data) {
      const tokens = await data.tokens().fetch();
      if (tokens !== null && tokens.toJSON().length > 0) {
        data.token = tokens.toJSON().pop();
        this.mail.postConfirmRegistration(data);
      }
    }
  }

  async getSelf(auth) {
    let data = null;
    // console.log('check 1')
    try {
      data = await auth.getUser();
    } catch (e) {
      throw new NotFoundException("User or Login Token Not found");
    }
    // console.log(await data.roles().fetch())
    return this.getResponse()
      .setStatus(200)
      .item(data, "", this.getRepository().getModel().transformers);
  }

  async getDataFromToken(request) {
    const { token } = request.params;
    // console.log(request.params)
    this.setCustomRepositorySingleton("token", new RamenRepository(this.Token));
    const data = await this.getCustomRepository("token")
      .getModel()
      .query()
      .where("token", token)
      .where("is_revoked", false)
      .first();
    if (data === null) {
      throw new NotFoundException("users token not found");
    }
    return data;
  }

  async getConfirmationFromToken({ request }) {
    const data = await this.getDataFromToken(request);
    const user = await data.users().fetch();
    if (user === null) {
      throw new NotFoundException("users not found");
    }
    return this.getResponse()
      .setTransformers(this.Token.transformers)
      .setStatus(200)
      .item(data, "users", null);
  }

  updateDifferentProperties(item = {}, items = {}) {
    const result = {};
    for (const iterator of Object.keys(items)) {
      if (items[iterator] && item[iterator] !== items[iterator]) {
        result[iterator] = items[iterator];
      }
    }
    return result;
  }

  async updateAuthenticationStatus(user, status = "registered") {
    if (status === "registered") {
      user.status = 1;
    }
    if (status === "validated") {
      user.status = 2;
    }
    await user.tokens().where("is_revoked", true).delete();
    await user.save();
    await user.reload();
    return user;
  }

  async revokeTokenInformation(data) {
    data.is_revoked = true;
    await data.save();
    await data.reload();
    return data;
  }

  async postAddRoles({ request }) {
    const { id } = request.params;
    const user = await this.getRepository().getItem(id);
    // console.log(user)
    const { role_id } = requestBody(request);
    await user.roles().attach([role_id]);
    return this.getResponse()
      .setStatus(200)
      .item(user, "roles", user.transformers);
  }

  async deleteRemoveRoles({ request }) {
    const { id } = request.params;
    const user = await this.getRepository().getItem(id);
    // console.log(user)
    const { role_id } = requestBody(request);
    await user.roles().detach([role_id]);
    return this.getResponse()
      .setStatus(200)
      .item(user, "roles", user.transformers);
  }

  async forgotPassword({ request }) {
    const value = await this.getValidator().sanitize(requestBody(request));
    await this.getValidator().validate(value, "forgot");
    const { email } = value;
    const user = await this.getRepository()
      .getModel()
      .query()
      .where("email", email)
      .first();
    if (user === null) {
      throw new NotFoundException("users not found or already confirmed");
    }
    const token = await this.Token.create({
      type: "forgot",
      token: shortid.generate(),
      is_revoked: false,
    });
    await user.tokens().save(token);

    // send email
    if (token !== null) {
      user.token = token;
    }
    return this.getResponse().setStatus(200).rawItem({
      success: true,
      message: "Please Check your email for confirmation",
    });
  }

  async rememberPassword({ request }) {
    const value = await this.getValidator().sanitize(requestBody(request));
    await this.getValidator().validate(value, "remember");
    delete value.password_confirmation;
    let data = await this.getDataFromToken(request);
    let user = await data.users().fetch();
    if (user === null) {
      throw new NotFoundException("users not found or already changed");
    }
    user = await this.updateProfileWithDifferentProperties(user, value);
    data = await this.revokeTokenInformation(data);
    return this.getResponse().setStatus(200).rawItem({
      success: true,
      message: "Please Login with the new password",
    });
  }
}

exports.RamenAuthService = RamenAuthService;
