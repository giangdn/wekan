Settings = new Mongo.Collection('settings');

Settings.attachSchema(new SimpleSchema({
  disableRegistration: {
    type: Boolean,
  },
  'mailServer.username': {
    type: String,
    optional: true,
  },
  'mailServer.password': {
    type: String,
    optional: true,
  },
  'mailServer.host': {
    type: String,
    optional: true,
  },
  'mailServer.port': {
    type: String,
    optional: true,
  },
  'mailServer.enableTLS': {
    type: Boolean,
    optional: true,
  },
  'mailServer.from': {
    type: String,
    optional: true,
  },
  productName: {
    type: String,
    optional: true,
  },
  customHTMLafterBodyStart: {
    type: String,
    optional: true,
  },
  customHTMLbeforeBodyEnd: {
    type: String,
    optional: true,
  },
  displayAuthenticationMethod: {
    type: Boolean,
    optional: true,
  },
  defaultAuthenticationMethod: {
    type: String,
    optional: false,
  },
  hideLogo: {
    type: Boolean,
    optional: true,
  },
  createdAt: {
    type: Date,
    denyUpdate: true,
  },
  modifiedAt: {
    type: Date,
  },
}));
Settings.helpers({
  mailUrl () {
    if (!this.mailServer.host) {
      return null;
    }
    const protocol = this.mailServer.enableTLS ? 'smtps://' : 'smtp://';
    if (!this.mailServer.username && !this.mailServer.password) {
      return `${protocol}${this.mailServer.host}:${this.mailServer.port}/`;
    }
    return `${protocol}${this.mailServer.username}:${encodeURIComponent(this.mailServer.password)}@${this.mailServer.host}:${this.mailServer.port}/`;
  },
});
Settings.allow({
  update(userId) {
    const user = Users.findOne(userId);
    return user && user.isAdmin;
  },
});

Settings.before.update((userId, doc, fieldNames, modifier) => {
  modifier.$set = modifier.$set || {};
  modifier.$set.modifiedAt = new Date();
});

