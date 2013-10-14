/*
    This file is part of Ironbane MMO.

    Ironbane MMO is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Ironbane MMO is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Ironbane MMO.  If not, see <http://www.gnu.org/licenses/>.
*/

// requires ItemTemplate service because all Item instances must be based off a template
module.exports = function(db, ItemTemplate) {
    var _ = require('underscore'),
        q = require('q'),
        Class = require('../../common/class');

    var updateSchema = ['template', 'attr1', 'owner', 'equipped', 'slot', 'value', 'data'];

    // instance of an item template
    var Item = Class.extend({
        equipped: 0,
        slot: 0,
        attr1: 0,
        data: {},
        value: 0,
        init: function(template, config) {
            if(!template) {
                throw "must init using a template!";
            }

            // reference to the entire template object
            this.$template = template;
            // just the ID
            this.template = template.id;

            this.attr1 = template.attr1;
            this.value = template.basevalue || 0;

            // copy for faster searching
            this.type = template.type;
            this.subtype = template.subtype;

            // update any additional properties
            if(config) {
                _.extend(this, config);
            }

            // attempt to convert data fromJSON (if provided by DB for example)
            if(_.isString(this.data)) {
                try {
                    this.data = JSON.parse(this.data);
                } catch(e) {
                    // invalid JSON, in this case we can prolly just ignore
                }
            }
        },
        // these getters setup so that the item instance could in the future have values
        // not on the template, but in the data JSON
        getType: function() {
            return this.$template.type;
        },
        getSubType: function() {
            return this.$template.subtype;
        },
        getImage: function() {
            return this.$template.image;
        },
        getBaseValue: function() {
            return this.$template.basevalue;
        },
        $save: function() {
            var self = this,
                deferred = q.defer();

            // because it's possible that this item has more properties than the schema, we must specify
            var persist = _.pick(self, updateSchema);
            // data has to be stringified on the way in
            persist.data = JSON.stringify(persist.data);

            if(self.id) {
                // update
                db.query('update ib_items set ? where id=' + self.id, persist, function(err, result) {
                    if(err) {
                        return deferred.reject(err);
                    }

                    deferred.resolve(self);
                });
            } else {
                // insert
                db.query('insert into ib_items set ?', persist, function(err, result) {
                    if(err) {
                        return deferred.reject(err);
                    }

                    self.id = result.insertId;

                    deferred.resolve(self);
                });
            }

            return deferred.promise;
        }
    });

    Item.get = function(itemId) {
        var deferred = q.defer();

        db.query('select * from ib_items where id=?', [itemId], function(err, results) {
            if (err) {
                return deferred.reject('error loading item data' + err);
            }

            ItemTemplate.get(results[0].template).then(function(template) {
                deferred.resolve(new Item(template, results[0]));
            });
        });

        return deferred.promise;
    };

    Item.getAllForOwner = function(ownerId) {
        var deferred = q.defer();

        db.query('select * from ib_items where owner=?', [ownerId], function(err, results) {
            if (err) {
                return deferred.reject('error loading item data' + err);
            }

            ItemTemplate.get(results[0].template).then(function(template) {
                deferred.resolve(new Item(template, results[0]));
            });
        });

        return deferred.promise;
    };

    Item.deleteAllForOwner = function(ownerId) {
        var deferred = q.defer();

        db.query('delete from ib_items where owner=?', [ownerId], function(err, result) {
            if(err) {
                return deferred.reject(err);
            }

            deferred.resolve('ok');
        });

        return deferred.promise;
    };

    Item.getAllByTemplate = function(templateId) {

    };

    return Item;
};
