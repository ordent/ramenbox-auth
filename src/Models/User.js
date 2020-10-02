'use strict'

const shortid = require('shortid')
const { RamenModel } = require('@ordentco/ramenbox/src/Model/RamenModel')
const {
  RamenTransformerGenerator,
} = require('@ordentco/ramenbox/src/Transformer/RamenTransformerGenerator')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
// const Model = use('Model')

/** @type {import('@adonisjs/framework/src/Hash')} */
const Hash = use('Hash')
const Profile = use('App/Models/Profile')
const Token = use('App/Models/Token')
const Role = use('App/Models/Role')

class User extends RamenModel {
  static boot() {
    super.boot()
    this.addTrait('@provider:Lucid/Slugify', {
      fields: { username: 'email' },
      strategy: async (field, value) => {
        return await `${value.replace(/at/g, '')}-${shortid.generate()}`
      },
    })

    this.addHook('beforeSave', async (userInstance) => {
      if (userInstance.dirty.password) {
        userInstance.password = await Hash.make(userInstance.password)
      }
    })
    
    this.addHook('afterCreate', async (userInstance) => {
      const token = await Token.create({
        type: 'verification',
        token: shortid.generate(),
        is_revoked: false,
      })
      await userInstance.tokens().save(token)
      if ((await userInstance.profiles().fetch()) === null) {
        await Profile.create({ user_id: userInstance.id })
      }
      if (
        (await userInstance.getRoles()) != null &&
        (await userInstance.getRoles()).length === 0
      ) {
        const role = await Role.query().where('slug', 'user').first()
        await userInstance.roles().attach([role.id])
      }
    })
  }

  /**
   * A relationship on tokens is required for auth to
   * work. Since features like `refreshTokens` or
   * `rememberToken` will be saved inside the
   * tokens table.
   *
   * @method tokens
   *
   * @return {Object}
   */
  tokens() {
    return this.hasMany('App/Models/Token')
  }

  profiles() {
    return this.hasOne('App/Models/Profile', 'id', 'user_id')
  }

  static get properties() {
    return ['id', 'email', 'password', 'username', 'status']
  }

  static get traits() {
    return ['@provider:Adonis/Acl/HasRole', '@provider:Adonis/Acl/HasPermission']
  }

  static get rules() {
    return {
      register: {
        email: 'required|unique:users',
        password: 'required|min:6|confirmed',
        name: 'required',
        phone: 'required|unique:profiles',
      },
      valdidation: {},
      refresh: { refresh_token: 'required' },
      login: {
        email: 'required',
        password: 'required',
      },
      forgot: { email: 'required' },
      remember: { password: 'required|confirmed' },
      post: {
        email: 'required|unique:users',
        password: 'required|min:6|confirmed'
      },
    }
  }

  static get files() {
    return []
  }

  static get hidden() {
    return ['password']
  }

  static get sanitize() {
    return { post: { email: 'normalize_email' } }
  }

  static get relations() {
    return [
      { tokens: 'available' },
      { profiles: 'default' },
      { roles: 'default' }
    ]
  }

  static get slug() {
    return 'email'
  }

  static get transformers() {
    // console.log('tiems', RamenTransformerGenerator(this))
    return RamenTransformerGenerator(this)
  }

  static get traits() {
    return ['@provider:Adonis/Acl/HasRole', '@provider:Adonis/Acl/HasPermission']
  }
}

module.exports = User
