'use strict'

/**
 * adonis-acl
 * Copyright(c) 2017 Evgeny Razumov
 * MIT Licensed
 */

const { ServiceProvider } = require('@adonisjs/fold')

class User extends ServiceProvider {
    register() {

        this.app.bind('App/Models/User', () => {
            const model = require("../src/Models/User");
            model._bootIfNotBooted()
            return model
        })

        this.app.bind('App/Models/Profile', () => {
            const model = require("../src/Models/Profile");
            model._bootIfNotBooted()
            return model
        })

        this.app.bind('App/Models/Token', () => {
            const model = require("../src/Models/Token");
            model._bootIfNotBooted()
            return model
        })

        this.app.bind('App/Models/Role', () => {
            const Role = require("../src/Models/Role");
            Role._bootIfNotBooted()
            return Role
        })

        this.app.bind('Adonis/Acl/Role', () => {
            const Role = require("../src/Models/Role");
            Role._bootIfNotBooted()
            return Role
        })

        this.app.bind('Auth/Controller', () => {
            const controller = require('../src/Controllers/Auth')
            return controller
        })

        this.app.bind('App/Services/Auth', () => {
            const service = require("../src/Services/Auth");
            return service
        })
    }

    boot() { }
}

module.exports = User