// import { sanitize } from 'indicative/sanitizer'

const { RamenServices } = require('@ordentco/ramenbox/src/Services/RamenServices')
const {
  NotFoundException,
  UnauthorizedException,
} = require('@ordentco/ramenbox/src/Exception')
const { RamenRepository } = require('@ordentco/ramenbox/src/Repository/RamenRepository')
const {
  RamenValidatorGenerator,
} = require('@ordentco/ramenbox/src/Validator/RamenValidatorGenerator')
// const RamenFilter = require('@ordent/ramenbox/src/RamenFilter')
const shortid = require('shortid')
const { requestBody } = require('@ordentco/ramenbox/src/Utilities')

const Sentry = use('Sentry')
// const Mail = use('Mail')
const MailServices = use('Mail/Service')
const Token = use('App/Models/Token')
const User = use('App/Models/User')
const Role = use('App/Models/Role')

class RamenboxAuthServices extends RamenServices {
  constructor() {
    super(User)
    this.mail = new MailServices()
    this.repositories = {
      roles: Role,
    }
  }

  async login({ request }, auth) {
    const value = await this.getValidator().sanitize(requestBody(request))
    await this.getValidator().validate(value, 'login')
    const { email, password } = value
    let data = null
    try {
      data = await auth.withRefreshToken().attempt(email, password)
    } catch (e) {
      throw new UnauthorizedException('Email or Password is Incorrect')
    }
    if (!data) {
      throw new UnauthorizedException('Account Not Found')
    }
    data.users = await this.getRepository()
      .getModel()
      .query()
      .where('email', email)
      .first()
    return this.getResponse().setStatus(200).rawItem(data)
  }

  async refresh({ request }, auth) {
    const value = await this.getValidator().sanitize(requestBody(request))
    await this.getValidator().validate(value, 'refresh')
    const { refresh_token } = value
    const data = await auth.newRefreshToken().generateForRefreshToken(refresh_token)
    return this.getResponse().setStatus(200).rawItem(data)
  }

  async check(auth) {
    let check = null
    try {
      check = await auth.check()
    } catch (error) {
      throw new UnauthorizedException('Token Not Found')
    }
    return this.getResponse().setStatus(200).rawItem(check)
  }

  async register({ request }) {
    let value = await this.getValidator().sanitize(requestBody(request))
    // get validation based on register validation filter on User Model.
    await this.getValidator().validate(value, 'register')
    const data = await this.repository.postItem(value)
    value = await this.fillProperties(value)
    // create profile
    await this.updateProfileOnRegister(data, value)
    // send email for register confirmation
    this.verifyOnRegister(data)
    return this.getResponse()
      .setStatus(200)
      .item(data, 'profiles', this.getRepository().getModel().transformers)
  }

  async updateProfileOnRegister(data = null, value = {}) {
    if (data) {
      const profiles = await data.profiles().fetch()
      if (profiles) {
        const { name, phone } = value
        profiles.name = name
        profiles.phone = phone
        await profiles.save()
      }
    }
  }

  async postConfirmationEmail({ request }) {
    const data = await this.getRepository().getItem(request.params.email)
    if (data.status > 1) {
      return this.getResponse()
        .setMeta({
          status: 400,
          message: 'Account already confirmed',
        })
        .setStatus(400)
        .rawItem({
          email: request.params.email,
          email_confirmation_sent: false,
        })
    }
    this.verifyOnRegister(data)
    return this.getResponse().setStatus(200).rawItem({
      email: request.params.email,
      email_confirmation_sent: true,
    })
  }

  async verifyOnRegister(data = null) {

    if (data) {
      const tokens = await data.tokens().fetch()
      if (tokens !== null && tokens.toJSON().length > 0) {
        data.token = tokens.toJSON().pop()
        this.mail.postConfirmRegistration(data)
      }
    }
  }

  async getSelf(auth) {
    let data = null
    // console.log('check 1')
    try {
      data = await auth.getUser()
    } catch (e) {
      throw new NotFoundException('User or Login Token Not found')
    }
    // console.log(await data.roles().fetch())
    return this.getResponse()
      .setStatus(200)
      .item(
        data,
        'profiles, profiles.counselors',
        this.getRepository().getModel().transformers
      )
  }

  async getStatus({ request }) {
    const data = await this.getRepository()
      // .getModel()
      .getItem(request.params.id)

    // console.log(data)
    data.check = {
      complete_email: data.status > 1,
      complete_profiles: await this.checkProfileCompletion(data),
    }

    return this.getResponse().setStatus(200).rawItem(data)
  }

  async checkProfileCompletion(data) {
    const profiles = (await data.profiles().fetch()).toJSON()
    for (const key in profiles) {
      const element = profiles[key]
      if (!element && !['address', 'images'].includes(key)) {
        return false
      }
    }
    return true
  }

  async getDataFromToken(request) {
    const { token } = request.params
    // console.log(request.params)
    this.setCustomRepositorySingleton('token', new RamenRepository(Token))
    const data = await this.getCustomRepository('token')
      .getModel()
      .query()
      .where('token', token)
      .where('is_revoked', false)
      .first()
    if (data === null) {
      throw new NotFoundException('users token not found')
    }
    return data
  }

