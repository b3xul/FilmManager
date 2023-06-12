'use strict';

const Reviews = require('../components/review');
const db = require('../components/db');
var constants = require('../utils/constants.js');

/**
 * Retrieve the list of all the reviews that have been issued/completed for a film, possibly filtered by the invitation Status if the user is the film owner
 * All the reviews that have been issued/completed for the film with ID filmId are retrieved. If the requesting user is the owner of the film, he also sees the reviews invitationStatus, otherwise it is not shown. A pagination mechanism is implemented to limit the size of messages. This operation does not require authentication.
 *
 * filmId Long ID of the film whose reviews must be retrieved
 * invitationStatus String The invitation Status used to filter the reviews (if absent, all reviews are considered). This query parameter only has effect for the film owner. (optional)
 * pageNo Integer ID of the requested page (if absent, the first page is returned)' (optional)
 * returns inline_response_200_1
 **/
exports.getFilmReviews = function (filmId, invitationStatusFilter, pageNo, user) {
    return new Promise((resolve, reject) => {

        let isOwner = false;


        let commonCode = () => {
            var sql_params = [filmId];

            var sql_count = " SELECT count(*) total_rows FROM reviews l WHERE l.filmId = ? "; //1


            if (isOwner && invitationStatusFilter) {
                sql_count = sql_count + " AND l.invitationStatus = ? "; //2
                sql_params.push(invitationStatusFilter);
            }

            var sql2 = "SELECT f.owner, r.filmId, r.reviewerId, r.completed, r.reviewDate, r.rating, r.review, r.invitationStatus, c.total_rows FROM reviews r, (" + sql_count + ") c, films f WHERE r.filmId=f.id AND r.filmId = ? "; //3
            sql_params.push(filmId);
            if (isOwner && invitationStatusFilter) {
                sql2 = sql2 + " AND r.invitationStatus = ? "; //4
                sql_params.push(invitationStatusFilter);
            }

            if (!pageNo || pageNo <= 0) {
                pageNo = 1;
            }
            pageNo = Number(pageNo);
            const [offset, row_count] = getPagination(pageNo);

            sql2 = sql2 + " LIMIT ?, ? ";
            sql_params.push(offset);
            sql_params.push(row_count);



            db.all(sql2, sql_params, (err, rows) => {
                if (err) {

                    reject(err);
                } else if (rows.length === 0)
                    reject(404);
                else {
                    let reviews;
                    if (isOwner) {
                        reviews = rows.map((row) => createReviewFull(row));
                    }
                    else {
                        reviews = rows.map((row) => createReviewPublic(row));
                    }
                    const totalReviews = rows[0].total_rows;
                    var lastPage = Math.ceil(totalReviews / constants.ROW_COUNT);

                    var response = {
                        currentPage: pageNo,
                        totalPages: lastPage,
                        totalItems: totalReviews
                    };
                    response["reviews"] = (pageNo <= lastPage) ? reviews : [];

                    if (pageNo < lastPage) {
                        var next = "/api/films/public/3/reviews?";
                        if (invitationStatusFilter) {
                            next = next + "invitationStatus=" + invitationStatusFilter + "&";
                        }
                        next = next + "pageNo=" + (pageNo + 1);
                        response["next"] = next;
                    }
                    resolve(response);
                }
            });
        };

        if (user) {
            var sql = "SELECT owner FROM films WHERE id = ?";
            db.all(sql, [filmId], (err, rows) => {


                if (err) {
                    reject(err);
                } else if (rows.length === 0) {
                    reject(404);
                }
                else {


                    if (user.id === rows[0].owner) {
                        isOwner = true;
                    }
                    commonCode();
                }
            });
        }
        else {
            commonCode();
        }
    });
};

/**
 * Retrieve a review that has been issued/completed for a film
 * The review of the film with ID filmID issued to the user with ID reviewerId is retrieved. This operation does not require authentication. If it is called by the authenticated owner or reviewer, it also returns the invitationStatus of the review.
 *
 * filmId Long ID of the film whose reviews must be retrieved
 * reviewerId Long ID of the user to whom the review has been issued
 * returns inline_response_200_3
 **/
