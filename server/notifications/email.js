// buffer each user's email text in a queue, then flush them in single email
Meteor.startup(() => {
  Notifications.subscribe('email', (user, title, description, params) => {
    // add quote to make titles easier to read in email text
    const quoteParams = _.clone(params);
    ['card', 'list', 'oldList', 'board', 'comment'].forEach((key) => {
      if (quoteParams[key]) quoteParams[key] = `"${params[key]}"`;
    });

    const text = `${params.user} ${TAPi18n.__(description, quoteParams, user.getLanguage())}\n${params.url}`;
    user.addEmailBuffer(text);

    // unlike setTimeout(func, delay, args),
    // Meteor.setTimeout(func, delay) does not accept args :-(
    // so we pass userId with closure
    const userId = user._id;
    Meteor.setTimeout(() => {
      const user = Users.findOne(userId);

      // for each user, in the timed period, only the first call will get the cached content,
      // other calls will get nothing
      const texts = user.getEmailBuffer();
      if (texts.length === 0) return;

      // merge the cached content into single email and flush
      const text = texts.join('\n\n');
      user.clearEmailBuffer();
      
    	//@giangdn change to send html mail
      const htmlMessage = `<html xmlns="http://www.w3.org/TR/REC-html40">

      	<head>
      	<meta http-equiv=Content-Type content="text/html; charset=unicode">
      	<style>
      	<!--
      	@media only screen and (min-width:480px) {
      		.mj-column-per-100, * [aria-labelledby="mj-column-per-100"] {
      			width: 100% !important;
      		}
      		.mj-column-per-30, * [aria-labelledby="mj-column-per-30"] {
      			width: 30% !important;
      		}
      		.mj-column-per-70, * [aria-labelledby="mj-column-per-70"] {
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

      	html, body, * {
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
      	p.MsoNormal, li.MsoNormal, div.MsoNormal {
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

      	a:link, span.MsoHyperlink {
      		mso-style-noshow: yes;
      		mso-style-priority: 99;
      		color: #1EB0F4;
      		mso-text-animation: none;
      		text-decoration: none;
      		text-underline: none;
      		text-decoration: none;
      		text-line-through: none;
      	}

      	a:visited, span.MsoHyperlinkFollowed {
      		mso-style-noshow: yes;
      		mso-style-priority: 99;
      		color: #1EB0F4;
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

      	p.msonormal0, li.msonormal0, div.msonormal0 {
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

      	p.readmsgbody, li.readmsgbody, div.readmsgbody {
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

      	p.externalclass, li.externalclass, div.externalclass {
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

      	<body bgcolor="#F9F9F9" lang=EN-US link="#1EB0F4" vlink="#1EB0F4"
      		style='tab-interval: .5in'>

      		<div class=WordSection1>

      			

      			<div>

      				<div align=center>

      					<table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0
      						width=640
      						style='width: 480.0pt; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
      						<tr
      							style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
      							<td style='padding: 0in 0in 0in 0in'>
      								<div>
      									<div>
      										<div align=center>
      											<table class=MsoNormalTable border=0 cellspacing=0
      												cellpadding=0 width="100%"
      												style='width: 100.0%; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
      												<tr
      													style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
      													<td valign=top style='padding: 30.0pt 0in 30.0pt 0in'>
      														<div align=center>
      															<table class=MsoNormalTable border=0 cellspacing=0
      																cellpadding=0
      																style='border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
      																<tr
      																	style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
      																	<td width=640 valign=top
      																		style='width: 480.0pt; padding: 0in 0in 0in 0in'>
      																		<table class=MsoNormalTable border=0 cellspacing=0
      																			cellpadding=0 width="100%"
      																			style='width: 100.0%; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
      																			<tr
      																				style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
      																				<td style='padding: 0in 0in 0in 0in'>
      																					<div align=center>
      																						<table class=MsoNormalTable border=0 cellspacing=0
      																							cellpadding=0
      																							style='border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
      																							<tr
      																								style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
      																								<td width=174
      																									style='width: 174px; padding: 0in 0in 0in 0in'>
      																									<p class=MsoNormal>
      																										<span
      																											style='mso-fareast-font-family: "Times New Roman"'><a
      																											href="https://work.fisys.vn/" target="_blank"><img
      																												border=0 width=174 id="_x0000_i1025"
      																												src="https://id.fisys.vn//themes/v02/assets/img/logo.gradient.png"
      																												style='border-radius:; outline: none; border-bottom-style: none; border-left-style: none; border-right-style: none; border-top-style: none; display: block; height: 38px; text-decoration: none; width: 100%'
      																												title=""></a>
      																										<o:p></o:p></span>
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
      						<span
      							style='mso-fareast-font-family: "Times New Roman"; display: none; mso-hide: all'><o:p>&nbsp;</o:p></span>
      					</p>

      					<div align=center>

      						<table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0
      							width=640
      							style='width: 480.0pt; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'
      							role=presentation>
      							<tr
      								style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
      								<td style='padding: 0in 0in 0in 0in; word-break: break-word'>
      									<div
      										style='box-shadow: 0px 1px 5px rgba(0, 0, 0, 0.1); border-radius: 4px; overflow: hidden'>
      										<div>
      											<div align=center>
      												<table class=MsoNormalTable border=0 cellspacing=0
      													cellpadding=0 width="100%"
      													style='width: 100.0%; background: white; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
      													<tr
      														style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
      														<td valign=top style='padding: 30.0pt 52.5pt 30.0pt 52.5pt'>
      															<div align=center>
      																<table class=MsoNormalTable border=0 cellspacing=0
      																	cellpadding=0
      																	style='border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
      																	<tr
      																		style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
      																		<td width=640 valign=top
      																			style='width: 480.0pt; padding: 0in 0in 0in 0in'>
      																			<table class=MsoNormalTable border=0 cellspacing=0
      																				cellpadding=0 width="100%"
      																				style='width: 100.0%; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
      																				<tr
      																					style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
      																					<td style='padding: 0in 0in 0in 0in'>
      																						<!--
      																						<h2
      																							style='line-height: 18.0pt; mso-line-height-rule: exactly'>
      																							<span
      																								style='font-size: 15.0pt; font-family: "Helvetica", sans-serif; mso-fareast-font-family: "Times New Roman"; color: #4F545C; letter-spacing: .2pt; font-weight: normal'>Xin chào <?php echo $User->Name?>,<o:p></o:p>
      																							</span>
      																						</h2>
      																						-->
      																						${text}
      																						<p
      																							style='line-height: 18.0pt; mso-line-height-rule: exactly'>
      																							<span
      																								style='font-size: 12.0pt; font-family: "Helvetica", sans-serif; color: #737F8D'>Thân ái,<br> TeamA.io - cutting edge 4.0 solutioins for your bussiness<o:p></o:p>
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

      						<table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0
      							width=640
      							style='width: 480.0pt; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
      							<tr
      								style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
      								<td style='padding: 0in 0in 0in 0in'>
      									<div>
      										<p class=MsoNormal
      											style='line-height: 15.0pt; mso-line-height-rule: exactly'>
      											<span
      												style='font-size: 1.0pt; mso-fareast-font-family: "Times New Roman"'>&nbsp;<o:p></o:p></span>
      										</p>
      									</div>
      								</td>
      							</tr>
      						</table>

      					</div>

      					<p class=MsoNormal style='background: #F9F9F9'>
      						<span
      							style='mso-fareast-font-family: "Times New Roman"; display: none; mso-hide: all'><o:p>&nbsp;</o:p></span>
      					</p>

      					<div align=center>

      						<table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0
      							width=640
      							style='width: 480.0pt; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'
      							role=presentation>
      							<tr
      								style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
      								<td style='padding: 0in 0in 0in 0in; word-break: break-word'>
      									<div
      										style='box-shadow: 0px 1px 5px rgba(0, 0, 0, 0.1); border-radius: 4px; overflow: hidden'>
      										<div align=center>
      											<table class=MsoNormalTable border=0 cellspacing=0
      												cellpadding=0 width="100%"
      												style='width: 100.0%; background: white; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
      												<tr
      													style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
      													<td valign=top style='padding: 15.0pt 15.0pt 15.0pt 15.0pt'>
      														<div align=center>
      															<table class=MsoNormalTable border=0 cellspacing=0
      																cellpadding=0
      																style='border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
      																<tr
      																	style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
      																	<td width=192 valign=top
      																		style='width: 2.0in; padding: 0in 0in 0in 0in'>
      																		<table class=MsoNormalTable border=0 cellspacing=0
      																			cellpadding=0 width="100%"
      																			style='width: 100.0%; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
      																			<tr
      																				style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
      																				<td style='padding: 15.0pt 15.0pt 15.0pt 15.0pt'>
      																					<div align=center>
      																						<table class=MsoNormalTable border=0 cellspacing=0
      																							cellpadding=0
      																							style='border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'>
      																							<tr
      																								style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
      																								<td width=152
      																									style='width: 114.0pt; padding: 0in 0in 0in 0in'>
      																									<p class=MsoNormal>
      																										<span
      																											style='mso-fareast-font-family: "Times New Roman"'><img
      																											border=0 width=152 id="_x0000_i1026"
      																											src="https://id.fisys.vn/themes/v02/assets/img/7d568d8515b90c8787a9d962a57b1b9e.png"
      																											style='border-radius:; outline: none; border-bottom-style: none; border-left-style: none; border-right-style: none; border-top-style: none; display: block; height: auto; text-decoration: none; width: 100%'
      																											title="">
      																										<o:p></o:p></span>
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
      																		<table class=MsoNormalTable border=0 cellspacing=0
      																			cellpadding=0 width="100%"
      																			style='width: 100.0%; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'
      																			role=presentation>
      																			<tr style='mso-yfti-irow: 0; mso-yfti-firstrow: yes'>
      																				<td style='padding: 15.0pt 15.0pt 0in 15.0pt'>
      																					<p class=MsoNormal
      																						style='line-height: 25.5pt; mso-line-height-rule: exactly'>
      																						<span
      																							style='font-size: 18.0pt; font-family: "Helvetica", sans-serif; mso-fareast-font-family: "Times New Roman"; color: #F39C12'>Tải TeamA Boards cho điện thoại!<o:p></o:p>
      																						</span>
      																					</p>
      																				</td>
      																			</tr>
      																			<tr style='mso-yfti-irow: 1; mso-yfti-lastrow: yes'>
      																				<td
      																					style='padding: 7.5pt 15.0pt 15.0pt 15.0pt; word-break: break-word'>
      																					<p
      																						style='line-height: 18.0pt; mso-line-height-rule: exactly'>
      																						<span
      																							style='font-size: 12.0pt; font-family: "Helvetica", sans-serif; color: #737F8D'><a
      																							href="https://apps.teama.io"><span style='color: #7289DA'>Tải ứng dụng TeamA</span></a> để sử dụng các tính năng cá nhân một cách tiện lợi.<o:p></o:p></span>
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
      						<span
      							style='mso-fareast-font-family: "Times New Roman"; display: none; mso-hide: all'><o:p>&nbsp;</o:p></span>
      					</p>

      					<div align=center>

      						<table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0
      							width=640
      							style='width: 480.0pt; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'
      							role=presentation>
      							<tr
      								style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
      								<td style='padding: 0in 0in 0in 0in; word-break: break-word'>
      									<div>
      										<div align=center>
      											<table class=MsoNormalTable border=0 cellspacing=0
      												cellpadding=0 width="100%"
      												style='width: 100.0%; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'
      												role=presentation>
      												<tr
      													style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
      													<td valign=top style='padding: 15.0pt 0in 15.0pt 0in'>
      														<div align=center>
      															<table class=MsoNormalTable border=0 cellspacing=0
      																cellpadding=0
      																style='border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'
      																role=presentation>
      																<tr
      																	style='mso-yfti-irow: 0; mso-yfti-firstrow: yes; mso-yfti-lastrow: yes'>
      																	<td width=640 valign=top
      																		style='width: 480.0pt; padding: 0in 0in 0in 0in'>
      																		<table class=MsoNormalTable border=0 cellspacing=0
      																			cellpadding=0 width="100%"
      																			style='width: 100.0%; border-collapse: collapse; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 0in 0in 0in'
      																			role=presentation>
      																			<tr style='mso-yfti-irow: 0; mso-yfti-firstrow: yes'>
      																				<td style='padding: 0in 0in 0in 0in'>
      																					<p class=MsoNormal align=center
      																						style='text-align: center; line-height: 18.0pt; mso-line-height-rule: exactly'>
      																						<span
      																							style='font-size: 9.0pt; font-family: "Helvetica", sans-serif; mso-fareast-font-family: "Times New Roman"; color: #99AAB5'>Được gửi bởi teama.io • <a
      																							href="https://blog.teama.io/">tham khảo blog của chúng tôi</a> • <a
      																							href="https://fb.me/teama.io">fb.com/teama.io</a>
      																							<o:p></o:p>
      																						</span>
      																					</p>
      																				</td>
      																			</tr>
      																			<tr style='mso-yfti-irow: 1'>
      																				<td
      																					style='padding: 0in 0in 0in 0in; word-break: break-word'>
      																					<p class=MsoNormal align=center
      																						style='text-align: center; line-height: 18.0pt; mso-line-height-rule: exactly'>
      																						<span
      																							style='font-size: 9.0pt; font-family: "Helvetica", sans-serif; mso-fareast-font-family: "Times New Roman"; color: #99AAB5'>
      																							280 An Dương Vương, phường 4, quận 5, tp. Hồ Chí Minh
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

      try {
        Email.send({
          to: user.emails[0].address.toLowerCase(),
          from: Accounts.emailTemplates.from,
          subject: TAPi18n.__('act-activity-notify', {}, user.getLanguage()),
          html: htmlMessage
        });
      } catch (e) {
        return;
      }
    }, process.env.EMAIL_NOTIFICATION_TIMEOUT || 30000);
  });
});


