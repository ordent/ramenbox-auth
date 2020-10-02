'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
// const Model = use('Model')
const { RamenModel } = require('@ordentco/ramenbox/src/Model/RamenModel')

class Profile extends RamenModel {
    boot() {
        this.addHook('beforeSave', async (profileInstance) => {
            if (profileInstance.dirty.phone) {
                profileInstance.phone = await profileInstance.phone.replace(
                    /^0+/,
                    '+62'
                )
            }
        })
    }

    static get properties() {
        return [
            'id',
            'name',
            'birthdate',
            'birthplace',
            'user_id',
            'phone',
            'images',
            'address',
            // 'additionals'
        ]
    }

    users() {
        return this.belongsTo('App/Models/User', 'user_id', 'id')
    }

    static get relations() {
        return [
            { users: 'available' }
        ]
    }

    static get files() {
        return { images: 'jpg' }
    }
}

module.exports = Profile