if (Meteor.isServer) {
  Meteor.startup(() => {
    const setting = Settings.findOne({});
    if(!setting){
      const now = new Date();
      const domain = process.env.ROOT_URL.match(/\/\/(?:www\.)?(.*)?(?:\/)?/)[1];
      const from = `Boards Support <support@${domain}>`;
      const defaultSetting = {disableRegistration: false, mailServer: {
        username: '', password: '', host: '', port: '', enableTLS: false, from,
      }, createdAt: now, modifiedAt: now, displayAuthenticationMethod: true,
      defaultAuthenticationMethod: 'password'};
      Settings.insert(defaultSetting);
    }
    const newSetting = Settings.findOne();
    if (!process.env.MAIL_URL && newSetting.mailUrl())
      process.env.MAIL_URL = newSetting.mailUrl();
    Accounts.emailTemplates.from = process.env.MAIL_FROM ? process.env.MAIL_FROM : newSetting.mailServer.from;
  });
  Settings.after.update((userId, doc, fieldNames) => {
    // assign new values to mail-from & MAIL_URL in environment
    if (_.contains(fieldNames, 'mailServer') && doc.mailServer.host) {
      const protocol = doc.mailServer.enableTLS ? 'smtps://' : 'smtp://';
      if (!doc.mailServer.username && !doc.mailServer.password) {
        process.env.MAIL_URL = `${protocol}${doc.mailServer.host}:${doc.mailServer.port}/`;
      } else {
        process.env.MAIL_URL = `${protocol}${doc.mailServer.username}:${encodeURIComponent(doc.mailServer.password)}@${doc.mailServer.host}:${doc.mailServer.port}/`;
      }
      Accounts.emailTemplates.from = doc.mailServer.from;
    }
  });

  function getRandomNum (min, max) {
    const range = max - min;
    const rand = Math.random();
    return (min + Math.round(rand * range));
  }

  function getEnvVar(name){
    const value = process.env[name];
    if (value){
      return value;
    }
    throw new Meteor.Error(['var-not-exist', `The environment variable ${name} does not exist`]);
  }

  function sendInvitationEmail (_id){
    const icode = InvitationCodes.findOne(_id);
    const author = Users.findOne(Meteor.userId());
    try {
      const params = {
        email: icode.email,
        inviter: Users.findOne(icode.authorId).username,
        user: icode.email.split('@')[0],
        icode: icode.code,
        url: FlowRouter.url('sign-up'),
      };
      const lang = author.getLanguage();

      // load languages strings for html email
      const teamaBlog       = TAPi18n.__('email-teama-blog', {}, lang);
      const teamaMobileApp  = TAPi18n.__('email-teama-mobile-app', {}, lang);
      const teamaAppLink    = TAPi18n.__('email-teama-mobile-app-link', {}, lang);
      const teamaAppDesc    = TAPi18n.__('email-teama-mobile-app-desc', {}, lang);
      const teamaSendBy     = TAPi18n.__('email-send-by', {}, lang);
      const emailUnsubcribe = TAPi18n.__('email-unsubcribe', {}, lang);
      const emailThanks     = TAPi18n.__('email-teama-thanks', {}, lang);

      const emailHi         = TAPi18n.__('email-invite-register-hi', {user: icode.email.split('@')[0]}, lang);
      const emailMessage    = TAPi18n.__('email-invite-register-message', params, lang);

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
        to: icode.email,
        from: Accounts.emailTemplates.from,
        subject: TAPi18n.__('email-invite-register-subject', params, lang),
        html: htmlMessage,
      });
    } catch (e) {
      InvitationCodes.remove(_id);
      throw new Meteor.Error('email-fail', e.message);
    }
  }

  function isLdapEnabled() {
    return process.env.LDAP_ENABLE === 'true';
  }

  function isOauth2Enabled() {
    return process.env.OAUTH2_ENABLED === 'true';
  }

  function isCasEnabled() {
    return process.env.CAS_ENABLED === 'true';
  }

  Meteor.methods({
    sendInvitation(emails, boards) {
      check(emails, [String]);
      check(boards, [String]);

      const user = Users.findOne(Meteor.userId());
      if(!user.isAdmin){
        throw new Meteor.Error('not-allowed');
      }
      emails.forEach((email) => {
        if (email && SimpleSchema.RegEx.Email.test(email)) {
          // Checks if the email is already link to an account.
          const userExist = Users.findOne({email});
          if (userExist){
            throw new Meteor.Error('user-exist', `The user with the email ${email} has already an account.`);
          }
          // Checks if the email is already link to an invitation.
          const invitation = InvitationCodes.findOne({email});
          if (invitation){
            InvitationCodes.update(invitation, {$set : {boardsToBeInvited: boards}});
            sendInvitationEmail(invitation._id);
          }else {
            const code = getRandomNum(100000, 999999);
            InvitationCodes.insert({code, email, boardsToBeInvited: boards, createdAt: new Date(), authorId: Meteor.userId()}, function(err, _id){
              if (!err && _id) {
                sendInvitationEmail(_id);
              } else {
                throw new Meteor.Error('invitation-generated-fail', err.message);
              }
            });
          }
        }
      });
    },

    sendSMTPTestEmail() {
      if (!Meteor.userId()) {
        throw new Meteor.Error('invalid-user');
      }
      const user = Meteor.user();
      if (!user.emails && !user.emails[0] && user.emails[0].address) {
        throw new Meteor.Error('email-invalid');
      }
      this.unblock();
      const lang = user.getLanguage();
      try {
        Email.send({
          to: user.emails[0].address,
          from: Accounts.emailTemplates.from,
          subject: TAPi18n.__('email-smtp-test-subject', {lng: lang}),
          text: TAPi18n.__('email-smtp-test-text', {lng: lang}),
        });
      } catch ({message}) {
        throw new Meteor.Error('email-fail', `${TAPi18n.__('email-fail-text', {lng: lang})}: ${ message }`, message);
      }
      return {
        message: 'email-sent',
        email: user.emails[0].address,
      };
    },

    getCustomUI(){
      const setting = Settings.findOne({});
      if (!setting.productName) {
        return {
          productName: '',
        };
      } else {
        return {
          productName: `${setting.productName}`,
        };
      }
    },

    getMatomoConf(){
      return {
        address: getEnvVar('MATOMO_ADDRESS'),
        siteId: getEnvVar('MATOMO_SITE_ID'),
        doNotTrack: process.env.MATOMO_DO_NOT_TRACK || false,
        withUserName: process.env.MATOMO_WITH_USERNAME || false,
      };
    },

    _isLdapEnabled() {
      return isLdapEnabled();
    },

    _isOauth2Enabled() {
      return isOauth2Enabled();
    },

    _isCasEnabled() {
      return isCasEnabled();
    },

    // Gets all connection methods to use it in the Template
    getAuthenticationsEnabled() {
      return {
        ldap: isLdapEnabled(),
        oauth2: isOauth2Enabled(),
        cas: isCasEnabled(),
      };
    },

    getDefaultAuthenticationMethod() {
      return process.env.DEFAULT_AUTHENTICATION_METHOD;
    },
  });
}
