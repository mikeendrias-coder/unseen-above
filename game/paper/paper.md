<!--
HOW TO EDIT THE PAPER PAGE

This is the only file to edit. The page (paper.html) is built from it.

1. Replace each line in [square brackets] with your own text. Anything in brackets that
   says "goes here", "Michael writes" or "Sample" shows on the page as a grey box, and the
   red DRAFT stamp stays on until they are all gone. Then it turns to FILED.

2. Keep the lines that start with "## ". They are the sections, and the game links to them
   (paper.html#part-3 and so on). You can reword a heading, but keep "Part I." through
   "Part V." at the start of the part headings, and keep the words TL;DR, Executive
   summary, Introduction and Conclusion, so the links keep working.

3. The line right under the title is the byline. Write anything there.

4. Normal Markdown works: *italics* (case names), **bold**, > block quotes, - lists,
   [link text](https://example.com), and ### smaller headings inside a part.

5. Footnotes: put [^1] in the text where the note mark goes, and the note itself on its
   own line anywhere below as "[^1]: text of the note". Notes are numbered in the order
   they first appear in the text, so the labels can be anything ([^ost], [^kyl]).
   A long note can go on over more lines if those lines start with two spaces.
   Citations, Bluebook style:
     [^kyl]: National Defense Authorization Act for Fiscal Year 1997, Pub. L. No. 104-201, § 1064, 110 Stat. 2422, 2653 (1996).
     [^two]: *See* G.A. Res. 41/65, supra note [^kyl], princ. IV.   (supra note [^label] becomes the right number by itself)
     [^three]: Id. art. IX.   (Id., supra and infra are put in italics for you)
   Links: paste the bare URL, or [text](https://...). They open in a new tab.
   Your own "Cite this paper" text: add a section "## Cite this paper" near the end; its first
   paragraph is the Bluebook form, the second the plain form. Without it, the page makes one.

6. Rebuild. In a terminal, from the game folder:
     node paper/build.js           just the paper (under a second)
     node paper/build.js --watch   rebuilds every time you save this file
     npm run build                 the game and the paper
   Then open dist/paper.html in a browser. The build prints how many placeholders are left.
   npm run publish puts it online next to the game (.../unseen-above/paper/).
-->

# Unseen Above: Space Law and the Power to See and Not Be Seen

Michael Endrias · Intro to Space Law · Prof. A.J. Link · Fall 2026

## TL;DR

Space law protects powerful states from being seen, not people from being watched. In 2026 the U.S. "asked" satellite companies to hide the Iran war: the public lost its view, the government kept its own, and the people photographed every day were never asked at all. That is a choice, not a gap. Article VI of the Outer Space Treaty already makes states supervise their satellite companies, and they can do it for people.

## Executive summary

In April 2026, the U.S. government "requested" that satellite companies withhold imagery of the war with Iran. The public lost its view; the government kept its own. This paper argues that the pattern is built into the law.

- **Part I.** Space law's data rules were written for the states that do the sensing. The treaties count objects, not pictures; the 1986 Remote Sensing Principles refused sensed states a veto; national licensing screens data for national security, never for the people in the frame.
- **Part II.** One state got a right not to be seen clearly: the Kyl-Bingaman Amendment caps U.S. imagery of Israel, and in practice the blur covers Palestine too. NOAA calls privacy "outside the scope of the Act." The statute's "international obligations" clause says otherwise.
- **Part III.** The quieter lever is the checkbook. The formal "shutter control" tool has never been used; contracts and "voluntary" requests did the work in Afghanistan, Ukraine, Gaza and Iran, off the record and outside the guardrails, with real First Amendment and Article 19 problems.
- **Part IV.** The people being watched get almost nothing: RF sensing is unlicensed, satellite internet makes users findable, and the Fourth Amendment offers thin protection at home and none abroad.
- **Part V.** Article VI, read with Article III and the ICCPR, already requires states to supervise orbital data for people: privacy criteria in licensing, withholds only on the record, licensing for RF sensing, and public reporting of government requests. No new treaty is needed.

## Introduction

On April 4, 2026, about five weeks into the U.S.-Israeli air campaign against Iran, Planet Labs sent its customers an email. "Due to the conflict in the Middle East," it read, "the U.S. government has requested all satellite imagery providers voluntarily implement an indefinite withhold of imagery in the designated Area of Interest."[^1] A month earlier, the same company had insisted that its first delays were "not the result of a directive or requirement from any government."[^2] Now the request had a sender.

Notice, too, who did *not* go dark. According to a Planet spokesperson, the U.S. government, "as well as some foreign governments and commercial users," still had unrestricted access to the war imagery.[^3] The public lost its view of the war. The government kept its own.

Meanwhile, the same satellites go on photographing ordinary people every day. Those people never got an email, and nothing in space law gives them a say.

This paper argues that this is not an accident. Where space law governs what satellites collect, it protects the powerful from being seen, not people from being watched. Donna Haraway had a name for the privilege at stake: "the power to see and not be seen."[^4] Powerful states hold both halves of that power, and they can lend the second half to their friends. Most sensed states, and the people below, hold neither. And it is a choice, not a gap, because the tool to fix it is already in the treaty.

This paper proceeds as follows. Part I shows that space law's data rules were written for the states that do the sensing. Part II looks at the one place where U.S. law openly grants a right not to be seen. Part III follows the quieter lever: contracts and "requests." Part IV asks what the law offers the people being watched (not much). Part V argues that Article VI of the Outer Space Treaty, read for what it already says, requires states to supervise orbital data for people and not just for themselves. A short note on the companion game, and a conclusion, follow.

## Part I. Space Law's Data Rules Are Written for Sensing States

When a satellite photographs you, whose problem is that under space law? A state's, and usually only the camera-owning state gets a real say. Treaties, soft law and national licensing all point that way. Let us review these in turn.

### A. The Treaties Count Objects, Not Pictures

To kick off, the Liability Convention defines "damage" as "loss of life, personal injury or other impairment of health; or loss of or damage to property."[^5] That is a list of things a falling object can do. A camera does none of them. Von der Dunk reports the majority view that damage "caused by an intrusion of privacy" through satellite data "should not be held compensable under the Liability Convention."[^6] The regime knows who pays when a satellite lands on a barn. It has nothing to say about what the satellite saw on the way down.

### B. The Data Rules That Exist Protect States, Thinly

The 1986 Remote Sensing Principles, space law's nearest thing to a data code, record a defeat. In COPUOS, the Soviet Union, France and much of the developing world wanted the sensed state's prior consent before imagery was shared; the United States and its allies wanted free distribution.[^7] Consent lost.[^8] The sensed state got consolation prizes: sensing must not harm "the legitimate rights and interests of the sensed State," and the sensed state may buy data on its territory "on a non-discriminatory basis and on reasonable cost terms."[^9] As von der Dunk puts it, the sensed state "has no veto to prevent it from being 'sensed.'"[^10]

Notice whose rights these are. The Principles say nothing about individuals or human rights, and "[p]rivacy aspects of VHR remote sensing data dissemination, at least, have not been considered."[^11] Even state privacy fares poorly: Lyall and Larsen weigh the claim that sensing infringes "the privacy of a state" and find "a more cogent argument" for monitoring.[^12] We can borrow Stefoudi's term for what remains: *sovereign privacy*, a privacy that belongs to governments, not people.[^13]

The rest of the toolkit runs the same way. The ITU Constitution protects the secrecy of international correspondence, then lets states hand it to their own authorities.[^14] The rare exception, the 1982 Direct Broadcasting Principles' right "to seek, receive and impart information," passed by vote over U.S. opposition.[^15]

None of this is an accident. Washington, worried that ICAO involvement would "civilianise" space and threaten plans for a spy satellite programme, persuaded ICAO's new president to keep space off the agenda.[^16]

### C. National Licensing Screens Data for the State

Domestic law finishes the job. A U.S. license issues only if the applicant will honor "any applicable international obligations and national security concerns of the United States."[^17] Other licensing states ask the same question:

- Canada may interrupt service to protect "national security, defence, foreign policy interests and/or upholding Canada's international obligations."[^18]
- Japan asks whether use "is likely to cause adverse effect on ensuring the peace and security of the international community and the national security of Japan."[^19]
- France protects "defense and foreign policy and compliance with international obligations."[^20]

Harris and Baumann find these regimes "mainly driven by national security concerns."[^21] None has a privacy test for the people in the frame.

A sensed state may buy its pictures; it cannot stop them being taken. With one exception. Since 1996, one country has held what no other sensed state has: a statutory right not to be seen clearly. Part II turns to it.

## Part II. Formal Control: A Right Not to Be Seen, for One State

Part I showed that international law refused sensed states a right not to be seen. Under the 1986 Principles, a state may image another state's territory without asking, and the sensed state gets only a chance to access the data.[^22] U.S. law then did something odd: it gave a version of that refused right to exactly one state.

### A. One sentence, one state

The Kyl-Bingaman Amendment does its work in one sentence. A U.S. agency "may issue a license for the collection or dissemination by a non-Federal entity of satellite imagery with respect to Israel" "only if such imagery is no more detailed or precise than satellite imagery of Israel that is available from commercial sources."[^23] It sets no number and defines no territory. It pegs Israel's protection to the market: U.S. firms may show Israel no more sharply than a foreign seller already does.

For over two decades, regulators read that as 2 meters. Then, in July 2020, NOAA found that imagery of Israel was "readily and consistently available from non-U.S. commercial sources at a resolution of 0.4 meters," and so it "changed the existing resolution limit of 2.0 m GSD to 0.4 m GSD."[^24] Amnon Harari, then head of space programs at Israel's Defense Ministry, told Kan public radio: "We would always prefer to be photographed at the lowest resolution possible. It's always preferable to be seen blurred, rather than precisely."[^25]

We can call this a *right to be blurred*: not a right to go unseen, but a statutory right to be seen less clearly than the technology allows. International law gave no sensed state that much. U.S. law gave it to one.

### B. Where does "Israel" end?

Consider a question the statute never answers: does "Israel" include the West Bank, Gaza, or the Golan Heights? NOAA has never said. The 2020 notice speaks only of "Israel" and the "State of Israel," and defines neither.[^26] Read literally, Section 1064 would leave room to image Palestine at full resolution. "Yet, in practice, this is not the case."[^27] As Zena Agha put it, "in practice, the KBA's restrictions apply throughout Palestine-Israel."[^28] Michael Fradley describes the limit as reaching the occupied territories and the Golan "by implicit extension."[^29] Firms round up: "if a corner of the image includes Israel, we treat that image as if KBA applies to the whole scene."[^30]

To be sure, the extension was uneven. Zerbini and Fradley found West Bank and Golan tiles that had not been degraded, and they described "multiple and often contradicting interpretations by U.S. regulators."[^31] But the unevenness is the point: the blur's reach was set by practice, by regulators who stayed silent and companies that played it safe. That is already a form of informal control, and Part III takes it up directly.

### C. Who pays, and who gets protected

Who bears the cost of the blur? Palestinians documenting demolitions, settlements, and war damage, along with the investigators, archaeologists, and journalists working beside them. Agha argues the law "is better characterized as censorship," since it "hinders the work of archaeologists, environmentalists, geographers, and humanitarians."[^32] James Walker, who interviewed human rights analysts, agrees the limit "does block some forms of VHR dependent analysis."[^33]

Now compare how the same regime treats people. The statute requires every license to make a sensed government's territorial data available to that government.[^34] In its 2020 rule, NOAA kept that condition, now an offer made "[u]pon request," over a privacy objection, because "[t]he Act requires Commerce to include this condition, so Commerce cannot lawfully omit this condition."[^35] When commenters asked NOAA to address privacy itself, the answer was short: "such concerns are outside the scope of the Act. These requests are better addressed to Congress."[^36] Put differently, the statute protects sensed governments, and the agency says it can do nothing for sensed persons.

But is that right? The statute has an opening. No license may issue unless the applicant will comply with "any applicable international obligations . . . of the United States."[^37] Licensees must also operate "to observe the international obligations of the United States."[^38] The United States is party to the ICCPR, which bars arbitrary interference with privacy and protects the freedom to seek and receive information.[^39] Of course, there are limits. The Covenant is not self-executing.[^40] And § 60122(b)(1) ties its obligations clause to § 60146, the FCC's radio frequency section.[^41] Still, neither limit compels NOAA's reading. "Outside the scope" was a choice about what "international obligations" means.

The formal rule, then, is the visible tool: written down, published, and open to comment. Part III turns to the quieter lever.

## Part III. Informal Control: Shutter Control by Checkbook

On March 11, 2026, Planet Labs told the press that its new hold on Middle East imagery "is not the result of a directive or requirement from any government. It is Planet's decision."[^42] Less than four weeks later, Planet's notice to customers told a different story: "the U.S. government has requested all satellite imagery providers voluntarily implement an indefinite withhold of imagery in the designated Area of Interest."[^43] So which was it? We can't tell. That is the problem. In recent conflicts, private gatekeeping and government "requests," not the formal legal process, decided what the public could see from orbit.

### A. The Tool Nobody Uses

On paper, there is a tool for this. NOAA's rules require higher-tier licensees to obey "limited-operations directives issued by the Secretary" that "temporarily limit data collection and/or dissemination during periods of increased concerns for national security and where necessary to meet international obligation or foreign policy interests."[^44] The trade calls this "shutter control," and it has thin but real guardrails. The Secretary of Defense or State must make the call, and that function "shall not be delegated below the Secretary or acting Secretary."[^45] Conditions "should be imposed for the smallest area and for the shortest period necessary."[^46] Of course, the agreement also says it creates "[n]o legal rights or remedies."[^47]

It has never been used: "[t]he government has never formally invoked that authority, though it has reached in that direction."[^48] Why reach, rather than invoke?

### B. The Contract Is the Lever

Because buying is easier than ordering. In October 2001, as bombs began falling on Afghanistan, the government's imagery agency bought exclusive rights to imagery from Space Imaging's Ikonos, the only commercial satellite that could image it at high resolution.[^49]

The checkbook has only grown. In 2022, the National Reconnaissance Office gave BlackSky, Maxar and Planet decade-long contracts worth billions.[^50] Maxar's alone was worth up to $3.24 billion.[^51] The military depends on these firms,[^52] but they depend on it more. Consider Ukraine. In March 2025, an NGA spokesperson said that, "[i]n accordance with the Administration's directive on support to Ukraine, NGA has temporarily suspended access to GEGD," its portal for government-bought commercial imagery.[^53] A whole country's view went dark by account setting, not legal act.

### C. Gaza and Iran

*Gaza, 2023.* NOAA said it was "not considering additional restrictions," and Maxar said it was the "primary decision maker" on whether and when to release an image.[^54] Planet told NPR it "decided to apply additional review for SkySat imagery over the conflict region."[^55] The companies, not the law, decided.

*Iran, 2026.* Planet's holds escalated from a 96-hour delay to the April 4 "indefinite withhold," retroactive to March 9.[^56] Not everyone went blind. Bloomberg reported, citing a Planet spokesperson, that "the US government, as well as some foreign governments and commercial users, still had unrestricted access to war imagery."[^57] The buyer kept the power to see and not be seen. The public lost it.

Vantor's story is murkier. In March, it said it "may implement enhanced access controls" but that these decisions were "not mandated by any government."[^58] It later told Bloomberg it had received no requests.[^59] Yet the Washington Post reported in May that Vantor and Planet "have complied with requests from the U.S. government to limit, delay, or indefinitely withhold" publication.[^60] Neither I nor the public can resolve that conflict. That is the point.

Let us call this pattern *shutter control by checkbook*. The name is not wholly new. A wire reporter called the 2001 deal "checkbook shutter control,"[^61] and Witjes and Olbrich describe the government as the industry's biggest customer and its regulator.[^62] This Part adds the legal problem.

### D. Why the Route Matters

To be sure, protecting "allied and NATO-partner personnel" may justify some limits.[^63] But international law permits only limits "provided by law and are necessary."[^64] The objection is not to limits as such. It is to limits made off the record.

For one, the checkbook skips every guardrail of the formal tool: no Secretary-level decision, no area or time limit, no record. Moreover, it dodges an old prior restraint fight. Critics warned that "[i]f shutter control is exercised in any but the most compelling circumstances, a court challenge is inevitable."[^65] A request triggers no such challenge.

Still, informal pressure has First Amendment limits. "[C]oercion, persuasion, and intimidation" can amount to censorship, and compliance under them "was not voluntary."[^66] Prior restraints bear "a heavy presumption against [their] constitutional validity."[^67] Under NRA v. Vullo, the question is whether conduct "could be reasonably understood to convey a threat of adverse government action in order to punish or suppress" speech.[^68]

Significantly, the remand sharpens the point. The Second Circuit granted qualified immunity because no case had clearly established that pressuring "third-party regulated entities into refraining from nonexpressive activity" was coercion.[^69] An imagery company withholding its own pictures is no third party. It is the speaker, because "the creation and dissemination of information are speech."[^70] A "request" from its licensor and biggest customer thus looks closer to direct coercion of a speaker than Vullo's facts did. That is an argument, not a holding. Standing is also a hurdle: Murthy demands "a substantial risk" of future restriction.[^71] And the company will not sue its biggest customer.

Finally, this is Article VI "continuing supervision" in practice.[^72] The McGill Manual agrees: "[a]uthorisation and continuing supervision by the appropriate State is required for all space activities of non-governmental entities, including those in support of military space activities."[^73] Nor, as the Dark and Quiet Skies II report puts it, can a state "circumvent a prohibition placed upon it by contracting its violative activity to a nongovernmental actor."[^74] Put differently, when the state's own interests are at stake, supervision works fast and at fine grain. It just works off the record.

But what about the people below, who want not to be seen? Part IV turns to them.

## Part IV. The Exposed: What the Law Offers the People Being Watched

Parts II and III asked what the law gives states. This Part asks the harder question: what does it give the people underneath? Short answer: space law gives them nothing; domestic law, only a little.

### A. Found, Not Photographed

Consider HawkEye 360. Its satellites do not take pictures; they find radios. The company told the SEC that the National Reconnaissance Office "is our largest customer" and that 61% of its 2025 revenue came from U.S. government work.[^75] It also told investors that its "in-orbit RF sensing activities are not currently regulated by any single U.S. regulatory agency."[^76] That is simply an accurate reading of the rules. NOAA licenses only data that "can be processed into imagery of surface features of the Earth."[^77] So in 2016, NOAA told HawkEye 360 it needed no license at all.[^78] The FCC licenses spectrum, not collection.[^79] Buyers noticed. In 2019, Frontex paid about €1.5 million for a HawkEye 360 pilot to detect radio emitters at sea.[^80]

Satellite internet does the same work from the other direction. A terminal is a radio, and the network needs to know where it is. India's May 5, 2025 conditions require records of "UT location with precise latitude / longitude" and demand real-time tracking of terminals.[^81] Ukraine's 2026 whitelist, under Cabinet Resolution No. 115, ties each civilian terminal to a national ID and a taxpayer number.[^82] And Starlink's January 15, 2026 privacy policy lets user data train AI models; the opt-out shown covers only "third-party collaborators."[^83] We can call this *location by subscription*: being online now means being findable.[^84]

Imagery is no better. Even Sergio Marchisio, chairing COPUOS's Legal Subcommittee, conceded that the Remote Sensing Principles do not "provide an adequate discipline as regards the production, use and treatment of highly sophisticated and detailed imagery," including its implications for "individual privacy."[^85]

### B. What Domestic Law Offers

For people in the United States, the Fourth Amendment offers something, though less than it seems. Consider the cases in turn:

1. *Dow Chemical.* The Court said satellite surveillance "might be constitutionally proscribed absent a warrant," but only "as the Government concedes," and only in dictum.[^86]
2. *Kyllo.* Using a device "not in general public use" to look into a home is a search.[^87] But as Justice Stevens warned in dissent, the threat "will grow, rather than recede, as the use of intrusive equipment becomes more readily available."[^88]
3. *Carpenter* and *Chatrie.* Location records are protected, "even though for only a limited time, and from a third-party tech company."[^89] But *Carpenter* calls itself "a narrow one" and sets aside "collection techniques involving foreign affairs or national security."[^90] And *Chatrie* does not decide whether the government may simply buy the data.

Then there is everyone else. "The people" protected are those "part of a national community" or with "sufficient connection" to it.[^91]

### C. Who Is Most Exposed

Space law routes every claim through a state. But as Bin Cheng observed, absent damage, other states "may not even take the trouble of raising the issue, unless they see some national interests in doing so."[^92] HawkEye 360 made the same point from the other side: there have been "no formal concerns raised by Parties to the Treaty."[^93] So the most exposed are people without a powerful state to press their claims: migrants, the stateless, the occupied, and citizens of small states. Liberia's President Tubman put it plainly in 1966: "we share the same heavens with the greatest powers. Their catastrophes are usually ours."[^94]

Is this a gap, then, or a choice? Part V argues it is a choice.

## Part V. Reading Article VI for People

So far, this paper has described a law that protects the powerful from being seen. This Part argues that the law does not have to work that way. Article VI of the Outer Space Treaty already reaches data, and read with Article III, it requires states to supervise their operators for the protection of people, not only of themselves.

### A. Three Steps

*Step one: supervision reaches data.* Article VI provides that the activities of non-governmental entities in outer space "shall require authorization and continuing supervision by the appropriate State Party."[^95] But does "activities in outer space" include what happens to the data once it lands? Bin Cheng asked a version of that question about activities, such as the terms on which data are distributed, that take place on the ground but have their effects on Earth. His answer: "the answer appears to be in the affirmative."[^96] The Remote Sensing Principles point the same way. They define "remote sensing activities" to include "processing, interpreting and disseminating the processed data,"[^97] and Principle XIV puts state responsibility for those activities "[i]n compliance with article VI."[^98] And practice confirms it. As Parts II and III showed, states supervise orbital data all the time: resolution limits, limited-operations directives, sensed-government access. The question was never whether supervision reaches data. It is whom supervision serves.

*Step two: supervision must follow international law.* Article III requires states to carry on space activities "in accordance with international law, including the Charter of the United Nations."[^99] The Charter, in turn, commits the United Nations to promote "universal respect for, and observance of, human rights," and every member "pledge[s]" to act toward that end.[^100] Article VI makes the state answerable for assuring that national activities conform to the Treaty, Article III included.[^101] Cristian van Eijk puts the point well: "Space is pay-to-play, but human rights are not."[^102]

*Step three: the obligations.* Which international law? Article 17 of the ICCPR bars "arbitrary or unlawful interference" with privacy and gives "[e]veryone . . . the right to the protection of the law against such interference."[^103] The Human Rights Committee reads that right as running against interference "whether [it] emanate[s] from State authorities or from natural or legal persons."[^104] It also says that "[t]he gathering and holding of personal information . . . whether by public authorities or private individuals or bodies, must be regulated by law."[^105] Article 19, meanwhile, protects the freedom "to seek, receive and impart information . . . regardless of frontiers."[^106] An imaging or RF-sensing satellite engages both rights at once.

### B. What Article VI Adds

Most of this would be true of any industry. Here is what is special about space. Under Article VI, as Cheng read it, a private operator's activities are "imputable to the State as if it were its own act."[^107] That matters. Ordinarily, a state's duty toward private actors is a positive one: to regulate and exercise due diligence. But if a licensee's collection counts as the state's own act, it engages the state's *negative* duty to respect privacy. Milanovic has argued that this duty to respect, unlike the duty to ensure, should be "territorially unlimited."[^108] Put differently, Article VI turns a corporate data practice into a sovereign one.

This also answers Frans von der Dunk, who calls privacy in remote sensing "very much a national matter," something states may address through licensing if they choose.[^109] But once Steps one through three are in place, "may" becomes "must," at least for people within the licensing state's jurisdiction.

### C. What Is New Here

To be sure, others have tied space law to privacy. Saboorian proposes new international data protection standards for satellite communications operators, built by blending the GDPR with the space treaties.[^110] Ferreira-Snyman asks how human rights apply to people living in space.[^111] Freeland and Ireland-Piper, and Macchi, focus on corporate accountability, and both look mainly to new bodies or new due diligence laws.[^112] The closest work applies Article VI supervision to orbital data centers and asks whether privacy law reaches data processed in orbit.[^113] This paper differs in three ways: it argues from current law, not proposals; it covers imagery and RF sensing; and it protects people on Earth.

### D. Objections and Responses

*Objection one: the Principles do not cover this.* They are limited to "improving natural resources management, land use and the protection of the environment,"[^114] and Lyall and Larsen say that reading in military sensing "would strain credulity."[^115] *Response:* Fair. That is why Step one rests on Cheng's reading of Article VI, with the Principles only as support. Cheng's reading is contested. Stotler notes that Schmeichel's rival reading appears to follow the Vienna Convention more closely, and he suggests states may prefer it as militaries lean on commercial satellites.[^116] But Stotler also concedes that Cheng's view "has been roundly endorsed" and that "Cheng's interpretation has won the day."[^117] And his own thesis cuts my way: if interpretation is creation, then choosing to read supervision as protecting only states is a choice, too.

*Objection two: privacy limits are limits on information.* *Response:* Yes, and that is why one test governs both. Article 19 allows restrictions only "as are provided by law and are necessary," including "[f]or respect of the rights or reputations of others."[^118] Privacy rules that pass that test are lawful. Informal withholds by phone call, as in Part III, are not.

*Objection three: the United States reads the ICCPR as territorial.* It does, and the Committee "regrets" that position.[^119] The Committee's own test reaches "anyone within the power or effective control" of a state.[^120] *Response:* The claim holds, at a minimum, for people on U.S. territory. Beyond that, the gap is part of the finding: the people abroad who are most watched are the ones the sensing state says it owes nothing.

*Objection four: the ICCPR is not self-executing.* The 1992 declaration says so.[^121] Montgomery makes the same move for Article VI.[^122] *Response:* Goehring answers this directly. A non-self-executing treaty is still binding; it is simply "'addressed to' the political branches rather than the courts."[^123] So the duty runs to Congress and NOAA. And NOAA already has the hook: no license issues unless the Secretary finds in writing that the applicant will comply with "any applicable international obligations."[^124] Privacy is not "outside the scope of the Act."[^125] It is in the statute's own words.

*Objection five: states spy on each other all the time.* *Response:* They do, and international law largely tolerates it.[^126] But that is a rule between states. Licensing a company to sell imagery of people is not espionage. It is commerce, supervised by the state.

### E. What Supervision for People Would Require

If this reading is right, Article VI requires at least four things:

1. **Privacy and public-access criteria in licensing**, alongside the national security criteria already there.
2. **Withholds only through the formal process**, on the record, so they can be tested under Article 19(3).
3. **Authorization for RF sensing**, which, as one operator admits, is "not currently regulated by any single U.S. regulatory agency."[^127]
4. **Public reporting of government requests to operators**, so the supervisor is also supervised.

None of this needs a new treaty. It needs a state that reads the old one for people.

## A Note on the Companion Game

This paper has a companion: *Unseen Above*, a short pixel-art browser game.[^128] The player switches between two roles. In one, you are a girl on a dying Earth, sneaking through a decaying mansion past cameras, sensors and a laser that seems to come from the side rather than from above. In the other, you are a satellite back end, solving tidy routing and sorting puzzles. You can guess the turn: the puzzles were aiming the strikes at her, and the whole thing is a TV show watched by wealthy people on the Moon, who stay unseen until the end.

Why a game? Because the argument is about *positions*, and a game can put you in both. The player is the watcher and the watched at once. The paperwork-like puzzles are Part III's contracts and "requests." The sourceless laser is informal control that leaves no record. The glasses that reveal the sensors, then crack, are the public losing its view of the powerful while staying visible to them. And the viewers on the Moon are the thesis itself.

This method comes from the course, too. Ingrid LaFleur describes Afrofuturism as a way to "craft decolonized destinies" through "speculative modalities such as science fiction, surrealism, magical realism, and horror."[^129] She also warns that satellites are crowding out the North Star that guided Harriet Tubman: "We will soon no longer be able to map our liberation in the skies."[^130] Games, for their part, let players test ideas of justice from the inside rather than read about them.[^131]

## Conclusion

Space law already decides who sees and who is seen. Powerful states hold both powers and lend the second to allies. Most sensed states, and the people below, hold neither. The formal rules (Part I), the one statutory carve-out (Part II), the quiet contracts (Part III) and the thin protections for people (Part IV) all point the same way.

Of course, none of this is permanent. Article VI already requires states to supervise what their companies do in orbit, and states already do it, constantly, whenever their own interests are on the line (Part V). The question is only who that supervision serves. Susan Marks, quoted by Ntina Tzouvala, describes a familiar pattern in international law: "Those who benefit from current arrangements remain comfortably out of view."[^132] In orbit, that is not a metaphor. It is a licensing condition.

And the stakes are growing. Communications are already moving into orbit through constellations like Starlink, and companies are now proposing data centers in space.[^133] Unless supervision changes, the same allocation will follow the data up there. The people below will be seen more clearly than ever, and the people watching will stay out of view.


## Bibliography

### Cases
- Bantam Books, Inc. v. Sullivan, 372 U.S. 58 (1963).
- Carpenter v. United States, 585 U.S. 296 (2018).
- Chatrie v. United States, 609 U.S. 605 (2026).
- Dow Chem. Co. v. United States, 476 U.S. 227 (1986).
- Kyllo v. United States, 533 U.S. 27 (2001).
- Murthy v. Missouri, 603 U.S. 43 (2024).
- Nat'l Rifle Ass'n of Am. v. Vullo, 602 U.S. 175 (2024).
- Nat'l Rifle Ass'n of Am. v. Vullo, 144 F.4th 376 (2d Cir. 2025).
- Sorrell v. IMS Health Inc., 564 U.S. 552 (2011).
- Sosa v. Alvarez-Machain, 542 U.S. 692 (2004).
- United States v. Verdugo-Urquidez, 494 U.S. 259 (1990).

### Treaties and International Materials
- Constitution of the International Telecommunication Union, Dec. 22, 1992, S. Treaty Doc. No. 104-34, 1825 U.N.T.S. 331.
- Convention on International Liability for Damage Caused by Space Objects, Mar. 29, 1972, 24 U.S.T. 2389, 961 U.N.T.S. 187.
- G.A. Res. 37/92, Principles Governing the Use by States of Artificial Earth Satellites for International Direct Television Broadcasting (Dec. 10, 1982).
- G.A. Res. 41/65, Principles Relating to Remote Sensing of the Earth from Outer Space (Dec. 3, 1986).
- International Covenant on Civil and Political Rights, Dec. 16, 1966, 999 U.N.T.S. 171.
- McGill Manual on International Law Applicable to Military Uses of Outer Space (Ram S. Jakhu & Steven Freeland eds., 2022).
- Treaty on Principles Governing the Activities of States in the Exploration and Use of Outer Space, Including the Moon and Other Celestial Bodies, Jan. 27, 1967, 18 U.S.T. 2410, 610 U.N.T.S. 205.
- U.N. Charter arts. 55, 56.
- U.N. Hum. Rts. Comm., Concluding Observations on the Fourth Periodic Report of the United States of America, U.N. Doc. CCPR/C/USA/CO/4 (Apr. 23, 2014).
- U.N. Hum. Rts. Comm., General Comment No. 16: Article 17 (Right to Privacy) (Apr. 8, 1988), *reprinted in* Compilation of General Comments and General Recommendations Adopted by Human Rights Treaty Bodies, U.N. Doc. HRI/GEN/1/Rev.1, at 21 (1994).
- U.N. Hum. Rts. Comm., General Comment No. 31: The Nature of the General Legal Obligation Imposed on States Parties to the Covenant, U.N. Doc. CCPR/C/21/Rev.1/Add.13 (May 26, 2004).
- U.N. Off. for Outer Space Affs., Dark and Quiet Skies II for Science and Society (Connie Walker & Piero Benvenuti eds., 2022).
- U.S. Reservations, Declarations, and Understandings, International Covenant on Civil and Political Rights, 138 Cong. Rec. S4781-01 (daily ed. Apr. 2, 1992).

### Statutes and Regulations
- 51 U.S.C. §§ 60121, 60122, 60146.
- 15 C.F.R. pt. 960 (2025).
- National Defense Authorization Act for Fiscal Year 1997, Pub. L. No. 104-201, § 1064, 110 Stat. 2422, 2653 (1996) (codified at 51 U.S.C. § 60121 note).
- Licensing of Private Land Remote-Sensing Space Systems, 65 Fed. Reg. 46,822 (July 31, 2000).
- Licensing of Private Remote Sensing Space Systems, 85 Fed. Reg. 30,790 (May 20, 2020).
- Notice of Findings Regarding Commercial Availability of Non-U.S. Satellite Imagery With Respect to Israel, 85 Fed. Reg. 44,059 (July 21, 2020).

### Books, Articles and Reports
- Philippe Achilleas, *French Remote Sensing Law*, 34 J. Space L. 1 (2008).
- Zena Agha, Maps, Technology, and Decolonial Spatial Practices in Palestine (Al-Shabaka Pol'y Brief, Jan. 2020).
- Derek E. Bambauer, *The Jawboning Cases End with a Bang Disguised by a Whimper*, 2023–2024 Cato Sup. Ct. Rev. 157 (2024).
- Elena Carpanelli & Brendan Cohen, *Interpreting "Damage" Caused by Space Objects Under the 1972 Liability Convention*, 56 Proc. Int'l Inst. Space L. (2013).
- R. Chakraborty, *Article VI and Orbital Data Centres: Supervisory Synchronization*, Air & Space L. (forthcoming 2026).
- Bin Cheng, *Article VI of the 1967 Space Treaty Revisited: "International Responsibility," "National Activities," and "The Appropriate State,"* 26 J. Space L. 7 (1998).
- Lauren E. Diaz & Vicenç Feliú, Governing Orbital Data Centers in the New Space Race (Aug. 26, 2026) (unpublished manuscript), https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7343538.
- Heather A. Harrison Dinniss, *Cyber Operations in Outer Space*, *in* Outer Space Law: Legal Policy and Practice 461 (Yanal Abul Failat & Anél Ferreira-Snyman eds., 2d ed. 2022).
- Cristian van Eijk, *The Exclusive Making of Space Law*, 38 Leiden J. Int'l L. 84 (2025).
- Cristian van Eijk, *Unstealing the Sky: Third World Equity in the Orbital Commons*, 47 Air & Space L. 25 (2022).
- Anél Ferreira-Snyman, *Article VI of the Outer Space Treaty: State Responsibility as a Means to Ensure the Protection of Human Rights by Private Companies in Outer Space Settlements*, 29 PER/PELJ (2026).
- Anél Ferreira-Snyman & Gerrit Ferreira, *The Application of International Human Rights Instruments in Outer Space Settlements: Today's Science Fiction, Tomorrow's Reality*, 22 PER/PELJ 1 (2019).
- Steven Freeland & Danielle Ireland-Piper, *Space Law, Human Rights and Corporate Accountability*, 26 UCLA J. Int'l L. & Foreign Aff. 1 (2022).
- Ann M. Florini & Yahya Dehqanzada, *Commercial Satellite Imagery Comes of Age*, 16 Issues Sci. & Tech. 45 (1999).
- John S. Goehring, *Properly Speaking, the United States Does Have an International Obligation to Authorize and Supervise Commercial Space Activity*, 78 A.F. L. Rev. 101 (2018).
- John S. Goehring, *U.S. Commercial Space Regulation: The Rule of Three*, 13 J. Nat'l Sec. L. & Pol'y 337 (2023).
- Donna Haraway, *Situated Knowledges: The Science Question in Feminism and the Privilege of Partial Perspective*, 14 Feminist Stud. 575 (1988).
- Ray Harris & Ingo Baumann, *Satellite Earth Observation and National Data Regulation*, 56 Space Pol'y 101422 (2021).
- Danielle Ireland-Piper & Steven Freeland, *Human Rights and Space*, 9 Groningen J. Int'l L. 101 (2021).
- Ram Jakhu, *International Law Governing the Acquisition and Dissemination of Satellite Imagery*, 29 J. Space L. 65 (2003).
- Blake Knight, *Stakeout from Space: Fourth Amendment Concerns Resulting from the Onset of Satellite Video*, 41 J. Space L. 231 (2017).
- Ingrid LaFleur, *Sacred Space: Decolonization through the Afrofuture*, *in* Reclaiming Space ch. 13 (2023).
- Francis Lyall & Paul B. Larsen, Space Law: A Treatise (2d ed. 2018).
- Chiara Macchi, *Business, Human Rights and International Space Law: Filling the Gaps of Corporate Accountability in the 'New Space'*, *in* Regulation of Outer Space: International Space Law and the State 50 (C. Cinelli ed., 2024).
- Sergio Marchisio, *The Evolutionary Stages of the Legal Subcommittee of the United Nations Committee on the Peaceful Uses of Outer Space (COPUOS)*, 31 J. Space L. 219 (2005).
- Robert P. Merges & Glenn H. Reynolds, *News Media Satellites and the First Amendment*, 3 High Tech. L.J. 1 (1988).
- Marko Milanovic, *Human Rights Treaties and Foreign Surveillance: Privacy in the Digital Age*, 56 Harv. Int'l L.J. 81 (2015).
- Craig John Newbery-Jones, *Answering the Call of Duty: The Phenomenology of Justice in Twenty-First-Century Video Games*, 9 Law & Human. 78 (2015).
- *On-Orbit Data Processing: Application of Data Privacy Laws Beyond Earth*, 51 Air & Space L. (2026).
- Xiran Ren & Qun Zhang, Governing the Ungoverned: Data Localization and the Globalization of Satellite IoT Constellations (2026) (unpublished manuscript) (SSRN).
- Amir Saboorian, Comment, *A Brave New World: Using the Outer Space Treaty to Design International Data Protection Standards for Low-Earth Orbit Satellite Operators*, 84 J. Air L. & Com. 575 (2019).
- George E. Seay III, *Remote Sensing: The Media, the Military, and the National Security Establishment*, 59 J. Air L. & Com. 239 (1993).
- Dimitra Stefoudi, *Sovereign Privacy and the Evolution of Earth Observation Technology*, 63 Proc. Int'l Inst. Space L. (2020).
- Charles Stotler, *Interpretation as Creation: Article VI of the Outer Space Treaty*, 26 Chi. J. Int'l L. 131 (2025).
- Ntina Tzouvala, Capitalism as Civilisation: A History of International Law (2020).
- Frans G. von der Dunk, *Outer Space Law Principles and Privacy*, *in* Evidence from Earth Observation Satellites: Emerging Legal Issues 243 (Denise Leung & Ray Purdy eds., 2013).
- Frans G. von der Dunk, *Scoping National Space Law: The True Meaning of "National Activities in Outer Space" of Article VI of the Outer Space Treaty*, 62 Proc. Int'l Inst. Space L. 227 (2019).
- Frans von der Dunk, *United Nations Principles on Remote Sensing and the User*, *in* Earth Observation Data Policy and Europe 29 (Ray Harris ed., 2002).
- James Robin Walker, Grounding the View from Nowhere: The Role of Remote Sensing Technology in International Human Rights Practice (2021) (Ph.D. dissertation, University of California, Los Angeles).
- Nina Witjes & Philipp Olbrich, *A Fragile Transparency: Satellite Imagery Analysis, Non-State Actors, and Visual Representations of Security*, 44 Sci. & Pub. Pol'y 524 (2017).
- Andrea Zerbini & Michael Fradley, *Higher Resolution Satellite Imagery of Israel and Palestine: Re-assessing the Kyl-Bingaman Amendment*, 44-45 Space Pol'y 14 (2018).

### News, Company Filings and Other Sources
- Agence France-Presse, *Leading Satellite Firm to Hold Back Gulf State Images*, Al-Monitor (Mar. 2026), https://www.al-monitor.com/originals/2026/03/leading-satellite-firm-hold-back-gulf-state-images.
- Agence France-Presse, *US Satellite Imagery Firm Announces Blackout on Middle East War Pics*, Arab News (Apr. 4, 2026), https://www.arabnews.com/node/2638797/world.
- Zena Agha, *Satellite Imagery and the Palestine-Israel Exception*, Al-Shabaka (Aug. 29, 2018), https://al-shabaka.org/commentaries/satellite-imagery-and-the-palestine-israel-exception/.
- Bill Chappell, *The U.S. Has Special Rules for Satellites over One Country: Israel*, NPR (Nov. 16, 2023), https://www.npr.org/2023/11/16/1212889717/satellite-images-us-israel-gaza.
- Audrey Decker, *US Says It Won't Tell Space-Imagery Companies to Stop Showing Gaza Photos*, Defense One (Nov. 8, 2023), https://www.defenseone.com/technology/2023/11/us-says-it-wont-tell-space-imagery-companies-stop-showing-gaza-photos/391851/.
- *DOD Won't Release Sat Pix Until Jan. 5*, United Press Int'l (Nov. 7, 2001), https://www.upi.com/Defense-News/2001/11/07/DOD-wont-release-sat-pix-until-Jan-5/84151005153639/.
- Michael Endrias, *Unseen Above* (2026) (browser game), https://mikiend.itch.io/unseen-above.
- Jacqueline Feldscher, *Limits on Collecting Satellite Imagery over Israel Continue*, Payload (Oct. 11, 2023), https://payloadspace.com/limits-on-collecting-satellite-imagery-over-israel-continue/.
- Michael Fradley, *EAMENA Leads Reform on Satellite Imagery Restrictions in the Levant*, EAMENA (June 30, 2020), https://eamena.org/node/1298636.
- *Govt Mandates Legal Interception of Satcom Services, Bars Data Routing Outside Country*, ThePrint (PTI) (May 5, 2025), https://theprint.in/economy/govt-mandates-legal-interception-of-satcom-services-bars-data-routing-outside-country/2616374.
- HawkEye 360, Inc., Registration Statement (Form S-1) (Apr. 10, 2026), https://www.sec.gov/Archives/edgar/data/1750704/000162828026024593/hawkeye360-sx1.htm.
- Pamela Hess, *DOD Locks Up Commercial Satellite Pix*, United Press Int'l (Oct. 12, 2001), https://www.globalsecurity.org/org/news/2001/011012-attack05.htm.
- Evan Hill et al., *Iran Has Hit Far More U.S. Military Assets Than Reported, Satellite Images Show*, Wash. Post (May 6, 2026), https://www.washingtonpost.com/investigations/2026/05/06/iran-us-bases-satellite-images/.
- Theresa Hitchens, *NGA Suspends Ukraine's Access to Commercial Satellite Imagery*, Breaking Defense (Mar. 7, 2025), https://breakingdefense.com/2025/03/nga-suspends-ukraines-access-to-commercial-satellite-imagery/.
- David Jeans & Joey Roulette, *Musk's Starlink Updates Privacy Policy to Allow Consumer Data to Train AI*, Reuters (Jan. 31, 2026), https://www.thejakartapost.com/business/2026/01/31/musks-starlink-updates-privacy-policy-to-allow-consumer-data-to-train-ai.html.
- Krishna Karra, *Where Did the Middle East Go? Satellite Imaging in the Fog of War*, Bloomberg (2026), https://www.bloomberg.com/graphics/2026-satellite-imagery-restrictions-iran/.
- John J. Lumpkin, *Military Buys Exclusive Rights to Commercial Satellite Pictures of War Zone*, Associated Press (Oct. 15, 2001), https://sgp.fas.org/news/2001/10/ap101501.html.
- Maxar Techs. Inc., Current Report (Form 8-K) (May 25, 2022), https://www.sec.gov/Archives/edgar/data/1121142/000155837022009332/maxr-20220525x8k.htm.
- Ministry of Defence of Ukraine, *Countering Russian Drones: How to Complete Starlink Verification to Operate Terminals in Ukraine* (Feb. 2, 2026), https://mod.gov.ua/en/news/countering-russian-drones-how-to-complete-starlink-verification-to-operate-terminals-in-ukraine.
- Alex Pasternack, *Blind Spots*, Colum. Journalism Rev. (May 11, 2026), https://www.cjr.org/feature/blind-spots-satellite-osint-open-source-middle-east-iran-blackout-planet-labs-vantor-maxar.php.
- Press Release, Nat'l Reconnaissance Off., NRO Announces Largest Award of Commercial Imagery Contracts (May 25, 2022), https://www.nro.gov/Portals/65/documents/news/press/2022/press_release_05-22.pdf.
- Privacy Int'l, *Space: The Final Frontier of Europe's Migrant Surveillance* (July 26, 2021), https://privacyinternational.org/news-analysis/4601/space-final-frontier-europes-migrant-surveillance.
- Aprajita Rana, Anubhav Das & Adishree Singh, *Update: Security Conditions under the GMPCS License*, AZB & Partners (May 29, 2025), https://www.azbpartners.com/bank/update-security-conditions-under-the-gmpcs-license/.
- Reuters, *Israel Feels Exposed as U.S. Drops Satellite-Imaging Cap*, Algemeiner (July 6, 2020), https://www.algemeiner.com/2020/07/06/israel-feels-exposed-as-us-drops-satellite-imaging-cap/.
- Ismail Shakil, *Satellite Firm Planet Labs to Indefinitely Withhold Iran War Images*, Reuters (Apr. 4, 2026), *reprinted in* Jerusalem Post (Apr. 5, 2026), https://jpost.com/defense-and-tech/article-892060.
- Maegan Vazquez, *Satellite Companies Restrict Access to Middle East Imagery amid Iran War*, Wash. Post (Mar. 11, 2026), https://www.washingtonpost.com/national-security/2026/03/11/satellite-images-middle-east-iran/.

[^1]: Alex Pasternack, *Blind Spots*, Colum. Journalism Rev. (May 11, 2026), https://www.cjr.org/feature/blind-spots-satellite-osint-open-source-middle-east-iran-blackout-planet-labs-vantor-maxar.php (quoting Planet's Apr. 4, 2026 customer notice); Ismail Shakil, *Satellite Firm Planet Labs to Indefinitely Withhold Iran War Images*, Reuters (Apr. 4, 2026), *reprinted in* Jerusalem Post (Apr. 5, 2026), https://jpost.com/defense-and-tech/article-892060.
[^2]: Maegan Vazquez, *Satellite Companies Restrict Access to Middle East Imagery amid Iran War*, Wash. Post (Mar. 11, 2026), *reprinted in* Spokesman-Review (Mar. 12, 2026), https://www.spokesman.com/stories/2026/mar/12/satellite-companies-restrict-access-to-middle-east (quoting a Planet statement).
[^3]: Krishna Karra, *Where Did the Middle East Go? Satellite Imaging in the Fog of War*, Bloomberg (2026), https://www.bloomberg.com/graphics/2026-satellite-imagery-restrictions-iran/ (reporting a Planet spokesperson's statement).
[^4]: Donna Haraway, *Situated Knowledges: The Science Question in Feminism and the Privilege of Partial Perspective*, 14 Feminist Stud. 575, 581 (1988).
[^5]: Convention on International Liability for Damage Caused by Space Objects art. I(a), Mar. 29, 1972, 24 U.S.T. 2389, 961 U.N.T.S. 187.
[^6]: Frans G. von der Dunk, *Outer Space Law Principles and Privacy*, *in* Evidence from Earth Observation Satellites: Emerging Legal Issues 243 (Denise Leung & Ray Purdy eds., 2013); *see generally* Elena Carpanelli & Brendan Cohen, *Interpreting "Damage" Caused by Space Objects Under the 1972 Liability Convention*, 56 Proc. Int'l Inst. Space L. (2013) (on whether "damage" reaches harm to personality or privacy).
[^7]: Ram Jakhu, International Law Governing the Acquisition and Dissemination of Satellite Imagery, 29 J. Space L. 65, 78 (2003).
[^8]: Id. at 79.
[^9]: G.A. Res. 41/65, Principles Relating to Remote Sensing of the Earth from Outer Space, princs. IV, XII (Dec. 3, 1986).
[^10]: Frans von der Dunk, United Nations Principles on Remote Sensing and the User, in Earth Observation Data Policy and Europe 29, 33 (Ray Harris ed., 2002).
[^11]: Id. at 31.
[^12]: Francis Lyall & Paul B. Larsen, Space Law: A Treatise 467 (2d ed. 2018).
[^13]: See generally Dimitra Stefoudi, Sovereign Privacy and the Evolution of Earth Observation Technology, 63 Proc. Int'l Inst. Space L. (2020).
[^14]: Constitution of the International Telecommunication Union art. 37, Dec. 22, 1992, S. Treaty Doc. No. 104-34, 1825 U.N.T.S. 331.
[^15]: G.A. Res. 37/92, Principles Governing the Use by States of Artificial Earth Satellites for International Direct Television Broadcasting, princ. A(1) (Dec. 10, 1982).
[^16]: Cristian van Eijk, *The Exclusive Making of Space Law*, 38 Leiden J. Int'l L. 84 (2025) (assigned in draft as "Globalwashing the Commons").
[^17]: 51 U.S.C. § 60121(b)(1).
[^18]: Ray Harris & Ingo Baumann, Satellite Earth Observation and National Data Regulation, 56 Space Pol'y 101422 (2021) (author manuscript at 3).
[^19]: Id. (author manuscript at 9).
[^20]: Philippe Achilleas, French Remote Sensing Law, 34 J. Space L. 1, 8 (2008).
[^21]: Harris & Baumann, supra (author manuscript at 14) (discussing Canada, Germany, Japan and the United States).
[^22]: Principles Relating to Remote Sensing of the Earth from Outer Space, G.A. Res. 41/65, princ. XII (Dec. 3, 1986).
[^23]: National Defense Authorization Act for Fiscal Year 1997, Pub. L. No. 104-201, div. A, tit. X, § 1064(a), 110 Stat. 2422, 2653 (1996) (codified at 51 U.S.C. § 60121 note).
[^24]: Notice of Findings Regarding Commercial Availability of Non-U.S. Satellite Imagery With Respect to Israel, 85 Fed. Reg. 44,059, 44,059 (July 21, 2020).
[^25]: Reuters, *Israel Feels Exposed as U.S. Drops Satellite-Imaging Cap*, Algemeiner (July 6, 2020), https://www.algemeiner.com/2020/07/06/israel-feels-exposed-as-us-drops-satellite-imaging-cap/.
[^26]: *Id.*
[^27]: Andrea Zerbini & Michael Fradley, *Higher Resolution Satellite Imagery of Israel and Palestine: Re-assessing the Kyl-Bingaman Amendment*, 44-45 Space Pol'y 14 (2018) (accepted manuscript at 6).
[^28]: Zena Agha, *Satellite Imagery and the Palestine-Israel Exception*, Al-Shabaka (Aug. 29, 2018), https://al-shabaka.org/commentaries/satellite-imagery-and-the-palestine-israel-exception/.
[^29]: Michael Fradley, *EAMENA Leads Reform on Satellite Imagery Restrictions in the Levant*, EAMENA (June 30, 2020), https://eamena.org/node/1298636.
[^30]: Jacqueline Feldscher, *Limits on Collecting Satellite Imagery over Israel Continue*, Payload (Oct. 11, 2023), https://payloadspace.com/limits-on-collecting-satellite-imagery-over-israel-continue/ (quoting Joe Morrison of Umbra).
[^31]: Zerbini & Fradley, *supra* (accepted manuscript at 5, 17).
[^32]: Zena Agha, Maps, Technology, and Decolonial Spatial Practices in Palestine 6 (Al-Shabaka Pol'y Brief, Jan. 2020).
[^33]: James Robin Walker, Grounding the View from Nowhere: The Role of Remote Sensing Technology in International Human Rights Practice 42 (2021) (Ph.D. dissertation, University of California, Los Angeles).
[^34]: 51 U.S.C. § 60122(b)(2).
[^35]: Licensing of Private Remote Sensing Space Systems, 85 Fed. Reg. 30,790, 30,799 (May 20, 2020); 15 C.F.R. § 960.8(c).
[^36]: 85 Fed. Reg. at 30,802.
[^37]: 51 U.S.C. § 60121(b)(1).
[^38]: *Id.* § 60122(b)(1).
[^39]: International Covenant on Civil and Political Rights arts. 17, 19, Dec. 16, 1966, 999 U.N.T.S. 171.
[^40]: Sosa v. Alvarez-Machain, 542 U.S. 692, 734-35 (2004).
[^41]: 51 U.S.C. §§ 60122(b)(1), 60146.
[^42]: Maegan Vazquez, Satellite Companies Restrict Access to Middle East Imagery amid Iran War, Wash. Post (Mar. 11, 2026), https://www.washingtonpost.com/national-security/2026/03/11/satellite-images-middle-east-iran/.
[^43]: The notice has not been made public. It is quoted in Alex Pasternack, Blind Spots, Colum. Journalism Rev. (May 11, 2026), https://www.cjr.org/feature/blind-spots-satellite-osint-open-source-middle-east-iran-blackout-planet-labs-vantor-maxar.php, and Ismail Shakil, Satellite Firm Planet Labs to Indefinitely Withhold Iran War Images, Reuters (Apr. 4, 2026), https://jpost.com/defense-and-tech/article-892060.
[^44]: 15 C.F.R. § 960.9(a) (2025); see also id. § 960.10(a)(1) (same, but "international obligations").
[^45]: Licensing of Private Remote Sensing Space Systems, 85 Fed. Reg. 30,790, 30,815 (May 20, 2020) (codified at 15 C.F.R. pt. 960, app. D, § IV(D)(3)); see id. § IV(D)(4).
[^46]: Id. § IV(D)(2).
[^47]: Id. § IV(F).
[^48]: Pasternack, supra.
[^49]: Pamela Hess, DOD Locks Up Commercial Satellite Pix, United Press Int'l (Oct. 12, 2001), https://www.globalsecurity.org/org/news/2001/011012-attack05.htm; John J. Lumpkin, Military Buys Exclusive Rights to Commercial Satellite Pictures of War Zone, Associated Press (Oct. 15, 2001), https://sgp.fas.org/news/2001/10/ap101501.html; Pasternack, supra.
[^50]: Press Release, Nat'l Reconnaissance Off., NRO Announces Largest Award of Commercial Imagery Contracts (May 25, 2022), https://www.nro.gov/Portals/65/documents/news/press/2022/press_release_05-22.pdf.
[^51]: Maxar Techs. Inc., Current Report (Form 8-K) (May 25, 2022), https://www.sec.gov/Archives/edgar/data/1121142/000155837022009332/maxr-20220525x8k.htm.
[^52]: Francis Lyall & Paul B. Larsen, Space Law: A Treatise ch. 16, at 475 (2d ed. 2018).
[^53]: Theresa Hitchens, NGA Suspends Ukraine's Access to Commercial Satellite Imagery, Breaking Defense (Mar. 7, 2025), https://breakingdefense.com/2025/03/nga-suspends-ukraines-access-to-commercial-satellite-imagery/.
[^54]: Audrey Decker, US Says It Won't Tell Space-Imagery Companies to Stop Showing Gaza Photos, Defense One (Nov. 8, 2023), https://www.defenseone.com/technology/2023/11/us-says-it-wont-tell-space-imagery-companies-stop-showing-gaza-photos/391851/.
[^55]: Bill Chappell, The U.S. Has Special Rules for Satellites over One Country: Israel, NPR (Nov. 16, 2023), https://www.npr.org/2023/11/16/1212889717/satellite-images-us-israel-gaza.
[^56]: Leading Satellite Firm to Hold Back Gulf State Images, Agence France-Presse (Mar. 2026), https://www.al-monitor.com/originals/2026/03/leading-satellite-firm-hold-back-gulf-state-images; US Satellite Imagery Firm Announces Blackout on Middle East War Pics, Agence France-Presse (Apr. 4, 2026), https://www.arabnews.com/node/2638797/world.
[^57]: Krishna Karra, Where Did the Middle East Go? Satellite Imaging in the Fog of War, Bloomberg (2026), https://www.bloomberg.com/graphics/2026-satellite-imagery-restrictions-iran/.
[^58]: Vazquez, supra; see Pasternack, supra.
[^59]: Karra, supra.
[^60]: Evan Hill et al., Iran Has Hit Far More U.S. Military Assets Than Reported, Satellite Images Show, Wash. Post (May 6, 2026), https://www.washingtonpost.com/investigations/2026/05/06/iran-us-bases-satellite-images/.
[^61]: DOD Won't Release Sat Pix Until Jan. 5, United Press Int'l (Nov. 7, 2001), https://www.upi.com/Defense-News/2001/11/07/DOD-wont-release-sat-pix-until-Jan-5/84151005153639/.
[^62]: See generally Nina Witjes & Philipp Olbrich, A Fragile Transparency: Satellite Imagery Analysis, Non-State Actors, and Visual Representations of Security, 44 Sci. & Pub. Pol'y 524 (2017).
[^63]: Leading Satellite Firm to Hold Back Gulf State Images, supra.
[^64]: International Covenant on Civil and Political Rights art. 19(3), Dec. 16, 1966, 999 U.N.T.S. 171.
[^65]: Ann M. Florini & Yahya Dehqanzada, Commercial Satellite Imagery Comes of Age, 16 Issues Sci. & Tech. 45 (1999); see also Robert P. Merges & Glenn H. Reynolds, News Media Satellites and the First Amendment, 3 High Tech. L.J. 1 (1988); George E. Seay III, Remote Sensing: The Media, the Military, and the National Security Establishment, 59 J. Air L. & Com. 239 (1993); Licensing of Private Land Remote-Sensing Space Systems, 65 Fed. Reg. 46,822, 46,823 (July 31, 2000).
[^66]: Bantam Books, Inc. v. Sullivan, 372 U.S. 58, 67–68 (1963).
[^67]: Id. at 70.
[^68]: Nat'l Rifle Ass'n of Am. v. Vullo, 602 U.S. 175, 191 (2024); see id. at 190–91 (listing guideposts, including word choice and tone, regulatory authority, whether the speech was perceived as a threat, and reference to adverse consequences, and stating that "[n]o one factor is dispositive").
[^69]: Nat'l Rifle Ass'n of Am. v. Vullo, 144 F.4th 376, 391 (2d Cir. 2025).
[^70]: Sorrell v. IMS Health Inc., 564 U.S. 552, 570 (2011).
[^71]: Murthy v. Missouri, 603 U.S. 43 (2024); see Derek E. Bambauer, The Jawboning Cases End with a Bang Disguised by a Whimper, 2023–2024 Cato Sup. Ct. Rev. 157, 158 (2024).
[^72]: Treaty on Principles Governing the Activities of States in the Exploration and Use of Outer Space, Including the Moon and Other Celestial Bodies art. VI, Jan. 27, 1967, 18 U.S.T. 2410, 610 U.N.T.S. 205.
[^73]: McGill Manual on International Law Applicable to Military Uses of Outer Space r. 123 (Ram S. Jakhu & Steven Freeland eds., 2022).
[^74]: U.N. Off. for Outer Space Affs., Dark and Quiet Skies II for Science and Society § 4.2.6 (Connie Walker & Piero Benvenuti eds., 2022).
[^75]: HawkEye 360, Inc., Registration Statement (Form S-1) (Apr. 10, 2026) (Management's Discussion and Analysis, "Our Customers"; Risk Factors).
[^76]: Id. (Risk Factors, "Legal and Regulatory Risks").
[^77]: 15 C.F.R. § 960.4 (2025).
[^78]: John S. Goehring, U.S. Commercial Space Regulation: The Rule of Three, 13 J. Nat'l Sec. L. & Pol'y 337, 351 & n.84 (2023).
[^79]: Id.
[^80]: Privacy Int'l, Space: The Final Frontier of Europe's Migrant Surveillance (July 26, 2021), https://privacyinternational.org/news-analysis/4601/space-final-frontier-europes-migrant-surveillance.
[^81]: Aprajita Rana, Anubhav Das & Adishree Singh, Update: Security Conditions under the GMPCS License, AZB & Partners (May 29, 2025) (summarizing Dep't of Telecomms. Office Memorandum of May 5, 2025); Govt Mandates Legal Interception of Satcom Services, Bars Data Routing Outside Country, ThePrint (PTI) (May 5, 2025).
[^82]: Ministry of Defence of Ukraine, Countering Russian Drones: How to Complete Starlink Verification to Operate Terminals in Ukraine (Feb. 2, 2026).
[^83]: David Jeans & Joey Roulette, Musk's Starlink Updates Privacy Policy to Allow Consumer Data to Train AI, Reuters (Jan. 31, 2026).
[^84]: See generally Xiran Ren & Qun Zhang, Governing the Ungoverned: Data Localization and the Globalization of Satellite IoT Constellations (2026) (preprint, SSRN).
[^85]: Sergio Marchisio, The Evolutionary Stages of the Legal Subcommittee of the United Nations Committee on the Peaceful Uses of Outer Space (COPUOS), 31 J. Space L. 219, 235 (2005).
[^86]: Dow Chem. Co. v. United States, 476 U.S. 227, 238 (1986).
[^87]: Kyllo v. United States, 533 U.S. 27, 34, 40 (2001).
[^88]: Id. at 47 (Stevens, J., dissenting); see Blake Knight, Stakeout from Space: Fourth Amendment Concerns Resulting from the Onset of Satellite Video, 41 J. Space L. 231, 249 (2017).
[^89]: Chatrie v. United States, 609 U.S. 605 (2026).
[^90]: Carpenter v. United States, 585 U.S. 296 (2018).
[^91]: United States v. Verdugo-Urquidez, 494 U.S. 259 (1990).
[^92]: Bin Cheng, Article VI of the 1967 Space Treaty Revisited: "International Responsibility", "National Activities", and "The Appropriate State", 26 J. Space L. 7, 9 (1998).
[^93]: Goehring, *Rule of Three*, *supra*, at 352 (quoting Letter from HawkEye 360 to the National Space Council (Dec. 15, 2022)).
[^94]: Cristian van Eijk, *Unstealing the Sky: Third World Equity in the Orbital Commons*, 47 Air & Space L. 25 (2022) (quoting Address by President William V.S. Tubman, U.N. Doc. A/C.1/941 (Dec. 8, 1966)).
[^95]: Treaty on Principles Governing the Activities of States in the Exploration and Use of Outer Space, Including the Moon and Other Celestial Bodies art. VI, Jan. 27, 1967, 18 U.S.T. 2410, 610 U.N.T.S. 205 [hereinafter Outer Space Treaty].
[^96]: Bin Cheng, Article VI of the 1967 Space Treaty Revisited: "International Responsibility," "National Activities," and "The Appropriate State," 26 J. Space L. 7, 19 (1998).
[^97]: Principles Relating to Remote Sensing of the Earth from Outer Space, G.A. Res. 41/65, princ. I(e) (Dec. 3, 1986) [hereinafter Remote Sensing Principles]; see Frans von der Dunk, United Nations Principles on Remote Sensing and the User, in Earth Observation Data Policy and Europe 29, 31 (Ray Harris ed., 2002) (quoting Principle I(e)).
[^98]: Remote Sensing Principles, supra, princ. XIV; von der Dunk, supra, at 38.
[^99]: Outer Space Treaty, supra, art. III; see Danielle Ireland-Piper & Steven Freeland, Human Rights and Space, 9 Groningen J. Int'l L. 101, 106 (2021) (reading Article III to bring human rights law to bear on space activities that affect "individuals on Earth").
[^100]: U.N. Charter arts. 55(c), 56.
[^101]: Outer Space Treaty, supra, art. VI; see Cheng, supra, at 16–17.
[^102]: van Eijk, *Unstealing the Sky*, *supra*.
[^103]: International Covenant on Civil and Political Rights art. 17, Dec. 16, 1966, 999 U.N.T.S. 171 [hereinafter ICCPR]; Marko Milanovic, Human Rights Treaties and Foreign Surveillance: Privacy in the Digital Age, 56 Harv. Int'l L.J. 81, 83 (2015) (quoting the article).
[^104]: U.N. Hum. Rts. Comm., General Comment No. 16: Article 17 (Right to Privacy), ¶ 1 (Apr. 8, 1988), reprinted in Compilation of General Comments and General Recommendations Adopted by Human Rights Treaty Bodies, U.N. Doc. HRI/GEN/1/Rev.1, at 21 (1994).
[^105]: Id. ¶ 10.
[^106]: ICCPR, supra, art. 19(2).
[^107]: Cheng, supra, at 15; see John S. Goehring, Properly Speaking, the United States Does Have an International Obligation to Authorize and Supervise Commercial Space Activity, 78 A.F. L. Rev. 101, 104 (2018) (quoting Cheng).
[^108]: Milanovic, supra, at 119.
[^109]: von der Dunk, *Outer Space Law Principles and Privacy*, *supra*.
[^110]: Amir Saboorian, Comment, A Brave New World: Using the Outer Space Treaty to Design International Data Protection Standards for Low-Earth Orbit Satellite Operators, 84 J. Air L. & Com. 575, 577, 594 (2019).
[^111]: Anél Ferreira-Snyman & Gerrit Ferreira, The Application of International Human Rights Instruments in Outer Space Settlements: Today's Science Fiction, Tomorrow's Reality, 22 PER/PELJ 1, 1 (2019); Anél Ferreira-Snyman, *Article VI of the Outer Space Treaty: State Responsibility as a Means to Ensure the Protection of Human Rights by Private Companies in Outer Space Settlements*, 29 PER/PELJ (2026).
[^112]: Steven Freeland & Danielle Ireland-Piper, Space Law, Human Rights and Corporate Accountability, 26 UCLA J. Int'l L. & Foreign Aff. 1, 16, 33–34 (2022); Chiara Macchi, Business, Human Rights and International Space Law: Filling the Gaps of Corporate Accountability in the 'New Space', in Regulation of Outer Space: International Space Law and the State 50, 50 (C. Cinelli ed., 2024).
[^113]: R. Chakraborty, Article VI and Orbital Data Centres: Supervisory Synchronization, Air & Space L. (forthcoming 2026); On-Orbit Data Processing: Application of Data Privacy Laws Beyond Earth, 51 Air & Space L. (2026).
[^114]: Remote Sensing Principles, supra, princ. I(a); see von der Dunk, supra, at 31.
[^115]: Francis Lyall & Paul B. Larsen, Space Law: A Treatise ch. 16, at 467 (2d ed. 2018).
[^116]: Charles Stotler, Interpretation as Creation: Article VI of the Outer Space Treaty, 26 Chi. J. Int'l L. 131, 140, 146–47 (2025).
[^117]: Id. at 138–39; see also Frans G. von der Dunk, Scoping National Space Law: The True Meaning of "National Activities in Outer Space" of Article VI of the Outer Space Treaty, 62 Proc. Int'l Inst. Space L. 227, 229–33 (2019).
[^118]: ICCPR, supra, art. 19(3)(a).
[^119]: U.N. Hum. Rts. Comm., Concluding Observations on the Fourth Periodic Report of the United States of America, ¶¶ 4, 22, U.N. Doc. CCPR/C/USA/CO/4 (Apr. 23, 2014); see Milanovic, supra, at 105–07.
[^120]: U.N. Hum. Rts. Comm., General Comment No. 31, ¶ 10, U.N. Doc. CCPR/C/21/Rev.1/Add.13 (May 26, 2004).
[^121]: U.S. Reservations, Declarations, and Understandings, International Covenant on Civil and Political Rights, 138 Cong. Rec. S4781-01 (daily ed. Apr. 2, 1992).
[^122]: Goehring, *Properly Speaking*, *supra*, at 113 (describing Laura Montgomery's 2017 testimony).
[^123]: Id. at 118 (quoting Carlos Manuel Vázquez).
[^124]: 51 U.S.C. § 60121(b)(1).
[^125]: 85 Fed. Reg. at 30,802.
[^126]: Heather A. Harrison Dinniss, *Cyber Operations in Outer Space*, *in* Outer Space Law: Legal Policy and Practice 461 (Yanal Abul Failat & Anél Ferreira-Snyman eds., 2d ed. 2022) (noting that peacetime espionage is not prohibited under international law).
[^127]: HawkEye 360, Inc., Registration Statement (Form S-1) (Apr. 10, 2026) (Risk Factors).
[^128]: Michael Endrias, *Unseen Above* (2026) (browser game), https://mikiend.itch.io/unseen-above.
[^129]: Ingrid LaFleur, *Sacred Space: Decolonization through the Afrofuture*, *in* Reclaiming Space ch. 13, at 153 (2023).
[^130]: *Id.* at 159.
[^131]: *See generally* Craig John Newbery-Jones, *Answering the Call of Duty: The Phenomenology of Justice in Twenty-First-Century Video Games*, 9 Law & Human. 78 (2015).
[^132]: Ntina Tzouvala, Capitalism as Civilisation: A History of International Law 21 (2020) (quoting Susan Marks, *Human Rights and the Bottom Billion*, 2009 Eur. Hum. Rts. L. Rev. 37, 48–49).
[^133]: *See* Lauren E. Diaz & Vicenç Feliú, *Governing Orbital Data Centers in the New Space Race* (Aug. 26, 2026) (unpublished manuscript), https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7343538.