exports.getSingleReview = function (filmId, reviewerId, user) {
    return new Promise((resolve, reject) => {

        const sql = "SELECT films.owner, r.filmId, r.reviewerId, r.completed, r.reviewDate, r.rating, r.review, r.invitationStatus FROM reviews r,films WHERE r.filmId=films.id AND filmId = ? AND reviewerId = ?";

        db.all(sql, [filmId, reviewerId], (err, rows) => {
            if (err)
                reject(err);
            else if (rows.length === 0)
                reject(404);
            else {
                var review;
                if (user && (user.id == reviewerId || user.id == rows[0].owner)) {
                    review = createReviewFull(rows[0]);
                }
                else {
                    review = createReviewPublic(rows[0]);
                }
                resolve(review);
            }
        });
    });
};


/**
 * Delete a review invitation
 * The review of the film with ID filmId and issued to the user with ID reviewerId is deleted. This operation can only be performed by the owner, and only if the review has not yet been completed by the reviewer.
 *
 * filmId Long ID of the film whose review invitation must be deleted
 * reviewerId Long ID of the user to whom the review has been issued
 * no response value expected for this operation
 **/
exports.deleteSingleReview = function (filmId, reviewerId, owner) {
    return new Promise((resolve, reject) => {
        const sql1 = "SELECT f.owner, r.invitationStatus FROM films f, reviews r WHERE f.id = r.filmId AND f.id = ? AND r.reviewerId = ?";
        db.all(sql1, [filmId, reviewerId], (err, rows) => {
            if (err)
                reject(err);
            else if (rows.length === 0)
                reject(404);
            else if (owner != rows[0].owner) {
                reject("403A");
            }
            else if (rows[0].invitationStatus == "ACCEPTED") {
                reject("403B");
            }
            else {
                const sql2 = 'DELETE FROM reviews WHERE filmId = ? AND reviewerId = ?';
                db.run(sql2, [filmId, reviewerId], (err) => {
                    if (err)
                        reject(err);
                    else
                        resolve(null);
                });
            }
        });
    });

};



/**
 * Issue film review to some users
 * The film with ID filmId is assigned to one or more users for review and the corresponding reviews are created. The users are specified in the review representations in the request body. This operation can only be performed by the owner.
 *
 * body List only the necessary parts of the new film reviews, including the users to whom they are issued
 * filmId Long ID of the film
 * returns List
 **/
exports.issueFilmReview = function (invitations, userId) {
    return new Promise((resolve, reject) => {
        const sql1 = "SELECT owner, private FROM films WHERE id = ?";
        db.all(sql1, [invitations[0].filmId], async function (err, rows) {
            if (err) {
                reject(err);
            }
            else if (rows.length === 0) {
                reject(404);
            }
            else if (userId != rows[0].owner) {
                reject(403);
            }
            else if (rows[0].private == 1) {
                reject(404);
            }
            else {
                const insert_query = 'INSERT INTO reviews(filmId, reviewerId, completed) VALUES(?,?,0)';
                var finalResult = [];
                for (var i = 0; i < invitations.length; i++) {
                    var singleResult;
                    try {
                        singleResult = await issueSingleReview(insert_query, invitations[i].filmId, invitations[i].reviewerId, userId);
                        finalResult[i] = singleResult;

                    } catch (error) {
                        finalResult[i] = error;

                    }


                }
                resolve(finalResult);
            }

        });
    });
};

const issueSingleReview = function (insert_query, filmId, reviewerId, userId) {
    return new Promise((resolve, reject) => {

        let insertReview = () => {
            db.run(insert_query, [filmId, reviewerId], function (err) {
                if (err) {

                    reject({ "statusCode": 500, "errors": [{ 'param': 'Server', 'msg': err }] });
                } else {
                    var createdReview = createReviewFull({
                        "filmId": filmId,
                        "reviewerId": reviewerId,
                        "completed": false
                    });

                    resolve({ "statusCode": 201, "content": createdReview });
                }
            });
        };

        exports.getSingleReviewInvitationStatus(filmId, reviewerId, userId)
            .then(function (response) {

                // If review already exists, but is in REFUSED state, we can just update its status to PENDING
                if (response.invitationStatus === "REFUSED") {
                    var sql2 = 'UPDATE reviews SET invitationStatus = "PENDING" WHERE filmId = ? AND reviewerId = ?';
                    var sql_params = [filmId, reviewerId];
                    db.run(sql2, sql_params, function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            var createdReview = createReviewFull({
                                "filmId": filmId,
                                "reviewerId": reviewerId,
                                "completed": false
                            });

                            resolve({ "statusCode": 201, "content": createdReview });
                        }
                    });
                }
                else {
                    reject({ "statusCode": 409, "errors": [{ 'param': 'Server', 'msg': 'A review in PENDING or ACCEPTED state already exists for this film' }] });
                }
            })
            .catch(function (response) {

                if (response == 403) {
                    reject({ "statusCode": 403, "errors": [{ 'param': 'Server', 'msg': 'The user is not the film owner or the reviewer.' }] });
                }
                else if (response == 404) {
                    // If review does not exist yet, we can create it
                    insertReview();
                }
                else {
                    reject({ "statusCode": 500, "errors": [{ 'param': 'Server', 'msg': response }] });
                }
            });
    });
};

