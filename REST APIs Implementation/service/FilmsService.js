'use strict';

const Film = require('../components/film');
const db = require('../components/db');
var constants = require('../utils/constants.js');

/**
 * Create a new film
 *
 * Input: 
 * - film: the film object that needs to be created
 * - owner: ID of the user who is creating the film
 * Output:
 * - the created film
 **/
exports.createFilm = function (film, owner) {
    return new Promise((resolve, reject) => {

        const sql = 'INSERT INTO films(title, owner, private, watchDate, rating, favorite) VALUES(?,?,?,?,?,?)';
        db.run(sql, [film.title, owner, film.private, film.watchDate, film.rating, film.favorite], function (err) {
            if (err) {
                reject(err);
            } else {
                var createdFilm = new Film(this.lastID, film.title, owner, film.private, film.watchDate, film.rating, film.favorite);
                resolve(createdFilm);
            }
        });
    });
};


/**
 * Retrieve the private film having film Id as ID
 *
 * Input: 
 * - filmId: the ID of the film that needs to be retrieved
 * - owner: ID of the user who is retrieving the film
 * Output:
 * - the requested film
 * 
 **/
exports.getSinglePrivateFilm = function (filmId, owner) {
    return new Promise((resolve, reject) => {
        const sql1 = "SELECT id as fid, title, owner, private, watchDate, rating, favorite FROM films WHERE id = ?";
        db.all(sql1, [filmId], (err, rows) => {
            if (err)
                reject(err);
            else if (rows.length === 0)
                reject(404);
            else if (rows[0].private == 0)
                reject(404);
            else if (rows[0].owner == owner) {
                var film = createFilm(rows[0]);
                resolve(film);
            }
            else
                reject(403);
        });
    });
};


/**
 * Update a private film
 *
 * Input:
 * - film: new film object
 * - filmID: the ID of the film to be updated
 * - owner: the ID of the user who wants to update the film
 * Output:
 * - no response expected for this operation
 * 
 **/
