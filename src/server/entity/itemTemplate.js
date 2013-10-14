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
var Class = require('../../common/class');

module.exports = function(db) {
    var Q = require('q'),
        _ = require('underscore'),
        TinyCache = require('tinycache'),
        log = require('util').log;

    // valid fields to update in DB
    var updateSchema = ['name', 'image', 'type', 'subtype', 'attr1', 'delay', 'particle', 'basevalue'];

    // in memory cache
    var cache = new TinyCache();

    var ItemTemplate = Class.extend({
        init: function(json) {
            _.extend(this, json || {});

            // convert baseValue to camelcase from DB
            this.baseValue = this.basevalue;
        },
        $save: function() {
            var deferred = Q.defer(),
                self = this;

            var persist = _.pick(self, updateSchema);

            if(self.id) {
                // update
                db.query('update ib_item_templates set ? where id=' + self.id, persist, function(err, result) {
                    if(err) {
                        return deferred.reject(err);
                    }

                    cache.put(self.id, self);
                    deferred.resolve(self);
                });
            } else {
                // insert
                db.query('insert into ib_item_templates set ?', persist, function(err, result) {
                    if(err) {
                        return deferred.reject(err);
                    }

                    self.id = result.insertId;
                    cache.put(self.id, self);
                    deferred.resolve(self);
                });
            }

            return deferred.promise;
        }
    });

    // will get cached, todo: param to force no cache?
    ItemTemplate.getAll = function() {
        var deferred = Q.defer();

        // check cache
        if(_.keys(cache.cache).length === 0) {
            //log("getting templates");
            db.query('select * from ib_item_templates', [], function(err, results) {
                if (err) {
                    deferred.reject('error loading item template data' + err);
                    return;
                }
                var templates = [];
                _.each(results, function(row) {
                    templates.push(new ItemTemplate(row));
                });

                deferred.resolve(templates);
            });
        } else {
            var templates = _.map(_.keys(cache.cache), function(key) {
                return cache.get(key);
            });
            deferred.resolve(templates);
        }

        return deferred.promise;
    };


    ItemTemplate.get = function(templateId) {
        var deferred = Q.defer();

        if(cache.get(templateId) !== null) {
            deferred.resolve(cache.get(templateId));
        } else {
            //log("getting template " + templateId);
            db.query('select * from ib_item_templates where id = ?', [templateId], function(err, results) {
                if (err) {
                    deferred.reject('error loading item template data' + err);
                    return;
                }

                var template = new ItemTemplate(results[0]);

                // cache result
                cache.put(templateId, template);

                deferred.resolve(template);
            });
        }

        return deferred.promise;
    };

    return ItemTemplate;
};