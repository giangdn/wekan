// Sandstorm context is detected using the METEOR_SETTINGS environment variable
// in the package definition.
const isSandstorm = Meteor.settings && Meteor.settings.public &&
  Meteor.settings.public.sandstorm;
Users = Meteor.users;

/**
 * A User in wekan
 */
Users.attachSchema(new SimpleSchema({
  username: {
    /**
     * the username of the user
     */
    type: String,
    optional: true,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert && !this.isSet) {
        const name = this.field('profile.fullname');
        if (name.isSet) {
          return name.value.toLowerCase().replace(/\s/g, '');
        }
      }
    },
  },
  emails: {
    /**
     * the list of emails attached to a user
     */
    type: [Object],
    optional: true,
  },
  'emails.$.address': {
    /**
     * The email address
     */
    type: String,
    regEx: SimpleSchema.RegEx.Email,
  },
  'emails.$.verified': {
    /**
     * Has the email been verified
     */
    type: Boolean,
  },
  createdAt: {
    /**
     * creation date of the user
     */
    type: Date,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert) {
        return new Date();
      } else {
        this.unset();
      }
    },
  },
  profile: {
    /**
     * profile settings
     */
    type: Object,
    optional: true,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert && !this.isSet) {
        return {
          boardView: 'board-view-lists',
        };
      }
    },
  },
  'profile.avatarUrl': {
    /**
     * URL of the avatar of the user
     */
    type: String,
    optional: true,
  },
  'profile.emailBuffer': {
    /**
     * list of email buffers of the user
     */
    type: [String],
    optional: true,
  },
  'profile.fullname': {
    /**
     * full name of the user
     */
    type: String,
    optional: true,
  },
  'profile.hiddenSystemMessages': {
    /**
     * does the user wants to hide system messages?
     */
    type: Boolean,
    optional: true,
  },
  'profile.initials': {
    /**
     * initials of the user
     */
    type: String,
    optional: true,
  },
  'profile.invitedBoards': {
    /**
     * board IDs the user has been invited to
     */
    type: [String],
    optional: true,
  },
  'profile.language': {
    /**
     * language of the user
     */
    type: String,
    optional: true,
  },
  'profile.notifications': {
    /**
     * enabled notifications for the user
     */
    type: [String],
    optional: true,
  },
  'profile.showCardsCountAt': {
    /**
     * showCardCountAt field of the user
     */
    type: Number,
    optional: true,
  },
  'profile.starredBoards': {
    /**
     * list of starred board IDs
     */
    type: [String],
    optional: true,
  },
  'profile.icode': {
    /**
     * icode
     */
    type: String,
    optional: true,
  },
  'profile.boardView': {
    /**
     * boardView field of the user
     */
    type: String,
    optional: true,
    allowedValues: [
      'board-view-lists',
      'board-view-swimlanes',
      'board-view-cal',
    ],
  },
  'profile.templatesBoardId': {
    /**
     * Reference to the templates board
     */
    type: String,
    defaultValue: '',
  },
  'profile.cardTemplatesSwimlaneId': {
    /**
     * Reference to the card templates swimlane Id
     */
    type: String,
    defaultValue: '',
  },
  'profile.listTemplatesSwimlaneId': {
    /**
     * Reference to the list templates swimlane Id
     */
    type: String,
    defaultValue: '',
  },
  'profile.boardTemplatesSwimlaneId': {
    /**
     * Reference to the board templates swimlane Id
     */
    type: String,
    defaultValue: '',
  },
  services: {
    /**
     * services field of the user
     */
    type: Object,
    optional: true,
    blackbox: true,
  },
  heartbeat: {
    /**
     * last time the user has been seen
     */
    type: Date,
    optional: true,
  },
  isAdmin: {
    /**
     * is the user an admin of the board?
     */
    type: Boolean,
    optional: true,
  },
  createdThroughApi: {
    /**
     * was the user created through the API?
     */
    type: Boolean,
    optional: true,
  },
  loginDisabled: {
    /**
     * loginDisabled field of the user
     */
    type: Boolean,
    optional: true,
  },
  'authenticationMethod': {
    /**
     * authentication method of the user
     */
    type: String,
    optional: false,
    defaultValue: 'password',
  },
}));

Users.allow({
  update(userId) {
    const user = Users.findOne(userId);
    return user && Meteor.user().isAdmin;
  },
});

// Search a user in the complete server database by its name or username. This
// is used for instance to add a new user to a board.
const searchInFields = ['username', 'profile.fullname'];
Users.initEasySearch(searchInFields, {
  use: 'mongo-db',
  returnFields: [...searchInFields, 'profile.avatarUrl'],
});

if (Meteor.isClient) {
  Users.helpers({
    isBoardMember() {
      const board = Boards.findOne(Session.get('currentBoard'));
      return board && board.hasMember(this._id);
    },

    isNotNoComments() {
      const board = Boards.findOne(Session.get('currentBoard'));
      return board && board.hasMember(this._id) && !board.hasNoComments(this._id);
    },

    isNoComments() {
      const board = Boards.findOne(Session.get('currentBoard'));
      return board && board.hasNoComments(this._id);
    },

    isNotCommentOnly() {
      const board = Boards.findOne(Session.get('currentBoard'));
      return board && board.hasMember(this._id) && !board.hasCommentOnly(this._id);
    },

    isCommentOnly() {
      const board = Boards.findOne(Session.get('currentBoard'));
      return board && board.hasCommentOnly(this._id);
    },

    isBoardAdmin() {
      const board = Boards.findOne(Session.get('currentBoard'));
      return board && board.hasAdmin(this._id);
    },
  });
}