  async getConfirmationFromToken({ request }) {
    const data = await this.getDataFromToken(request)
    const user = await data.users().fetch()
    if (user === null) {
      throw new NotFoundException('users not found')
    }
    return this.getResponse()
      .setTransformers(Token.transformers)
      .setStatus(200)
      .item(data, 'users, users.profiles', null)
  }

  updateDifferentProperties(item = {}, items = {}) {
    const result = {}
    for (const iterator of Object.keys(items)) {
      if (items[iterator] && item[iterator] !== items[iterator]) {
        result[iterator] = items[iterator]
      }
    }
    return result
  }

  async updateAuthenticationStatus(user, status = 'registered') {
    if (status === 'registered') {
      user.status = 1
    }
    if (status === 'validated') {
      user.status = 2
    }
    await user.tokens().where('is_revoked', true).delete()
    await user.save()
    await user.reload()
    return user
  }

  async revokeTokenInformation(data) {
    data.is_revoked = true
    await data.save()
    await data.reload()
    return data
  }

  async updateProfileWithDifferentProperties(profile, value) {
    const result = this.updateDifferentProperties(profile, value)
    profile.merge(result)
    await profile.save()
  }

  async postConfirmationFromToken({ request }) {
    const value = await this.getValidator().sanitize(requestBody(request))
    await this.getValidator().validate(value, 'validation')
    let data = await this.getDataFromToken(request)
    let user = await data.users().fetch()
    if (user === null) {
      throw new NotFoundException('users not found or already confirmed')
    }
    // update properties if different
    let profile = await user.profiles().fetch()
    if (profile === null) {
      throw new NotFoundException('profile not found or already confirmed')
    }
    profile = await this.updateProfileWithDifferentProperties(profile, value)
    // update user status
    data = await this.revokeTokenInformation(data)
    user = await this.updateAuthenticationStatus(user, 'validated')
    return this.getResponse()
      .setTransformers(Token.transformers)
      .setStatus(200)
      .item(data, 'users, users.profiles', data.transformers)
  }

  async postAddRoles({ request }) {
    const { id } = request.params
    const user = await this.getRepository().getItem(id)
    // console.log(user)
    const { role_id } = requestBody(request)
    await user.roles().attach([role_id])
    return this.getResponse().setStatus(200).item(user, 'roles', user.transformers)
  }

  async deleteRemoveRoles({ request }) {
    const { id } = request.params
    const user = await this.getRepository().getItem(id)
    // console.log(user)
    const { role_id } = requestBody(request)
    await user.roles().detach([role_id])
    return this.getResponse().setStatus(200).item(user, 'roles', user.transformers)
  }

  async postProfile({ request }) {
    const { id } = request.params
    let value = await this.getValidator().sanitize(requestBody(request))
    // console.log(value)
    await this.getValidator().validate(value, 'put')
    // this.setCustomRepositorySingleton('profile', new RamenRepository(Profile))
    // this.setCustomFilterSingleton('profile', new (RamenValidatorGenerator(Profile))())
    // await this.getCustomFilter('profile').validate(request, 'put')
    const user = await this.getRepository().getItem(id)
    let profile = await user.profiles().first()

    try {
      value = await this.fillProperties(value)
      profile = await this.getCustomRepository('profile').putItem(
        profile.id,
        value,
        true
      )
    } catch (e) {
      Sentry.captureException(e)
    }
    // console.log(profile)
    if (profile.images) {
      profile.images = profile.images.replace(
        'https://storage.cloud.google.com/',
        'https://storage.googleapis.com/'
      )
    }
    try {
      await profile.save()
      await profile.reload()
    } catch (e) {
      Sentry.captureException(e)
    }

    return this.getResponse().setStatus(200).item(user, 'profiles', user.transformers)
  }

  async forgotPassword({ request }) {
    const value = await this.getValidator().sanitize(requestBody(request))
    await this.getValidator().validate(value, 'forgot')
    const { email } = value
    const user = await this.getRepository()
      .getModel()
      .query()
      .where('email', email)
      .first()
    if (user === null) {
      throw new NotFoundException('users not found or already confirmed')
    }
    const token = await Token.create({
      type: 'forgot',
      token: shortid.generate(),
      is_revoked: false,
    })
    await user.tokens().save(token)

    // send email
    if (token !== null) {
      user.token = token
      const result = await this.mail.postConfirmForgot(user)
    }
    return this.getResponse().setStatus(200).rawItem({
      success: true,
      message: 'Please Check your email for confirmation',
    })
  }

  async rememberPassword({ request }) {
    const value = await this.getValidator().sanitize(requestBody(request))
    await this.getValidator().validate(value, 'remember')
    delete value.password_confirmation
    let data = await this.getDataFromToken(request)
    let user = await data.users().fetch()
    if (user === null) {
      throw new NotFoundException('users not found or already changed')
    }
    user = await this.updateProfileWithDifferentProperties(user, value)
    data = await this.revokeTokenInformation(data)
    return this.getResponse().setStatus(200).rawItem({
      success: true,
      message: 'Please Login with the new password',
    })
  }
}

module.exports = RamenboxAuthServices