/**
 * Complete a review
 * The review of the film with ID filmId and issued to the user with ID reviewerId is completed. This operation only allows setting the \"completed\" property to the \"true\" value, and changing the values of the \"reviewDate\", \"rating\", and \"review\" properties. This operation can be performed only by the invited reviewer.
 *
 * body Review_public The properties of the Review object that must be updated (optional)
 * filmId Long ID of the film whose review must be completed
 * reviewerId Long ID of the user to whom the review has been issued
 * no response value expected for this operation
 **/
exports.updateSingleReview = function (review, filmId, reviewerId) {
    return new Promise((resolve, reject) => {

        const sql1 = "SELECT * FROM reviews WHERE filmId = ? AND reviewerId = ?";
        db.all(sql1, [filmId, reviewerId], (err, rows) => {
            if (err)
                reject(err);
            else if (rows.length === 0)
                reject(404);
            else if (reviewerId != rows[0].reviewerId) {
                reject(403);
            }
            else if (rows[0].invitationStatus != "ACCEPTED") {
                reject("403B");
            }
            else {
                var sql2 = 'UPDATE reviews SET completed = ?';
                var parameters = [review.completed];
                if (review.reviewDate != undefined) {
                    sql2 = sql2.concat(', reviewDate = ?');
                    parameters.push(review.reviewDate);
                }
                if (review.rating != undefined) {
                    sql2 = sql2.concat(', rating = ?');
                    parameters.push(review.rating);
                }
                if (review.review != undefined) {
                    sql2 = sql2.concat(', review = ?');
                    parameters.push(review.review);
                }
                sql2 = sql2.concat(' WHERE filmId = ? AND reviewerId = ?');
                parameters.push(filmId);
                parameters.push(reviewerId);

                db.run(sql2, parameters, function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(null);
                    }
                });
            }
        });
    });
};


/* -------------------------------------------------------------------------- */
/*                               New endpoints;                               */
/* -------------------------------------------------------------------------- */

/**
 * Retrieve the invitationStatus for a review that has been issued/completed for a film
 * The invitationStatus for the review of the film with ID filmID issued to the user with ID reviewerId is retrieved. This operation can only be executed by the authenticated film owner or reviewer.
 *
 * filmId Long ID of the film whose reviews must be retrieved
 * reviewerId Long ID of the user to whom the review has been issued
 * returns Review_invitationStatus
 **/
exports.getSingleReviewInvitationStatus = function (filmId, reviewerId, userId) {
    return new Promise((resolve, reject) => {
        const sql = "SELECT owner, filmId, reviewerId, invitationStatus FROM reviews r, films f  WHERE r.filmId = f.id AND filmId = ? AND reviewerId = ?";
        db.all(sql, [filmId, reviewerId], (err, rows) => {
            if (err)
                reject(err);
            else if (rows.length === 0)
                reject(404);
            else if (userId != reviewerId && userId != rows[0].owner)
                reject(403);
            else {
                var reviewInvitationStatus = createReviewInvitationStatus(rows[0]);
                resolve(reviewInvitationStatus);
            }
        });
    });
};

/**
 * Retrieve the invitationStatus for all reviews that has been issued/completed for a film, possibly filtered
 * The invitationStatus for all the reviews of the film with ID filmID are retrieved. This operation can only be executed by the authenticated film owner.
 *
 * filmId Long ID of the film whose reviews must be retrieved
 * invitationStatus String The invitation Status used to filter the reviews (if absent, all reviews are considered). This query parameter only has effect for the film owner. (optional)
 * pageNo Integer ID of the requested page (if absent, the first page is returned)' (optional)
 * returns inline_response_200_2
 **/
