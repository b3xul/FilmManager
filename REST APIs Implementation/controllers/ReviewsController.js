'use strict';

var utils = require('../utils/writer.js');
var Reviews = require('../service/ReviewsService');

module.exports.getFilmReviews = function getFilmReviews(req, res, next) {

  Reviews.getFilmReviews(req.params.filmId, req.query.invitationStatus, req.query.pageNo, req.user)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      if (response == 404) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'No film or no reviews for this film exist' }], }, 404);
      }
      else {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
      }
    });
};


module.exports.getSingleReview = function getSingleReview(req, res, next) {

  Reviews.getSingleReview(req.params.filmId, req.params.reviewerId, req.user)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      if (response == 404) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review does not exist.' }], }, 404);
      }
      else {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
      }
    });
};


module.exports.deleteSingleReview = function deleteSingleReview(req, res, next) {

  Reviews.deleteSingleReview(req.params.filmId, req.params.reviewerId, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response, 204);
    })
    .catch(function (response) {
      if (response == "403A") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film' }], }, 403);
      }
      else if (response == "403B") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review has been already ACCEPTED, so the invitation cannot be deleted anymore.' }], }, 403);
      }
      else if (response == 404) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review does not exist.' }], }, 404);
      }
      else {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
      }
    });
};

module.exports.issueFilmReview = function issueFilmReview(req, res, next) {
  var differentFilm = false;
  for (var i = 0; i < req.body.length; i++) {
    if (req.params.filmId != req.body[i].filmId) {
      differentFilm = true;
      break;
    }
  }
  if (differentFilm) {
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The filmId field of the review object is different from the filmdId path parameter.' }], }, 409);
  }
  else {
    Reviews.issueFilmReview(req.body, req.user.id)
      .then(function (response) {
        utils.writeJson(res, response, 207);
      })
      .catch(function (response) {
        if (response == 403) {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film' }], }, 403);
        }
        else if (response == 404) {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The public film does not exist.' }], }, 404);
        }
        else {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
        }
      });
  }
};

module.exports.updateSingleReview = function updateSingleReview(req, res, next) {

  if (req.params.reviewerId != req.user.id) {
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The reviewerId is not equal the id of the requesting user.' }], }, 400);
  }
  else if (req.body.filmId != req.params.filmId || req.body.reviewerId != req.params.reviewerId) {
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'Conflict between url and body parameters' }], }, 409);
  }
  else if (req.body.completed == undefined) {
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The completed property is absent.' }], }, 400);
  }
  else if (req.body.completed == false) {
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The completed property is false, but it should be set to true.' }], }, 400);
  }
  else {
    Reviews.updateSingleReview(req.body, req.params.filmId, req.params.reviewerId)
      .then(function (response) {
        utils.writeJson(res, response, 204);
      })
      .catch(function (response) {
        if (response == 403) {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not a reviewer of the film' }], }, 403);
        }
        else if (response == "403B") {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review cannot be modified since it is not in ACCEPTED state' }], }, 403);
        }
        else if (response == 404) {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review does not exist.' }], }, 404);
        }
        else {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
        }
      });
  }
};

/* -------------------------------------------------------------------------- */
/*                               New endpoints;                               */
/* -------------------------------------------------------------------------- */

module.exports.getSingleReviewInvitationStatus = function getSingleReviewInvitationStatus(req, res, next) {
  Reviews.getSingleReviewInvitationStatus(req.params.filmId, req.params.reviewerId, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      if (response == 403) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the film owner or the reviewer.' }], }, 403);
      }
      else if (response == 404) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review does not exist.' }], }, 404);
      }
      else {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
      }
    });
};

module.exports.getReviewsInvitationStatus = function getReviewsInvitationStatus(req, res, next) {
  Reviews.getReviewsInvitationStatus(req.params.filmId, req.query.invitationStatus, req.query.pageNo, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      if (response == 403) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the film owner.' }], }, 403);
      }
      else if (response == 404) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'No reviews found.' }], }, 404);
      }
      else {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
      }
    });
};


module.exports.updateSingleReviewInvitationStatus = function updateSingleReviewInvitationStatus(req, res, next) {
  if (req.body.filmId != req.params.filmId || req.body.reviewerId != req.params.reviewerId) {
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'Conflict between url and body parameters' }], }, 409);
  }
  else {
    Reviews.updateSingleReviewInvitationStatus(req.body, req.params.filmId, req.params.reviewerId, req.user.id)
      .then(function (response) {
        utils.writeJson(res, response, 204);
      })
      .catch(function (response) {
        if (response == 403) {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not a reviewer of the film' }], }, 403);
        }
        else if (response == 404) {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review does not exist.' }], }, 404);
        }
        else if (response == 409) {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'Conflict (attempt to change from ACCEPTED or REFUSED state, or to unallowed state)' }], }, 409);
        }
        else {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
        }
      });
  }
};
