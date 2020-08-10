"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const { RamenModel } = require("@ordentco/ramenbox/src/Model/RamenModel");

class Role extends RamenModel {
  static get properties() {
    return ["slug", "name", "description"];
  }
  permissions() {
    return this.belongsToMany("Adonis/Acl/Permission");
  }

  async getPermissions() {
    const permissions = await this.permissions().fetch();
    return permissions.rows.map(({ slug }) => slug);
  }
}

exports.Role = Role;