Users.helpers({
  boards() {
    return Boards.find({ 'members.userId': this._id });
  },

  starredBoards() {
    const {starredBoards = []} = this.profile;
    return Boards.find({archived: false, _id: {$in: starredBoards}});
  },

  hasStarred(boardId) {
    const {starredBoards = []} = this.profile;
    return _.contains(starredBoards, boardId);
  },

  invitedBoards() {
    const {invitedBoards = []} = this.profile;
    return Boards.find({archived: false, _id: {$in: invitedBoards}});
  },

  isInvitedTo(boardId) {
    const {invitedBoards = []} = this.profile;
    return _.contains(invitedBoards, boardId);
  },

  hasTag(tag) {
    const {tags = []} = this.profile;
    return _.contains(tags, tag);
  },

  hasNotification(activityId) {
    const {notifications = []} = this.profile;
    return _.contains(notifications, activityId);
  },

  hasHiddenSystemMessages() {
    const profile = this.profile || {};
    return profile.hiddenSystemMessages || false;
  },

  getEmailBuffer() {
    const {emailBuffer = []} = this.profile;
    return emailBuffer;
  },

  getInitials() {
    const profile = this.profile || {};
    if (profile.initials)
      return profile.initials;

    else if (profile.fullname) {
      return profile.fullname.split(/\s+/).reduce((memo, word) => {
        return memo + word[0];
      }, '').toUpperCase();

    } else {
      return this.username[0].toUpperCase();
    }
  },

  getLimitToShowCardsCount() {
    const profile = this.profile || {};
    return profile.showCardsCountAt;
  },

  getName() {
    const profile = this.profile || {};
    return profile.fullname || this.username;
  },

  getLanguage() {
    const profile = this.profile || {};
    return profile.language || 'en';
  },

  getTemplatesBoardId() {
    return this.profile.templatesBoardId;
  },

  getTemplatesBoardSlug() {
    return Boards.findOne(this.profile.templatesBoardId).slug;
  },
});

Users.mutations({
  toggleBoardStar(boardId) {
    const queryKind = this.hasStarred(boardId) ? '$pull' : '$addToSet';
    return {
      [queryKind]: {
        'profile.starredBoards': boardId,
      },
    };
  },

  addInvite(boardId) {
    return {
      $addToSet: {
        'profile.invitedBoards': boardId,
      },
    };
  },

  removeInvite(boardId) {
    return {
      $pull: {
        'profile.invitedBoards': boardId,
      },
    };
  },

  addTag(tag) {
    return {
      $addToSet: {
        'profile.tags': tag,
      },
    };
  },

  removeTag(tag) {
    return {
      $pull: {
        'profile.tags': tag,
      },
    };
  },

  toggleTag(tag) {
    if (this.hasTag(tag))
      this.removeTag(tag);
    else
      this.addTag(tag);
  },

  toggleSystem(value = false) {
    return {
      $set: {
        'profile.hiddenSystemMessages': !value,
      },
    };
  },

  addNotification(activityId) {
    return {
      $addToSet: {
        'profile.notifications': activityId,
      },
    };
  },

  removeNotification(activityId) {
    return {
      $pull: {
        'profile.notifications': activityId,
      },
    };
  },

  addEmailBuffer(text) {
    return {
      $addToSet: {
        'profile.emailBuffer': text,
      },
    };
  },

  clearEmailBuffer() {
    return {
      $set: {
        'profile.emailBuffer': [],
      },
    };
  },

  setAvatarUrl(avatarUrl) {
    return {$set: {'profile.avatarUrl': avatarUrl}};
  },

  setShowCardsCountAt(limit) {
    return {$set: {'profile.showCardsCountAt': limit}};
  },

  setBoardView(view) {
    return {
      $set : {
        'profile.boardView': view,
      },
    };
  },
});

Meteor.methods({
  setUsername(username, userId) {
    check(username, String);
    const nUsersWithUsername = Users.find({username}).count();
    if (nUsersWithUsername > 0) {
      throw new Meteor.Error('username-already-taken');
    } else {
      Users.update(userId, {$set: {username}});
    }
  },
  toggleSystemMessages() {
    const user = Meteor.user();
    user.toggleSystem(user.hasHiddenSystemMessages());
  },
  changeLimitToShowCardsCount(limit) {
    check(limit, Number);
    Meteor.user().setShowCardsCountAt(limit);
  },
  setEmail(email, userId) {
    check(email, String);
    const existingUser = Users.findOne({'emails.address': email}, {fields: {_id: 1}});
    if (existingUser) {
      throw new Meteor.Error('email-already-taken');
    } else {
      Users.update(userId, {
        $set: {
          emails: [{
            address: email,
            verified: false,
          }],
        },
      });
    }
  },
  setUsernameAndEmail(username, email, userId) {
    check(username, String);
    check(email, String);
    check(userId, String);
    Meteor.call('setUsername', username, userId);
    Meteor.call('setEmail', email, userId);
  },
  setPassword(newPassword, userId) {
    check(userId, String);
    check(newPassword, String);
    if(Meteor.user().isAdmin){
      Accounts.setPassword(userId, newPassword);
    }
  },
});

