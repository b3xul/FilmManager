class ReviewFull {
    constructor(filmId, reviewerId, completed, reviewDate, rating, review, invitationStatus) {
        this.filmId = filmId;
        this.reviewerId = reviewerId;
        this.completed = completed;

        if (reviewDate)
            this.reviewDate = reviewDate;
        if (rating)
            this.rating = rating;
        if (review)
            this.review = review;

        var selfLink = "/api/films/public/" + this.filmId + "/reviews/" + this.reviewerId;
        this.self = selfLink;

        if (invitationStatus)
            this.invitationStatus = invitationStatus;
        else
            this.invitationStatus = "PENDING";
    }
}

class ReviewPublic {
    constructor(filmId, reviewerId, completed, reviewDate, rating, review) {
        this.filmId = filmId;
        this.reviewerId = reviewerId;
        this.completed = completed;

        if (reviewDate)
            this.reviewDate = reviewDate;
        if (rating)
            this.rating = rating;
        if (review)
            this.review = review;

        var selfLink = "/api/films/public/" + this.filmId + "/reviews/" + this.reviewerId;
        this.self = selfLink;

        // if (invitationStatus)
        //     this.invitationStatus = invitationStatus;
        // else
        //     this.invitationStatus = "PENDING";
    }
}

class ReviewInvitationStatus {
    constructor(filmId, reviewerId, invitationStatus) {
        this.filmId = filmId;
        this.reviewerId = reviewerId;
        // this.completed = completed;

        // if (reviewDate)
        //     this.reviewDate = reviewDate;
        // if (rating)
        //     this.rating = rating;
        // if (review)
        //     this.review = review;

        var selfLink = "/api/films/public/" + this.filmId + "/reviews/" + this.reviewerId;
        this.self = selfLink;

        if (invitationStatus)
            this.invitationStatus = invitationStatus;
        else
            this.invitationStatus = "PENDING";
    }
}
module.exports.ReviewFull = ReviewFull;
module.exports.ReviewPublic = ReviewPublic;
module.exports.ReviewInvitationStatus = ReviewInvitationStatus;


