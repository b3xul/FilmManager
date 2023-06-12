'use strict';

var utils = require('../utils/writer.js');
var Films = require('../service/FilmsService');

module.exports.getPublicFilms = function getPublicFilms(req, res, next) {
    Films.getPublicFilms(req.query.pageNo)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            if (response == 404) {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'No public film exist.' }], }, 404);
            }
            else {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
            }
        });
};

module.exports.getPrivateFilms = function getPrivateFilms(req, res, next) {
    Films.getPrivateFilms(req.query.pageNo, req.user.id)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            if (response == 404) {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'No private film exist.' }], }, 404);
            }
            else {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
            }
        });
};

module.exports.getInvitedFilms = function getInvitedFilms(req, res, next) {
    Films.getInvitedFilms(req.query.invitationStatus, req.query.pageNo, req.user.id)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            if (response == 404) {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'No films found' }], }, 404);
            } else {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
            }
        });
};

module.exports.createFilm = function createFilm(req, res, next) {
    var film = req.body;
    var owner = req.user.id;
    if (owner != film.owner) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': "You can only create films with the logged user as owner." }], }, 400);
    }
    else {
        Films.createFilm(film, owner)
            .then(function (response) {
                utils.writeJson(res, response, 201);
            })
            .catch(function (response) {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
            });
    }
};

module.exports.getSinglePrivateFilm = function getSinglePrivateFilm(req, res, next) {
    Films.getSinglePrivateFilm(req.params.filmId, req.user.id)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            if (response == 403) {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film.' }], }, 403);
            }
            else if (response == 404) {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film does not exist.' }], }, 404);
            }
            else {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
            }
        });
};

module.exports.updateSinglePrivateFilm = function updateSinglePrivateFilm(req, res, next) {
    Films.updateSinglePrivateFilm(req.body, req.params.filmId, req.user.id)
        .then(function (response) {
            utils.writeJson(res, response, 204);
        })
        .catch(function (response) {
            if (response == 403) {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film' }], }, 403);
            }
            else if (response == 404) {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film does not exist.' }], }, 404);
            }
            else if (response == 409) {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The visibility of the film cannot be changed.' }], }, 409);
            }
            else {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
            }
        });
};

module.exports.deleteSinglePrivateFilm = function deleteSinglePrivateFilm(req, res, next) {
    Films.deleteSinglePrivateFilm(req.params.filmId, req.user.id)
        .then(function (response) {
            utils.writeJson(res, response, 204);
        })
        .catch(function (response) {
            if (response == 403) {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film' }], }, 403);
            }
            else if (response == 404) {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film does not exist.' }], }, 404);
            }
            else if (response == 409) {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The visibility of the film cannot be changed.' }], }, 409);
            }
            else {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
            }
        });
};



module.exports.getSinglePublicFilm = function getSinglePublicFilm(req, res, next) {
    Films.getSinglePublicFilm(req.params.filmId)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (response) {
            if (response == 404) {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film does not exist.' }], }, 404);
            }
            else {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
            }
        });
};

module.exports.updateSinglePublicFilm = function updateSinglePublicFilm(req, res, next) {
    Films.updateSinglePublicFilm(req.body, req.params.filmId, req.user.id)
        .then(function (response) {
            utils.writeJson(res, response, 204);
        })
        .catch(function (response) {
            if (response == 403) {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film' }], }, 403);
            }
            else if (response == 404) {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film does not exist.' }], }, 404);
            }
            else {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
            }
        });
};

module.exports.deleteSinglePublicFilm = function deleteSinglePublicFilm(req, res, next) {
    Films.deleteSinglePublicFilm(req.params.filmId, req.user.id)
        .then(function (response) {
            utils.writeJson(res, response, 204);
        })
        .catch(function (response) {
            if (response == 403) {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film' }], }, 403);
            }
            else if (response == 404) {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film does not exist.' }], }, 404);
            }
            else {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
            }
        });
};