if (Meteor.isServer) {
  Meteor.methods({
    // we accept userId, username, email
    inviteUserToBoard(username, boardId) {
      check(username, String);
      check(boardId, String);

      const inviter = Meteor.user();
      const board = Boards.findOne(boardId);
      const allowInvite = inviter &&
        board &&
        board.members &&
        _.contains(_.pluck(board.members, 'userId'), inviter._id) &&
        _.where(board.members, {userId: inviter._id})[0].isActive &&
        _.where(board.members, {userId: inviter._id})[0].isAdmin;
      if (!allowInvite) throw new Meteor.Error('error-board-notAMember');

      this.unblock();

      const posAt = username.indexOf('@');
      let user = null;
      if (posAt >= 0) {
        user = Users.findOne({emails: {$elemMatch: {address: username}}});
      } else {
        user = Users.findOne(username) || Users.findOne({username});
      }
      if (user) {
        if (user._id === inviter._id) throw new Meteor.Error('error-user-notAllowSelf');
      } else {
        if (posAt <= 0) throw new Meteor.Error('error-user-doesNotExist');
        if (Settings.findOne().disableRegistration) throw new Meteor.Error('error-user-notCreated');
        // Set in lowercase email before creating account
        const email = username.toLowerCase();
        username = email.substring(0, posAt);
        const newUserId = Accounts.createUser({username, email});
        if (!newUserId) throw new Meteor.Error('error-user-notCreated');
        // assume new user speak same language with inviter
        if (inviter.profile && inviter.profile.language) {
          Users.update(newUserId, {
            $set: {
              'profile.language': inviter.profile.language,
            },
          });
        }
        Accounts.sendEnrollmentEmail(newUserId);
        user = Users.findOne(newUserId);
      }

      board.addMember(user._id);
      user.addInvite(boardId);

      try {
        const params = {
          inviter: inviter.username,
          board: board.title,
          url: board.absoluteUrl(),
        };
        const lang = user.getLanguage();

        // load languages strings for html email
        const teamaBlog       = TAPi18n.__('email-teama-blog', {}, lang);
        const teamaMobileApp  = TAPi18n.__('email-teama-mobile-app', {}, lang);
        const teamaAppLink    = TAPi18n.__('email-teama-mobile-app-link', {}, lang);
        const teamaAppDesc    = TAPi18n.__('email-teama-mobile-app-desc', {}, lang);
        const teamaSendBy     = TAPi18n.__('email-send-by', {}, lang);
        const emailUnsubcribe = TAPi18n.__('email-unsubcribe', {}, lang);
        const emailThanks     = TAPi18n.__('email-teama-thanks', {}, lang);

        const emailHi         = TAPi18n.__('email-invite-hi', {user: user.username}, lang);
        const emailMessage    = TAPi18n.__('email-invite-message', params, lang);

        // send html invitation email
        const htmlMessage = `<html xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv=Content-Type content="text/html; charset=unicode">
          <style>
            < !-- @media only screen and (min-width:480px) {
              .mj-column-per-100,
              * [aria-labelledby="mj-column-per-100"] {
                width: 100% !important;
              }

              .mj-column-per-30,
              * [aria-labelledby="mj-column-per-30"] {
                width: 30% !important;
              }

              .mj-column-per-70,
              * [aria-labelledby="mj-column-per-70"] {
                width: 70% !important;
              }
            }

            .ExternalClass * {
              line-height: 100%;
            }

            body {
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
            }

            img {
              outline: none;
              -ms-interpolation-mode: bicubic;
            }

            html,
            body,
            * {
              -webkit-text-size-adjust: none;
              text-size-adjust: none;
            }

            /* Font Definitions */
            @font-face {
              font-family: Helvetica;
              panose-1: 2 11 6 4 2 2 2 2 2 4;
              mso-font-charset: 0;
              mso-generic-font-family: swiss;
              mso-font-pitch: variable;
              mso-font-signature: -536858881 -1073711013 9 0 511 0;
            }

            @font-face {
              font-family: "Cambria Math";
              panose-1: 2 4 5 3 5 4 6 3 2 4;
              mso-font-charset: 0;
              mso-generic-font-family: roman;
              mso-font-pitch: variable;
              mso-font-signature: 3 0 0 0 1 0;
            }

            @font-face {
              font-family: Calibri;
              panose-1: 2 15 5 2 2 2 4 3 2 4;
              mso-font-charset: 0;
              mso-generic-font-family: swiss;
              mso-font-pitch: variable;
              mso-font-signature: -536858881 -1073732485 9 0 511 0;
            }

            /* Style Definitions */
            p.MsoNormal,
            li.MsoNormal,
            div.MsoNormal {
              mso-style-unhide: no;
              mso-style-qformat: yes;
              mso-style-parent: "";
              font-size: 11.0pt;
              font-family: "Calibri", sans-serif;
              mso-fareast-font-family: Calibri;
              mso-fareast-theme-font: minor-latin;
            }

            h2 {
              mso-style-priority: 9;
              mso-style-unhide: no;
              mso-style-qformat: yes;
              mso-style-link: "Heading 2 Char";
              mso-margin-top-alt: auto;
              margin-right: 0in;
              mso-margin-bottom-alt: auto;
              margin-left: 0in;
              mso-pagination: widow-orphan;
              mso-outline-level: 2;
              font-size: 18.0pt;
              font-family: "Calibri", sans-serif;
              mso-fareast-font-family: Calibri;
              mso-fareast-theme-font: minor-latin;
              font-weight: bold;
            }

            a:link,
            span.MsoHyperlink {
              mso-style-noshow: yes;
              mso-style-priority: 99;
              color: #7289DA;
              mso-text-animation: none;
              text-decoration: none;
              text-underline: none;
              text-decoration: none;
              text-line-through: none;
            }

            a:visited,
            span.MsoHyperlinkFollowed {
              mso-style-noshow: yes;
              mso-style-priority: 99;
              color: #7289DA;
              mso-text-animation: none;
              text-decoration: none;
              text-underline: none;
              text-decoration: none;
              text-line-through: none;
            }

            p {
              mso-style-noshow: yes;
              mso-style-priority: 99;
              margin-top: 9.75pt;
              margin-right: 0in;
              margin-bottom: 9.75pt;
              margin-left: 0in;
              mso-pagination: widow-orphan;
              font-size: 11.0pt;
              font-family: "Calibri", sans-serif;
              mso-fareast-font-family: Calibri;
              mso-fareast-theme-font: minor-latin;
            }

            p.msonormal0,
            li.msonormal0,
            div.msonormal0 {
              mso-style-name: msonormal;
              mso-style-unhide: no;
              margin-top: 9.75pt;
              margin-right: 0in;
              margin-bottom: 9.75pt;
              margin-left: 0in;
              mso-pagination: widow-orphan;
              font-size: 11.0pt;
              font-family: "Calibri", sans-serif;
              mso-fareast-font-family: Calibri;
              mso-fareast-theme-font: minor-latin;
            }

            p.readmsgbody,
            li.readmsgbody,
            div.readmsgbody {
              mso-style-name: readmsgbody;
              mso-style-unhide: no;
              mso-margin-top-alt: auto;
              margin-right: 0in;
              mso-margin-bottom-alt: auto;
              margin-left: 0in;
              mso-pagination: widow-orphan;
              font-size: 11.0pt;
              font-family: "Calibri", sans-serif;
              mso-fareast-font-family: Calibri;
              mso-fareast-theme-font: minor-latin;
            }

            p.externalclass,
            li.externalclass,
            div.externalclass {
              mso-style-name: externalclass;
              mso-style-unhide: no;
              mso-margin-top-alt: auto;
              margin-right: 0in;
              mso-margin-bottom-alt: auto;
              margin-left: 0in;
              mso-pagination: widow-orphan;
              font-size: 11.0pt;
              font-family: "Calibri", sans-serif;
              mso-fareast-font-family: Calibri;
              mso-fareast-theme-font: minor-latin;
            }

            span.Heading2Char {
              mso-style-name: "Heading 2 Char";
              mso-style-noshow: yes;
              mso-style-priority: 9;
              mso-style-unhide: no;
              mso-style-locked: yes;
              mso-style-link: "Heading 2";
              mso-ansi-font-size: 13.0pt;
              mso-bidi-font-size: 13.0pt;
              font-family: "Calibri Light", sans-serif;
              mso-ascii-font-family: "Calibri Light";
              mso-ascii-theme-font: major-latin;
              mso-fareast-font-family: "Times New Roman";
              mso-fareast-theme-font: major-fareast;
              mso-hansi-font-family: "Calibri Light";
              mso-hansi-theme-font: major-latin;
              mso-bidi-font-family: "Times New Roman";
              mso-bidi-theme-font: major-bidi;
              color: #2F5496;
              mso-themecolor: accent1;
              mso-themeshade: 191;
            }

            .MsoChpDefault {
              mso-style-type: export-only;
              mso-default-props: yes;
              font-size: 10.0pt;
              mso-ansi-font-size: 10.0pt;
              mso-bidi-font-size: 10.0pt;
            }

            @page WordSection1 {
              size: 8.5in 11.0in;
              margin: 1.0in 1.0in 1.0in 1.0in;
              mso-header-margin: .5in;
              mso-footer-margin: .5in;
              mso-paper-source: 0;
            }

            div.WordSection1 {
              page: WordSection1;
            }

            -->
          </style>
        </head>

        <body bgcolor="#F9F9F9" lang=EN-US link="#1EB0F4" vlink="#1EB0F4" style='tab-interval: .5in'>
          <div class=WordSection1>
            <div>
              <div align=center>
                <table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0 width=640
                  style='width: 480.0pt; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
                  <tr style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
                    <td style='padding: 0in 0in 0in 0in'>
                      <div>
                        <div>
                          <div align=center>
                            <table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0 width="100%"
                              style='width: 100.0%; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
                              <tr style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
                                <td valign=top style='padding: 30.0pt 0in 30.0pt 0in'>
                                  <div align=center>
                                    <table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0
                                      style='border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
                                      <tr style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
                                        <td width=640 valign=top style='width: 480.0pt; padding: 0in 0in 0in 0in'>
                                          <table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0 width="100%"
                                            style='width: 100.0%; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
                                            <tr style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
                                              <td style='padding: 0in 0in 0in 0in'>
                                                <div align=center>
                                                  <table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0
                                                    style='border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
                                                    <tr style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
                                                      <td width=80 style='width: 80px; padding: 0in 0in 0in 0in'>
                                                        <p class=MsoNormal>
                                                          <span style='mso-fareast-font-family: "Times New Roman"'>
                                                            <a href="https://board.teama.io" target="_blank">
                                                              <img border=0 width=80 height=80 id="_x0000_i1025"
                                                                src="https://teama.io/assets/img/icons/boarda-icon-1-gradient-320.png"
                                                                style='border-radius:; outline: none; border-bottom-style: none; border-left-style: none; border-right-style: none; border-top-style: none; display: block; height: 80px; text-decoration: none; width: 80px'
                                                                title="">
                                                            </a>
                                                            <o:p></o:p>
                                                          </span>
                                                        </p>
                                                      </td>
                                                    </tr>
                                                  </table>
                                                </div>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </div>
                        </div>
                      </div>
                    </td>
                </table>
                </tr>
                <p class=MsoNormal style='background: #F9F9F9'>
                  <span style='mso-fareast-font-family: "Times New Roman"; display: none; mso-hide: all'>
                    <o:p>&nbsp;</o:p>
                  </span>
                </p>
                <div align=center>
                  <table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0 width=640
                    style='width: 480.0pt; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'
                    role=presentation>
                    <tr style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
                      <td style='padding: 0in 0in 0in 0in; word-break: break-word'>
                        <div style='box-shadow: 0px 1px 5px rgba(0, 0, 0, 0.1); border-radius: 4px; overflow: hidden'>
                          <div>
                            <div align=center>
                              <table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0 width="100%"
                                style='width: 100.0%; background: white; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
                                <tr style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
                                  <td valign=top style='padding: 30.0pt 52.5pt 30.0pt 52.5pt'>
                                    <div align=center>
                                      <table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0
                                        style='border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
                                        <tr style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
                                          <td width=640 valign=top style='width: 480.0pt; padding: 0in 0in 0in 0in'>
                                            <table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0 width="100%"
                                              style='width: 100.0%; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
                                              <tr style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
                                                <td style='padding: 0in 0in 0in 0in'>
                                                  <p style='line-height: 18.0pt; mso-line-height-rule: exactly'>
                                                    <span style='font-size: 12.0pt; font-family: "Helvetica", sans-serif; color: #737F8D'>
                                                      ${emailHi}
                                                      <o:p></o:p>
                                                    </span>
                                                  </p>
                                                  <p style='line-height: 18.0pt; mso-line-height-rule: exactly'>
                                                    <span style='font-size: 12.0pt; font-family: "Helvetica", sans-serif; color: #737F8D'>
                                                      ${emailMessage}
                                                      <o:p></o:p>
                                                    </span>
                                                  </p>
                                                  <br>
                                                  <p style='line-height: 18.0pt; mso-line-height-rule: exactly'>
                                                    <span style='font-size: 12.0pt; font-family: "Helvetica", sans-serif; color: #737F8D'>
                                                      ${emailThanks}
                                                      <o:p></o:p>
                                                    </span>
                                                  </p>
                                                </td>
                                              </tr>
                                            </table>
                                          </td>
                                        </tr>
                                      </table>
                                    </div>
                                  </td>
                                </tr>
                              </table>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </table>
                  </table>
                </div>
                <div align=center>
                  <table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0 width=640
                    style='width: 480.0pt; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
                    <tr style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
                      <td style='padding: 0in 0in 0in 0in'>
                        <div>
                          <p class=MsoNormal style='line-height: 15.0pt; mso-line-height-rule: exactly'>
                            <span style='font-size: 1.0pt; mso-fareast-font-family: "Times New Roman"'>&nbsp;<o:p></o:p></span>
                          </p>
                        </div>
                      </td>
                    </tr>
                  </table>
                </div>
                <p class=MsoNormal style='background: #F9F9F9'>
                  <span style='mso-fareast-font-family: "Times New Roman"; display: none; mso-hide: all'>
                    <o:p>&nbsp;</o:p>
                  </span>
                </p>
                <div align=center>
                  <table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0 width=640
                    style='width: 480.0pt; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'
                    role=presentation>
                    <tr style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
                      <td style='padding: 0in 0in 0in 0in; word-break: break-word'>
                        <div style='box-shadow: 0px 1px 5px rgba(0, 0, 0, 0.1); border-radius: 4px; overflow: hidden'>
                          <div align=center>
                            <table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0 width="100%"
                              style='width: 100.0%; background: white; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
                              <tr style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
                                <td valign=top style='padding: 15.0pt 15.0pt 15.0pt 15.0pt'>
                                  <div align=center>
                                    <table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0
                                      style='border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
                                      <tr style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
                                        <td width=120 valign=top style='width: 120px; padding: 0in 0in 0in 0in'>
                                          <table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0 width="100%"
                                            style='width: 100.0%; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
                                            <tr style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
                                              <td style='padding: 6.0pt 6.0pt 6.0pt 6.0pt'>
                                                <div align=center>
                                                  <table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0
                                                    style='border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
                                                    <tr style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
                                                      <td width=100 style='width: 100px; padding: 0in 0in 0in 0in'>
                                                        <p class=MsoNormal>
                                                          <span style='mso-fareast-font-family: "Times New Roman"'>
                                                            <img border=0 width=100 id="_x0000_i1026"
                                                              src="https://teama.io/assets/img/logos/teama/teama-240.png"
                                                              style='outline: none; border-bottom-style: none; border-left-style: none; border-right-style: none; border-top-style: none; display: block; height: auto; text-decoration: none; width: 100%'
                                                              title="">
                                                            <o:p></o:p>
                                                          </span>
                                                        </p>
                                                      </td>
                                                    </tr>
                                                  </table>
                                                </div>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                        <td width=448 valign=top
                                          style='width: 336.0pt; padding: 0in 0in 0in 0in; word-break: break-word'>
                                          <table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0 width="100%"
                                            style='width: 100.0%; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'
                                            role=presentation>
                                            <tr style='mso-yfti-irow: 0; mso-yfti-firstrow: yes'>
                                              <td style='padding: 15.0pt 15.0pt 0in 15.0pt'>
                                                <p class=MsoNormal style='margin-bottom: 1.5pt; line-height: 16pt; mso-line-height-rule: exactly'>
                                                  <span style='font-size: 16.0pt; font-family: "Helvetica", sans-serif; mso-fareast-font-family: "Times New Roman"; color: #825eeb'>
                                                    ${teamaMobileApp}<o:p></o:p>
                                                  </span>
                                                </p>
                                              </td>
                                            </tr>
                                            <tr style='mso-yfti-irow: 1; mso-yfti-lastrow: yes'>
                                              <td style='padding: 0pt 8.0pt 15.0pt 15.0pt; word-break: break-word'>
                                                <p style='padding-top: 0pt; line-height: 18.0pt; mso-line-height-rule: exactly'>
                                                  <span
                                                    style='font-size: 12.0pt; font-family: "Helvetica", sans-serif; color: #737F8D'>
                                                    <a href="https://apps.teama.io">
                                                      <span style='color: #7289DA'>${teamaAppLink}</span>
                                                    </a> ${teamaAppDesc}
                                                    <o:p></o:p>
                                                  </span>
                                                </p>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </table>
                </div>
                <p class=MsoNormal style='background: #F9F9F9'>
                  <span style='mso-fareast-font-family: "Times New Roman"; display: none; mso-hide: all'>
                    <o:p>&nbsp;</o:p>
                  </span>
                </p>
                <div align=center>
                  <table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0 width=640
                    style='width: 480.0pt; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'
                    role=presentation>
                    <tr style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
                      <td style='padding: 0in 0in 0in 0in; word-break: break-word'>
                        <div>
                          <div align=center>
                            <table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0 width="100%"
                              style='width: 100.0%; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'
                              role=presentation>
                              <tr style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
                                <td valign=top style='padding: 15.0pt 0in 15.0pt 0in'>
                                  <div align=center>
                                    <table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0
                                      style='border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'
                                      role=presentation>
                                      <tr style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
                                        <td width=640 valign=top style='width: 480.0pt; padding: 0in 0in 0in 0in'>
                                          <table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0 width="100%"
                                            style='width: 100.0%; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'
                                            role=presentation>
                                            <tr style='mso-yfti-irow: 0; mso-yfti-firstrow: yes'>
                                              <td style='padding: 0in 0in 0in 0in'>
                                                <p class=MsoNormal align=center
                                                  style='text-align: center; line-height: 18.0pt; mso-line-height-rule: exactly'>
                                                  <span
                                                    style='font-size: 9.0pt; font-family: "Helvetica", sans-serif; mso-fareast-font-family: "Times New Roman"; color: #99AAB5'>
                                                    ${teamaSendBy} teama.io  •  <a href="https://blog.teama.io/"> ${teamaBlog} </a>  •  <a href="https://fb.me/teama.software"> fb.com/teama.software </a> • <a href="https://teama.io/unsubcribe"> ${emailUnsubcribe} </a>
                                                    <o:p></o:p>
                                                  </span>
                                                </p>
                                              </td>
                                            </tr>
                                            <tr style='mso-yfti-irow: 1'>
                                              <td style='padding: 0in 0in 0in 0in; word-break: break-word'>
                                                <p class=MsoNormal align=center
                                                  style='text-align: center; line-height: 18.0pt; mso-line-height-rule: exactly'>
                                                  <span
                                                    style='font-size: 9.0pt; font-family: "Helvetica", sans-serif; mso-fareast-font-family: "Times New Roman"; color: #99AAB5'>
                                                    Copyright © 2019 Team A - 80 Hai Ba Trung st, District 5, Ho Chi Minh city, VN
                                                    <o:p></o:p>
                                                  </span>
                                                </p>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>`;

        Email.send({
          to: user.emails[0].address.toLowerCase(),
          from: Accounts.emailTemplates.from,
          subject: TAPi18n.__('email-invite-subject', params, lang),
          html: htmlMessage,
        });
      } catch (e) {
        throw new Meteor.Error('email-fail', e.message);
      }
      return {username: user.username, email: user.emails[0].address};
    },
  });
  Accounts.onCreateUser((options, user) => {
    const userCount = Users.find().count();
    if (userCount === 0) {
      user.isAdmin = true;
      return user;
    }

    if (user.services.oidc) {
      const email = user.services.oidc.email.toLowerCase();
      user.username = user.services.oidc.username;
      user.emails = [{ address: email, verified: true }];
      const initials = user.services.oidc.fullname.match(/\b[a-zA-Z]/g).join('').toUpperCase();
      user.profile = { initials, fullname: user.services.oidc.fullname, boardView: 'board-view-lists' };
      user.authenticationMethod = 'oauth2';

      // see if any existing user has this email address or username, otherwise create new
      const existingUser = Meteor.users.findOne({$or: [{'emails.address': email}, {'username':user.username}]});
      if (!existingUser)
        return user;

      // copy across new service info
      const service = _.keys(user.services)[0];
      existingUser.services[service] = user.services[service];
      existingUser.emails = user.emails;
      existingUser.username = user.username;
      existingUser.profile = user.profile;
      existingUser.authenticationMethod = user.authenticationMethod;

      Meteor.users.remove({_id: existingUser._id}); // remove existing record
      return existingUser;
    }

    if (options.from === 'admin') {
      user.createdThroughApi = true;
      return user;
    }

    const disableRegistration = Settings.findOne().disableRegistration;
    // If this is the first Authentication by the ldap and self registration disabled
    if (disableRegistration && options && options.ldap) {
      user.authenticationMethod = 'ldap';
      return user;
    }

    // If self registration enabled
    if (!disableRegistration) {
      return user;
    }

    if (!options || !options.profile) {
      throw new Meteor.Error('error-invitation-code-blank', 'The invitation code is required');
    }
    const invitationCode = InvitationCodes.findOne({
      code: options.profile.invitationcode,
      email: options.email,
      valid: true,
    });
    if (!invitationCode) {
      throw new Meteor.Error('error-invitation-code-not-exist', 'The invitation code doesn\'t exist');
    } else {
      user.profile = {icode: options.profile.invitationcode};
      user.profile.boardView = 'board-view-lists';

      // Deletes the invitation code after the user was created successfully.
      setTimeout(Meteor.bindEnvironment(() => {
        InvitationCodes.remove({'_id': invitationCode._id});
      }), 200);
      return user;
    }
  });
}

