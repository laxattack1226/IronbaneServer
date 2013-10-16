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

// chat command API
// worldHandler - worldHandler reference
// chatHandler - reference to general chat utils
module.exports = function(worldHandler, chatHandler) {
    var _ = require('underscore'),
        Q = require('q'),
        ItemTemplate = require(APP_ROOT_PATH + '/src/server/entity/itemTemplate');

    return {
        requiresEditor: true,
        action: function(unit, target, params) {
            var deferred = Q.defer(),
                amount = parseInt(params[0], 10);

            ItemTemplate.getAllByType('cash').then(function(templates) {
                if(templates.length === 0) {
                    return deferred.reject('No cash items found on server!');
                }

                if(!this.GiveItem(template, {value: amount})) {
                    deferred.reject('You have no free space!');
                } else {
                    deferred.resolve();
                }
            }, function(err) {
                return deferred.reject('No cash items found on server!');
            });

            return deferred.promise;
        }
    };

};