exports.getReviewsInvitationStatus = function (filmId, invitationStatusFilter, pageNo, userId) {
    return new Promise(function (resolve, reject) {
        var sql_params = [filmId];

        var sql_count = "SELECT count(*) total_rows FROM reviews l WHERE l.filmId = ? "; //1
        if (invitationStatusFilter) {
            sql_count = sql_count + " AND l.invitationStatus = ? "; //2
            sql_params.push(invitationStatusFilter);
        }


        var sql = "SELECT f.owner, r.filmId, r.reviewerId, r.invitationStatus, c.total_rows FROM reviews r, (" + sql_count + ") c, films f WHERE r.filmId=f.id AND r.filmId = ?"; //3
        sql_params.push(filmId);
        if (invitationStatusFilter) {
            sql = sql + " AND r.invitationStatus = ? "; //4
            sql_params.push(invitationStatusFilter);
        }

        if (!pageNo || pageNo <= 0) {
            pageNo = 1;
        }
        pageNo = Number(pageNo);
        const [offset, row_count] = getPagination(pageNo);

        sql = sql + "LIMIT ?, ?";
        sql_params.push(offset);
        sql_params.push(row_count);


        db.all(sql, sql_params, (err, rows) => {
            if (err) {
                reject(err);
            } else if (rows.length === 0)
                reject(404);
            else if (userId != rows[0].owner) {
                reject(403);
            }
            else {
                let reviews = rows.map((row) => createReviewInvitationStatus(row));
                const totalReviews = rows[0].total_rows;
                var lastPage = Math.ceil(totalReviews / constants.ROW_COUNT);

                var response = {
                    currentPage: pageNo,
                    totalPages: lastPage,
                    totalItems: totalReviews
                };
                response["reviews"] = (pageNo <= lastPage) ? reviews : [];

                if (pageNo < lastPage) {
                    var next = "/api/films/public/invited?";
                    if (invitationStatusFilter) {
                        next = next + "invitationStatus=" + invitationStatusFilter + "&";
                    }
                    next = next + "pageNo=" + (pageNo + 1);
                    response["next"] = next;
                }
                resolve(response);
            }
        });
    });
};

/**
 * Change invitation Status of a review
 * Change the invitation Status of the review of the film with ID filmId and issued to the user with ID reviewerId. This operation allows setting the \"invitationStatus\" property of a \"PENDING\" review to \"ACCEPTED\" or \"REFUSED\". This operation can be performed only by the invited reviewer.
 *
 * body Review_invitationStatus The properties of the Review object that must be updated (optional)
 * filmId Long ID of the film whose review must be completed
 * reviewerId Long ID of the user to whom the review has been issued
 * no response value expected for this operation
 **/
exports.updateSingleReviewInvitationStatus = function (body, filmId, reviewerId, userId) {
    return new Promise(function (resolve, reject) {
        if (body.invitationStatus != "ACCEPTED" && body.invitationStatus != "REFUSED") {
            reject(409);
        }
        const sql1 = "SELECT * FROM reviews WHERE filmId = ? AND reviewerId = ?";
        db.all(sql1, [filmId, reviewerId], (err, rows) => {
            if (err)
                reject(err);
            else if (rows.length === 0)
                reject(404);
            else if (userId != rows[0].reviewerId) {
                reject(403);
            }
            else if (rows[0].invitationStatus != "PENDING") {
                reject(409);
            }
            else {
                var sql2 = 'UPDATE reviews SET invitationStatus = ? WHERE filmId = ? AND reviewerId = ?';
                var sql_params = [body.invitationStatus, filmId, reviewerId];
                db.run(sql2, sql_params, function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(null);
                    }
                });
            }
        });
    });
};


/**
 * Utility functions
 */
const getPagination = function (pageNo) {
    const row_count = parseInt(constants.ROW_COUNT); // =2
    const offset = row_count * (pageNo - 1);  // page <=1 -> offset=0 | page=1->offset=2*1 ... 
    return [offset, row_count];
};


const createReviewFull = function (row) {

    var completedReview = (row.completed === 1) ? true : false;
    return new Reviews.ReviewFull(row.filmId, row.reviewerId, completedReview, row.reviewDate, row.rating, row.review, row.invitationStatus);
};
const createReviewPublic = function (row) {
    var completedReview = (row.completed === 1) ? true : false;
    return new Reviews.ReviewPublic(row.filmId, row.reviewerId, completedReview, row.reviewDate, row.rating, row.review);
};
const createReviewInvitationStatus = function (row) {
    return new Reviews.ReviewInvitationStatus(row.filmId, row.reviewerId, row.invitationStatus);
};