if (Meteor.isServer) {
  // Let mongoDB ensure username unicity
  Meteor.startup(() => {
    Users._collection._ensureIndex({
      username: 1,
    }, {unique: true});
  });

  // Each board document contains the de-normalized number of users that have
  // starred it. If the user star or unstar a board, we need to update this
  // counter.
  // We need to run this code on the server only, otherwise the incrementation
  // will be done twice.
  Users.after.update(function (userId, user, fieldNames) {
    // The `starredBoards` list is hosted on the `profile` field. If this
    // field hasn't been modificated we don't need to run this hook.
    if (!_.contains(fieldNames, 'profile'))
      return;

    // To calculate a diff of board starred ids, we get both the previous
    // and the newly board ids list
    function getStarredBoardsIds(doc) {
      return doc.profile && doc.profile.starredBoards;
    }

    const oldIds = getStarredBoardsIds(this.previous);
    const newIds = getStarredBoardsIds(user);

    // The _.difference(a, b) method returns the values from a that are not in
    // b. We use it to find deleted and newly inserted ids by using it in one
    // direction and then in the other.
    function incrementBoards(boardsIds, inc) {
      boardsIds.forEach((boardId) => {
        Boards.update(boardId, {$inc: {stars: inc}});
      });
    }

    incrementBoards(_.difference(oldIds, newIds), -1);
    incrementBoards(_.difference(newIds, oldIds), +1);
  });

  const fakeUserId = new Meteor.EnvironmentVariable();
  const getUserId = CollectionHooks.getUserId;
  CollectionHooks.getUserId = () => {
    return fakeUserId.get() || getUserId();
  };
  if (!isSandstorm) {
    Users.after.insert((userId, doc) => {
      const fakeUser = {
        extendAutoValueContext: {
          userId: doc._id,
        },
      };

      fakeUserId.withValue(doc._id, () => {
      /*
        // Insert the Welcome Board
        Boards.insert({
          title: TAPi18n.__('welcome-board'),
          permission: 'private',
        }, fakeUser, (err, boardId) => {

          Swimlanes.insert({
            title: TAPi18n.__('welcome-swimlane'),
            boardId,
            sort: 1,
          }, fakeUser);

          ['welcome-list1', 'welcome-list2'].forEach((title, titleIndex) => {
            Lists.insert({title: TAPi18n.__(title), boardId, sort: titleIndex}, fakeUser);
          });
        });
        */

        Boards.insert({
          title: TAPi18n.__('templates'),
          permission: 'private',
          type: 'template-container',
        }, fakeUser, (err, boardId) => {

          // Insert the reference to our templates board
          Users.update(fakeUserId.get(), {$set: {'profile.templatesBoardId': boardId}});

          // Insert the card templates swimlane
          Swimlanes.insert({
            title: TAPi18n.__('card-templates-swimlane'),
            boardId,
            sort: 1,
            type: 'template-container',
          }, fakeUser, (err, swimlaneId) => {

            // Insert the reference to out card templates swimlane
            Users.update(fakeUserId.get(), {$set: {'profile.cardTemplatesSwimlaneId': swimlaneId}});
          });

          // Insert the list templates swimlane
          Swimlanes.insert({
            title: TAPi18n.__('list-templates-swimlane'),
            boardId,
            sort: 2,
            type: 'template-container',
          }, fakeUser, (err, swimlaneId) => {

            // Insert the reference to out list templates swimlane
            Users.update(fakeUserId.get(), {$set: {'profile.listTemplatesSwimlaneId': swimlaneId}});
          });

          // Insert the board templates swimlane
          Swimlanes.insert({
            title: TAPi18n.__('board-templates-swimlane'),
            boardId,
            sort: 3,
            type: 'template-container',
          }, fakeUser, (err, swimlaneId) => {

            // Insert the reference to out board templates swimlane
            Users.update(fakeUserId.get(), {$set: {'profile.boardTemplatesSwimlaneId': swimlaneId}});
          });
        });
      });
    });
  }

  Users.after.insert((userId, doc) => {

    if (doc.createdThroughApi) {
      // The admin user should be able to create a user despite disabling registration because
      // it is two different things (registration and creation).
      // So, when a new user is created via the api (only admin user can do that) one must avoid
      // the disableRegistration check.
      // Issue : https://github.com/wekan/wekan/issues/1232
      // PR    : https://github.com/wekan/wekan/pull/1251
      Users.update(doc._id, {$set: {createdThroughApi: ''}});
      return;
    }

    //invite user to corresponding boards
    const disableRegistration = Settings.findOne().disableRegistration;
    // If ldap, bypass the inviation code if the self registration isn't allowed.
    // TODO : pay attention if ldap field in the user model change to another content ex : ldap field to connection_type
    if (doc.authenticationMethod !== 'ldap' && disableRegistration) {
      const invitationCode = InvitationCodes.findOne({code: doc.profile.icode, valid: true});
      if (!invitationCode) {
        throw new Meteor.Error('error-invitation-code-not-exist');
      } else {
        invitationCode.boardsToBeInvited.forEach((boardId) => {
          const board = Boards.findOne(boardId);
          board.addMember(doc._id);
        });
        if (!doc.profile) {
          doc.profile = {};
        }
        doc.profile.invitedBoards = invitationCode.boardsToBeInvited;
        Users.update(doc._id, {$set: {profile: doc.profile}});
        InvitationCodes.update(invitationCode._id, {$set: {valid: false}});
      }
    }
  });
}

