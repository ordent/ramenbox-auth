'use strict'

const moment = require('moment')

const {
  RamenServices
} = require('@ordentco/ramenbox/src/Services/RamenServices')

class Role extends RamenServices {
  constructor(base) {
    super(base)
    this.repositories = {}
  }
}

module.exports = Role