exports.updateSinglePrivateFilm = function (film, filmId, owner) {
    return new Promise((resolve, reject) => {

        const sql1 = "SELECT owner, private FROM films f WHERE f.id = ?";
        db.all(sql1, [filmId], (err, rows) => {
            if (err)
                reject(err);
            else if (rows.length === 0)
                reject(404);
            else if (rows[0].private == 0)
                reject(409);
            else if (owner != rows[0].owner) {
                reject(403);
            }
            else {

                var sql3 = 'UPDATE films SET title = ?';
                var parameters = [film.title];
                sql3 = sql3.concat(', private = ?');
                parameters.push(film.private);
                if (film.watchDate != undefined) {
                    sql3 = sql3.concat(', watchDate = ?');
                    parameters.push(film.watchDate);
                }
                if (film.rating != undefined) {
                    sql3 = sql3.concat(', rating = ?');
                    parameters.push(film.rating);
                }
                if (film.favorite != undefined) {
                    sql3 = sql3.concat(', favorite = ?');
                    parameters.push(film.favorite);
                }
                sql3 = sql3.concat(' WHERE id = ?');
                parameters.push(filmId);

                db.run(sql3, parameters, function (err) {
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
 * Delete a private film having filmId as ID
 *
 * Input: 
 * - filmId: the ID of the film that needs to be deleted
 * - owner: ID of the user who is deleting the film
 * Output:
 * - no response expected for this operation
 **/
exports.deleteSinglePrivateFilm = function (filmId, owner) {
    return new Promise((resolve, reject) => {
        const sql1 = "SELECT owner FROM films f WHERE f.id = ? AND f.private = 1";
        db.all(sql1, [filmId], (err, rows) => {
            if (err)
                reject(err);
            else if (rows.length === 0)
                reject(404);
            else if (owner != rows[0].owner) {
                reject(403);
            }
            else {
                const sql3 = 'DELETE FROM films WHERE id = ?';
                db.run(sql3, [filmId], (err) => {
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
 * Retrieve the public film having film Id as ID
 *
 * Input: 
 * - filmId: the ID of the public film that needs to be retrieved
 * Output:
 * - the requested public film
 * 
 **/
exports.getSinglePublicFilm = function (filmId) {
    return new Promise((resolve, reject) => {
        const sql = "SELECT id as fid, title, owner, private, watchDate, rating, favorite FROM films WHERE id = ?";

        db.all(sql, [filmId], (err, rows) => {
            if (err)
                reject(err);
            else if (rows.length === 0)
                reject(404);
            else if (rows[0].private == 1)
                reject(404);
            else {
                var film = createFilm(rows[0]);
                resolve(film);
            }
        });
    });
};


/**
 * Update a public film
 *
 * Input:
 * - film: new film object
 * - filmID: the ID of the film to be updated
 * - owner: the ID of the user who wants to update the film
 * Output:
 * - no response expected for this operation
 * 
 **/
exports.updateSinglePublicFilm = function (film, filmId, owner) {
    return new Promise((resolve, reject) => {

        const sql1 = "SELECT owner, private FROM films f WHERE f.id = ?";
        db.all(sql1, [filmId], (err, rows) => {
            if (err)
                reject(err);
            else if (rows.length === 0)
                reject(404);
            else if (rows[0].private == 1)
                reject(409);
            else if (owner != rows[0].owner) {
                reject(403);
            }
            else {
                var sql3 = 'UPDATE films SET title = ?';
                var parameters = [film.title];
                sql3 = sql3.concat(', private = ?');
                parameters.push(film.private);
                sql3 = sql3.concat(' WHERE id = ?');
                parameters.push(filmId);

                db.run(sql3, parameters, function (err) {
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
 * Delete a public film having filmId as ID
 *
 * Input: 
 * - filmId: the ID of the film that needs to be deleted
 * - owner: ID of the user who is deleting the film
 * Output:
 * - no response expected for this operation
 **/
exports.deleteSinglePublicFilm = function (filmId, owner) {
    return new Promise((resolve, reject) => {
        const sql1 = "SELECT owner FROM films f WHERE f.id = ?";
        db.all(sql1, [filmId], (err, rows) => {
            if (err)
                reject(err);
            else if (rows.length === 0)
                reject(404);
            else if (rows[0].private == 1)
                reject(404);
            else if (owner != rows[0].owner) {
                reject(403);
            }
            else {
                const sql2 = 'DELETE FROM reviews WHERE filmId = ?';
                db.run(sql2, [filmId], (err) => {
                    if (err)
                        reject(err);
                    else {
                        const sql3 = 'DELETE FROM films WHERE id = ?';
                        db.run(sql3, [filmId], (err) => {
                            if (err)
                                reject(err);
                            else
                                resolve(null);
                        });
                    }
                });
            }
        });
    });
};



/**
 * Retrieve the public films
 * The public films (i.e., the films that are visible for all the users of the service) are retrieved. This operation does not require authentication. A pagination mechanism is implemented to limit the size of messages.
 *
 * pageNo Integer The id of the requested page (if absent, the first page is returned) (optional)
 * returns PaginatedFilms
 **/
exports.getPublicFilms = function (pageNo) {
    return new Promise((resolve, reject) => {

        if (!pageNo || pageNo <= 0) {
            pageNo = 1;
        }
        pageNo = Number(pageNo);
        const [offset, row_count] = getPagination(pageNo);
        var sql = "SELECT f.id as fid, f.title, f.owner, f.private, f.watchDate, f.rating, f.favorite, c.total_rows FROM films f, (SELECT count(*) total_rows FROM films l WHERE l.private=0) c WHERE f.private = 0 LIMIT ?, ?";
        db.all(sql, offset, row_count, (err, rows) => {
            if (err) {
                reject(err);
            } else if (rows.length === 0)
                reject(404);
            else {
                let films = rows.map((row) => createFilm(row));
                const totalFilms = rows[0].total_rows;
                var lastPage = Math.ceil(totalFilms / constants.ROW_COUNT);

                var response = {
                    currentPage: pageNo,
                    totalPages: lastPage,
                    totalItems: totalFilms
                };
                response["films"] = (pageNo <= lastPage) ? films : [];

                if (pageNo < lastPage) {
                    response["next"] = "/api/films/public?pageNo=" + (pageNo + 1);
                }
                resolve(response);
            }
        });
    });
};

/**
 * Retrieve the private films of an user with ID userId
 * 
 * Input: 
 * - req: the request of the user
 * Output:
 * - list of the public films
 * 
 **/
exports.getPrivateFilms = function (pageNo, userId) {
    return new Promise((resolve, reject) => {

        if (!pageNo || pageNo <= 0) {
            pageNo = 1;
        }
        pageNo = Number(pageNo);
        const [offset, row_count] = getPagination(pageNo);
        var sql = "SELECT f.id as fid, f.title, f.owner, f.private, f.watchDate, f.rating, f.favorite, c.total_rows FROM films f, (SELECT count(*) total_rows FROM films l WHERE l.private=1 AND owner = ?) c WHERE  f.private = 1 AND owner = ? LIMIT ?, ?";
        var sql_params = [userId, userId, offset, row_count];
        db.all(sql, sql_params, (err, rows) => {
            if (err) {
                reject(err);
            } else if (rows.length === 0)
                reject(404);
            else {
                let films = rows.map((row) => createFilm(row));
                const totalFilms = rows[0].total_rows;
                var lastPage = Math.ceil(totalFilms / constants.ROW_COUNT);

                var response = {
                    currentPage: pageNo,
                    totalPages: lastPage,
                    totalItems: totalFilms
                };
                response["films"] = (pageNo <= lastPage) ? films : [];

                if (pageNo < lastPage) {
                    response["next"] = "/api/films/private?pageNo=" + (pageNo + 1);
                }
                resolve(response);
            }
        });
    });
};

/**
 * Retrieve the public films that the logged-in user has been invited to review, possibly filtered by the review's invitation Status
 * The public films that the logged-in user has been invited to review are retrieved, possibly filtered by the review's invitation Status. A pagination mechanism is implemented to limit the size of messages.
 *
 * invitationStatus String The invitation Status used to filter the reviews (if absent, all reviews are considered) (optional)
 * pageNo Integer The id of the requested page (if absent, the first page is returned) (optional)
 * returns inline_response_200
 **/
exports.getInvitedFilms = function (invitationStatusFilter, pageNo, reviewerId) {
    return new Promise((resolve, reject) => {


        var sql_params = [reviewerId];

        var sql_count = "SELECT count(*) total_rows FROM films f2, reviews r2 WHERE f2.private=0 AND f2.id = r2.filmId AND r2.reviewerId = ? "; //1
        if (invitationStatusFilter) {
            sql_count = sql_count + " AND r2.invitationStatus = ? "; //2
            sql_params.push(invitationStatusFilter);
        }
        var sql = "SELECT f.id as fid, f.title, f.owner, f.private, f.watchDate, f.rating, f.favorite, c.total_rows FROM films f, reviews r, (" + sql_count + ") c WHERE f.private = 0 AND f.id = r.filmId AND r.reviewerId = ? "; //3
        sql_params.push(reviewerId);
        if (invitationStatusFilter) {
            sql = sql + " AND r.invitationStatus = ? "; //4
            sql_params.push(invitationStatusFilter);
        }

        if (!pageNo || pageNo <= 0) {
            pageNo = 1;
        }
        pageNo = Number(pageNo);
        const [offset, row_count] = getPagination(pageNo);
        sql = sql + " LIMIT ?,?"; //5,6
        sql_params.push(offset);
        sql_params.push(row_count);

        db.all(sql, sql_params, (err, rows) => {
            if (err) {
                reject(err);
            } else if (rows.length === 0)
                reject(404);
            else {
                let films = rows.map((row) => createFilm(row));
                const totalFilms = rows[0].total_rows;
                var lastPage = Math.ceil(totalFilms / constants.ROW_COUNT);

                var response = {
                    currentPage: pageNo,
                    totalPages: lastPage,
                    totalItems: totalFilms
                };
                response["films"] = (pageNo <= lastPage) ? films : [];

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
 * Utility functions
 */
const getPagination = function (pageNo) {
    const row_count = parseInt(constants.ROW_COUNT); // =2
    const offset = row_count * (pageNo - 1);  // page <=1 -> offset=0 | page=1->offset=2*1 ... 
    return [offset, row_count];
};

const createFilm = function (row) {
    var privateFilm = (row.private === 1) ? true : false;
    var favoriteFilm;
    if (row.favorite == null) favoriteFilm = undefined;
    else favoriteFilm = (row.favorite === 1) ? true : false;
    return new Film(row.fid, row.title, row.owner, privateFilm, row.watchDate, row.rating, favoriteFilm);
}