// USERS REST API
if (Meteor.isServer) {
  // Middleware which checks that API is enabled.
  JsonRoutes.Middleware.use(function (req, res, next) {
    const api = req.url.search('api');
    if (api === 1 && process.env.WITH_API === 'true' || api === -1){
      return next();
    }
    else {
      res.writeHead(301, {Location: '/'});
      return res.end();
    }
  });

  /**
   * @operation get_current_user
   *
   * @summary returns the current user
   * @return_type Users
   */
  JsonRoutes.add('GET', '/api/user', function(req, res) {
    try {
      Authentication.checkLoggedIn(req.userId);
      const data = Meteor.users.findOne({ _id: req.userId});
      delete data.services;
      JsonRoutes.sendResult(res, {
        code: 200,
        data,
      });
    }
    catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  /**
   * @operation get_all_users
   *
   * @summary return all the users
   *
   * @description Only the admin user (the first user) can call the REST API.
   * @return_type [{ _id: string,
   *                 username: string}]
   */
  JsonRoutes.add('GET', '/api/users', function (req, res) {
    try {
      Authentication.checkUserId(req.userId);
      JsonRoutes.sendResult(res, {
        code: 200,
        data: Meteor.users.find({}).map(function (doc) {
          return { _id: doc._id, username: doc.username };
        }),
      });
    }
    catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  /**
   * @operation get_user
   *
   * @summary get a given user
   *
   * @description Only the admin user (the first user) can call the REST API.
   *
   * @param {string} userId the user ID
   * @return_type Users
   */
  JsonRoutes.add('GET', '/api/users/:userId', function (req, res) {
    try {
      Authentication.checkUserId(req.userId);
      const id = req.params.userId;
      JsonRoutes.sendResult(res, {
        code: 200,
        data: Meteor.users.findOne({ _id: id }),
      });
    }
    catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  /**
   * @operation edit_user
   *
   * @summary edit a given user
   *
   * @description Only the admin user (the first user) can call the REST API.
   *
   * Possible values for *action*:
   * - `takeOwnership`: The admin takes the ownership of ALL boards of the user (archived and not archived) where the user is admin on.
   * - `disableLogin`: Disable a user (the user is not allowed to login and his login tokens are purged)
   * - `enableLogin`: Enable a user
   *
   * @param {string} userId the user ID
   * @param {string} action the action
   * @return_type {_id: string,
   *               title: string}
   */
  JsonRoutes.add('PUT', '/api/users/:userId', function (req, res) {
    try {
      Authentication.checkUserId(req.userId);
      const id = req.params.userId;
      const action = req.body.action;
      let data = Meteor.users.findOne({ _id: id });
      if (data !== undefined) {
        if (action === 'takeOwnership') {
          data = Boards.find({
            'members.userId': id,
            'members.isAdmin': true,
          }).map(function(board) {
            if (board.hasMember(req.userId)) {
              board.removeMember(req.userId);
            }
            board.changeOwnership(id, req.userId);
            return {
              _id: board._id,
              title: board.title,
            };
          });
        } else {
          if ((action === 'disableLogin') && (id !== req.userId)) {
            Users.update({ _id: id }, { $set: { loginDisabled: true, 'services.resume.loginTokens': '' } });
          } else if (action === 'enableLogin') {
            Users.update({ _id: id }, { $set: { loginDisabled: '' } });
          }
          data = Meteor.users.findOne({ _id: id });
        }
      }
      JsonRoutes.sendResult(res, {
        code: 200,
        data,
      });
    }
    catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  /**
   * @operation add_board_member
   * @tag Boards
   *
   * @summary Add New Board Member with Role
   *
   * @description Only the admin user (the first user) can call the REST API.
   *
   * **Note**: see [Boards.set_board_member_permission](#set_board_member_permission)
   * to later change the permissions.
   *
   * @param {string} boardId the board ID
   * @param {string} userId the user ID
   * @param {boolean} isAdmin is the user an admin of the board
   * @param {boolean} isNoComments disable comments
   * @param {boolean} isCommentOnly only enable comments
   * @return_type {_id: string,
   *               title: string}
   */
  JsonRoutes.add('POST', '/api/boards/:boardId/members/:userId/add', function (req, res) {
    try {
      Authentication.checkUserId(req.userId);
      const userId = req.params.userId;
      const boardId = req.params.boardId;
      const action = req.body.action;
      const {isAdmin, isNoComments, isCommentOnly} = req.body;
      let data = Meteor.users.findOne({ _id: userId });
      if (data !== undefined) {
        if (action === 'add') {
          data = Boards.find({
            _id: boardId,
          }).map(function(board) {
            if (!board.hasMember(userId)) {
              board.addMember(userId);
              function isTrue(data){
                return data.toLowerCase() === 'true';
              }
              board.setMemberPermission(userId, isTrue(isAdmin), isTrue(isNoComments), isTrue(isCommentOnly), userId);
            }
            return {
              _id: board._id,
              title: board.title,
            };
          });
        }
      }
      JsonRoutes.sendResult(res, {
        code: 200,
        data: query,
      });
    }
    catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  /**
   * @operation remove_board_member
   * @tag Boards
   *
   * @summary Remove Member from Board
   *
   * @description Only the admin user (the first user) can call the REST API.
   *
   * @param {string} boardId the board ID
   * @param {string} userId the user ID
   * @param {string} action the action (needs to be `remove`)
   * @return_type {_id: string,
   *               title: string}
   */
  JsonRoutes.add('POST', '/api/boards/:boardId/members/:userId/remove', function (req, res) {
    try {
      Authentication.checkUserId(req.userId);
      const userId = req.params.userId;
      const boardId = req.params.boardId;
      const action = req.body.action;
      let data = Meteor.users.findOne({ _id: userId });
      if (data !== undefined) {
        if (action === 'remove') {
          data = Boards.find({
            _id: boardId,
          }).map(function(board) {
            if (board.hasMember(userId)) {
              board.removeMember(userId);
            }
            return {
              _id: board._id,
              title: board.title,
            };
          });
        }
      }
      JsonRoutes.sendResult(res, {
        code: 200,
        data: query,
      });
    }
    catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  /**
   * @operation new_user
   *
   * @summary Create a new user
   *
   * @description Only the admin user (the first user) can call the REST API.
   *
   * @param {string} username the new username
   * @param {string} email the email of the new user
   * @param {string} password the password of the new user
   * @return_type {_id: string}
   */
  JsonRoutes.add('POST', '/api/users/', function (req, res) {
    try {
      Authentication.checkUserId(req.userId);
      const id = Accounts.createUser({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        from: 'admin',
      });
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: id,
        },
      });
    }
    catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });

  /**
   * @operation delete_user
   *
   * @summary Delete a user
   *
   * @description Only the admin user (the first user) can call the REST API.
   *
   * @param {string} userId the ID of the user to delete
   * @return_type {_id: string}
   */
  JsonRoutes.add('DELETE', '/api/users/:userId', function (req, res) {
    try {
      Authentication.checkUserId(req.userId);
      const id = req.params.userId;
      Meteor.users.remove({ _id: id });
      JsonRoutes.sendResult(res, {
        code: 200,
        data: {
          _id: id,
        },
      });
    }
    catch (error) {
      JsonRoutes.sendResult(res, {
        code: 200,
        data: error,
      });
    }
  });
}
