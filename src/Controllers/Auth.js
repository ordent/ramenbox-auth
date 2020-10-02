'use strict'

const { RamenController } = require('@ordentco/ramenbox/src/Controller/RamenController')

const User = use('App/Models/User')
const AuthService = use('App/Services/Auth')
class RamenboxAuthController extends RamenController {
  constructor() {
    super(new AuthService(User))
  }

  async login({ request, response, transform, auth }) {
    this.getServices().getResponse().setResponse(response)
    this.getServices().getResponse().setManager(transform)
    const data = await this.getServices().login({ request }, auth)
    return data
  }

  async refresh({ request, response, transform, auth }) {
    this.getServices().getResponse().setResponse(response)
    this.getServices().getResponse().setManager(transform)
    const data = await this.getServices().refresh({ request }, auth)
    return data
  }

  async register({ request, response, transform }) {
    this.getServices().getResponse().setResponse(response)
    this.getServices().getResponse().setManager(transform)
    const data = await this.getServices().register({ request })
    return data
  }

  async getConfirmationFromToken({ request, response, transform }) {
    this.getServices().getResponse().setResponse(response)
    this.getServices().getResponse().setManager(transform)
    const data = await this.getServices().getConfirmationFromToken({
      request,
    })
    return data
  }

  async postConfirmationFromToken({ request, response, transform, auth }) {
    this.getServices().getResponse().setResponse(response)
    this.getServices().getResponse().setManager(transform)

    const data = await this.getServices().postConfirmationFromToken({ request }, auth)
    return data
  }

  async user({ response, transform, auth }) {
    let data = null
    this.getServices().getResponse().setResponse(response)
    this.getServices().getResponse().setManager(transform)
    data = await this.getServices().getSelf(auth)
    return data
  }

  async postProfile({ request, response, transform }) {
    this.getServices().getResponse().setResponse(response)
    this.getServices().getResponse().setManager(transform)
    const data = await this.getServices().postProfile({ request })
    return data
  }

  async postForgot({ request, response, transform }) {
    this.getServices().getResponse().setResponse(response)
    this.getServices().getResponse().setManager(transform)
    const data = await this.getServices().forgotPassword({ request })
    return data
  }

  async postRemember({ request, response, transform }) {
    this.getServices().getResponse().setResponse(response)
    this.getServices().getResponse().setManager(transform)
    const data = await this.getServices().rememberPassword({ request })
    return data
  }

  async hello({ request, response }) {
    const name = request.input('name', 'Guess')
    response.send({ message: `Hello ${name}` })
  }

  async getStatus({ request, response, transform }) {
    this.getServices().getResponse().setResponse(response)
    this.getServices().getResponse().setManager(transform)
    const data = await this.getServices().getStatus({ request })
    return data
  }

  async postConfirmationEmail({ request, response, transform }) {
    this.getServices().getResponse().setResponse(response)
    this.getServices().getResponse().setManager(transform)
    const data = await this.getServices().postConfirmationEmail({ request })
    return data
  }

  async postAddRoles({ request, response, transform }) {
    this.getServices().getResponse().setResponse(response)
    this.getServices().getResponse().setManager(transform)
    const data = await this.getServices().postAddRoles({ request })
    return data
  }

  async deleteRemoveRoles({ request, response, transform }) {
    this.getServices().getResponse().setResponse(response)
    this.getServices().getResponse().setManager(transform)
    const data = await this.getServices().deleteRemoveRoles({ request })
    return data
  }
  
  getAllFuncs(toCheck) {
    var props = [];
    var obj = toCheck;
    do {
        props = props.concat(Object.getOwnPropertyNames(obj));
    } while (obj = Object.getPrototypeOf(obj));

    return props.sort().filter(function(e, i, arr) { 
       if (e!=arr[i+1] && typeof toCheck[e] == 'function') return true;
    });
}
}

module.exports = RamenboxAuthController
