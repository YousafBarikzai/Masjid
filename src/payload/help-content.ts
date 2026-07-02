/* ----------------------------------------------------------------------------
   In-CMS help content. One friendly "how to use this page" entry per collection
   and global slug, shown by the HelpPanel at the top of the list and edit views.
   Authored for non-technical mosque volunteers. Edit the text freely here.
   ---------------------------------------------------------------------------- */

export interface HelpEntry {
  title: string;
  intro: string;
  steps: string[];
  tip?: string;
}

/** Keyed by collection slug OR global slug. */
export const HELP_CONTENT: Record<string, HelpEntry> = {
  "screens": {
    title: "Digital Screens",
    intro: "Each entry here is one TV in the mosque (Mimbar & Outside, Sisters, Middle Masjid, Ablution Area). A screen plays its list of slides in a loop \u2014 every slide shows for its own number of seconds, then the next appears.",
    steps: [
      "Open the screen you want to change (or Create a new one for a new TV).",
      "Under Slides, click Add Slide and choose the type: Prayer times board, Announcement, Picture / poster, or QR code.",
      "Set the seconds for the slide \u2014 how long it stays on screen (10\u201315s reads well; give the prayer board 60s or more).",
      "Fill in the slide's fields: an announcement needs a heading and short text; a picture needs an image from the media library; a QR code needs the link it should open and a caption.",
      "Drag the handle on the left of each row to change the running order \u2014 the loop plays top to bottom, then repeats.",
      "Untick \u2018Show this slide\u2019 to take a slide out of rotation without deleting it (handy for seasonal notices).",
      "Save. The TV updates itself within about a minute \u2014 no need to touch it.",
    ],
    tip: "On the TV, open /display/<slug> (for example /display/mimbar-outside) in the browser and make it the homepage \u2014 see docs/SCREENS.md for per-TV setup.",
  },
  "pages": {
    title: "Pages",
    intro: "Pages are the permanent parts of your website, like About the Mosque, Visit Us or Donate. Use these for information that stays up most of the time, rather than dated news.",
    steps: [
      "Give the page a clear Title (for example About the Mosque).",
      "Set the Slug, which is the web address for the page. Use lowercase words joined by hyphens, like about-the-mosque, with no spaces.",
      "Write a short Intro. This one or two sentence summary appears just under the title.",
      "Fill in the Page content using the toolbar for bold text, headings, colours, lists, links and images.",
      "If you want a richer layout, add Page sections: a Text block, a Columns layout (2 to 4 columns), images, buttons or downloads, each with an optional background colour.",
      "Optionally open SEO and add a short Description that helps search engines like Google describe your page.",
      "When you are happy, use Publish to make it live. Use Save Draft to keep working without showing it on the website yet.",
    ],
    tip: "If you are a Contributor, you cannot publish directly. Save your work and set the review status to Ready for review, and an editor will be notified to check it and publish it for you.",
  },
  "posts": {
    title: "News & Announcements",
    intro: "News posts are dated articles, like an Eid announcement, a fundraising update or a community notice. Use these for things that happen on a particular date, rather than permanent information.",
    steps: [
      "Add a clear Title for the article.",
      "Optionally set the Slug (the web address). If you leave it blank it will be handled for you.",
      "Choose the Published date so the article shows the right date on the website.",
      "Add a Lead image. This picture shows on the news card and at the top of the article. Pick one from the media library.",
      "Write a short Excerpt. This summary appears on the news card to tempt people to read more.",
      "Write the article in Content using the toolbar for bold, headings, colours, lists, links and images. You can add optional Extra sections below if you want columns, images, buttons or downloads.",
      "Use Publish to make it live, or Save Draft to keep it private until you are ready.",
    ],
    tip: "Contributors can write and save news but cannot publish. Set the review status to Ready for review and an editor will be notified to check and publish it.",
  },
  "events": {
    title: "Events",
    intro: "Events are one-off or scheduled happenings with a date and time, such as an Eid prayer, a Ramadan iftar, a youth night or a fundraiser. They appear on the events listing so people can plan to come along.",
    steps: [
      "Enter the event Title.",
      "Optionally set the Slug (the web address for this event).",
      "Pick a Category such as Eid, Ramadan, Youth, Community, Lecture or Fundraiser, so it groups nicely.",
      "Set the Start date and time, and the End date and time, using the date and time picker.",
      "Add the Location, a short Summary for the cards, and optionally an Image and a fuller Description.",
      "If people need to sign up, paste a Registration URL (a link to a booking or sign-up form).",
    ],
    tip: "Always double-check the Start and End times use the right date AND time, not just the date. Events with no time can look wrong on the website.",
  },
  "classes": {
    title: "Classes & Courses",
    intro: "Classes and Courses are your regular learning activities, like Quran classes for children, sisters circles, adult courses or weekly lectures. They appear on the classes listing so families can find the right one.",
    steps: [
      "Enter the class Title (for example Children's Quran Class).",
      "Choose a Category such as Children, Youth, Sisters, Adult, Course or Lecture.",
      "Fill in the Age range in plain words, for example 6 to 16.",
      "Add the Schedule in plain words, for example Mon to Fri, 5 to 7pm.",
      "Note any Fees, and write a short Description of what the class covers.",
      "If there is a sign-up form, paste an Enrol URL so people can register.",
    ],
    tip: "Age range, Schedule and Fees are free text, so write them the way a parent would read them. There is no fixed format to follow.",
  },
  "services": {
    title: "Services",
    intro: "Services describe the help the mosque offers, such as funeral services, nikah (marriage), new Muslim support or counselling. Each one gets its own little page on the website.",
    steps: [
      "Enter the service Title (for example Funeral Services).",
      "Set the Slug, the web address, using lowercase words joined by hyphens, like funeral-services.",
      "Add an Icon if you like. You can paste an emoji (such as a relevant symbol) or an icon name to give it a friendly look.",
      "Write a short Summary that explains the service in a sentence or two.",
      "Use Content to add the full details, with the toolbar for headings, links, contact info and so on.",
    ],
    tip: "Keep the Summary short and reassuring, since it is often the first thing people read when they are looking for help at a difficult time.",
  },
  "announcements": {
    title: "Announcements & Banners",
    intro: "Announcements are the short notices that appear as a banner across the website, such as Jummah time changes or Eid prayer details. They are perfect for quick, time-limited messages everyone should see.",
    steps: [
      "Type your Message. This is the main text shown in the banner and is required.",
      "Optionally change the Label (it defaults to Notice) to something like Reminder or Eid.",
      "Choose a Severity: Info for normal news, Warning to draw more attention, or Urgent for important alerts.",
      "If the notice relates to a page, use Link to a page to pick it, which makes the banner clickable. Or paste an external Link instead (the page choice wins if you set both).",
      "Tick Enabled to show the banner, and optionally set a Start date and End date so it appears and disappears on its own.",
      "To also alert people on the mobile app, tick Send push notification. This sends just once.",
    ],
    tip: "Send push notification only sends one time. Once it has gone out, the Push sent box ticks itself, so editing the announcement later will not send it again.",
  },
  "prayer-days": {
    title: "Prayer Timetable",
    intro: "This is the daily prayer timetable, with one record for each day of the year. It controls the prayer times shown on the website and app. The annual upload fills most days in for you, and here you can fix or override a single day by hand.",
    steps: [
      "Pick the Date for the day you want to set.",
      "Fill in each prayer's two times: the Begins time (when the prayer time starts) and the Jamaah time (the congregation time). For example Fajr begins and Fajr jamaah.",
      "Enter Sunrise, and for Maghrib enter the one time (Maghrib jamaah is at sunset, the begins time).",
      "Always write times in 24-hour HH:MM format, for example 13:30 for half past one in the afternoon.",
      "If you are correcting a day by hand, set Source to Manual override so it is clear this was changed on purpose.",
      "Add a short Note if helpful, such as Ramadan or Eid.",
    ],
    tip: "A day you edit here overrides the annual timetable for that specific date. So if Eid or Ramadan timings differ, change just those days here and the rest of the year stays as imported.",
  },
  "timetable-uploads": {
    title: "Upload Annual Timetable",
    intro: "This is how you load the whole year's prayer times in one go, from a spreadsheet saved as a CSV file. It reads the file, checks it, and fills in the Prayer Timetable automatically so you do not have to type every day by hand.",
    steps: [
      "Prepare your CSV with the expected columns: Day, Date, Fajr, Sunrise, Zawwal, Duhur, Asr, Sunset, Maghrib, Isha, and the J- jamaah columns (J-Fajr, J-Duhur, J-Asr, J-Maghrib, J-Isha).",
      "Drag the CSV file into the upload area to attach it.",
      "Choose a Mode: Add missing days only keeps any days you already have, while Replace existing days too overwrites them with the file.",
      "Save the upload to start the import.",
      "After saving, read the Report that appears, which tells you how many days were created, updated or skipped, plus any warnings or errors.",
      "Check the Imported count to confirm the right number of days came through.",
    ],
    tip: "Start with Add missing days only the first time, so you do not accidentally overwrite any days you have already adjusted by hand. Use Replace existing days too only when you really want the file to win.",
  },
  "media": {
    title: "Media Library",
    intro: "The Media library is where all your pictures and PDF documents live. Anything you want to show on a page, news post or event is uploaded here first, then chosen when you build the content.",
    steps: [
      "Upload files by dragging them into the library. You can drag several at once thanks to bulk upload.",
      "Organise files into Folders so the library stays tidy and easy to browse.",
      "Add Alt text to each image, a short description of what is in the picture. This helps people using screen readers and helps search engines.",
      "Add an optional Caption if you want text to show beneath the image.",
      "Add Tags like ramadan, eid or hero so you can find the file later by searching.",
      "For images, use the crop and Focal point tools to mark the most important part, so the picture always frames nicely whatever size it is shown at.",
    ],
    tip: "Setting a Focal point matters because the website automatically makes smaller versions of each image. The focal point keeps faces or key details in view instead of getting cut off.",
  },
  "broadcasts": {
    title: "Broadcasts",
    intro: "Write a notice once and send it out to your chosen channels (email, Telegram, WhatsApp, Facebook, Instagram). You compose a single message and it goes everywhere you tick.",
    steps: [
      "Click Create, then type a short Title and write your message in the Body box.",
      "Optionally attach an Image (note: Instagram needs an image; Facebook, Telegram and WhatsApp will use it if you add one).",
      "Under Channels, tick every place you want this to go (Email, Telegram, WhatsApp, Facebook, Instagram). You compose once and it fans out to all of them.",
      "When you're ready to send, tick the 'Send now' box and click Save. It dispatches just once.",
      "After saving, the Status changes to 'Sent', the Sent At date is filled in, and the Report box shows a line for each channel telling you whether it worked.",
      "To send the same thing again later, create a new Broadcast rather than re-saving an old one.",
    ],
    tip: "Nothing is sent until you tick 'Send now' and Save. You can prepare a draft, leave it, and only tick the box when you're sure. It will never send twice, and the per-channel Report tells you exactly which channels succeeded or failed.",
  },
  "subscribers": {
    title: "Subscribers (Broadcast)",
    intro: "Your list of people who have opted in to receive email or WhatsApp updates. These are the contacts your Broadcasts can reach.",
    steps: [
      "People usually add themselves through the website sign-up form, so this list often fills up on its own.",
      "To add someone by hand, click Create and fill in their Name, Email and/or WhatsApp number.",
      "Enter WhatsApp numbers in international format with no spaces or plus sign, e.g. 447700900000.",
      "Tick 'Wants email updates' and/or 'Wants WhatsApp updates' to set how they'd like to hear from you.",
      "Use the Source field to note how they joined (e.g. 'website form' or 'QR code') so you can keep track.",
      "If someone asks to stop receiving messages, tick the 'Unsubscribed' box rather than deleting them.",
    ],
    tip: "Don't add people who haven't agreed to be contacted. Always respect the opt-in tick boxes and the Unsubscribed flag so your mosque only messages people who want to hear from you.",
  },
  "contact-submissions": {
    title: "Contact Messages",
    intro: "Messages that visitors send through the website's contact form land here, so the team has one tidy inbox to work through.",
    steps: [
      "Open the list to see incoming messages, newest activity first, showing Name, Email, Subject and whether each is Handled.",
      "Click a message to read the full details: Name, Email, Phone, Subject and the Message itself.",
      "Reply by emailing the person directly at the Email address shown (replies don't happen inside the CMS).",
      "Once you've dealt with a message, tick the 'Handled' box and Save so the rest of the team knows it's done.",
      "Leave the Handled box unticked for anything still needing a reply, so nothing slips through the cracks.",
    ],
    tip: "The 'Handled' tick box is your to-do marker. Get into the habit of ticking it the moment a message is resolved, so untouched messages are easy to spot.",
  },
  "forms": {
    title: "Forms",
    intro: "A no-code form builder for things like membership sign-ups, enquiries or bookings. You drag in the fields you want, no coding needed, and the form can be placed on a website page.",
    steps: [
      "Click Create and give the form a clear name (e.g. 'Membership Application').",
      "Add the fields you need by choosing field types: text, email, textarea, number, select (dropdown), checkbox, a message/instruction block, country or state.",
      "Set who receives each submission by entering the recipient email address(es) for this form, so the right person gets notified.",
      "Write a confirmation message to thank people after they submit, or choose a page to redirect them to instead.",
      "Save the form, then ask whoever manages the website to add it to the relevant page.",
      "Submissions are stored under Form Submissions and emailed to the recipients you set.",
    ],
    tip: "Each form has its own recipient list, so make sure you set it, otherwise notifications fall back to the mosque's default inbox. You can view and export collected responses to CSV from Form Submissions for spreadsheets or record-keeping.",
  },
  "form-submissions": {
    title: "Form Submissions",
    intro: "Every response people send through your custom Forms is collected here, so you have a complete record you can read or export.",
    steps: [
      "Open the list to see all responses; click any row to read the full set of answers a person submitted.",
      "Each submission is linked to the Form it came from, so you can tell which form each response belongs to.",
      "Use the date columns to find recent submissions or work through them in order.",
      "To get the data into a spreadsheet, use the CSV export so you can sort, filter or share the responses offline.",
      "Recipients also receive each submission by email automatically, so this list is your backup and full archive.",
      "If you no longer need old responses, an admin can remove them; editors can read but not change submissions.",
    ],
    tip: "Spam is filtered out automatically before it reaches you, so what you see here should be genuine. Export to CSV regularly if you want a long-term record outside the CMS.",
  },
  "users": {
    title: "Team & Roles",
    intro: "Everyone who can sign in to this admin. Each person's role decides what they see in the left menu and what they can do — give people the smallest role that covers their job.",
    steps: [
      "Click Create, then enter the person's name, email address and a password (they can change it after their first login).",
      "Pick a role. Super Admin / Admin: run everything including users and settings. Editor: create, edit and publish all content. Editor (edit only): can update existing pages, news and events but cannot add new items or delete. Contributor: writes drafts that an editor reviews and publishes. Prayer Times Manager: only the timetable and Jumu\u02bfah/Ramadan times.",
      "Save. Send the person their email and password \u2014 they sign in at /admin.",
      "To change what someone can do, open their entry and change the role (only Admins can do this).",
      "To remove someone's access, delete their entry.",
    ],
    tip: "The role guide at the top of this page shows exactly what each role can and cannot do. The left-hand menu adapts automatically \u2014 an Editor (edit only) will not even see the + buttons for creating new items.",
  },
  "audit-log": {
    title: "Audit Log",
    intro: "A read-only history of who changed what in the admin, and when. It's there for peace of mind on a team with several volunteers, and you can't edit or fake entries.",
    steps: [
      "Open the Audit Log to see a running list of changes, newest first.",
      "Each entry's Summary reads in plain English, e.g. 'jane@... updated news post \"Eid Prayer Times\"'.",
      "The Action column tells you whether something was Created, Updated or Deleted.",
      "User Email shows who made the change, and the date column shows when it happened.",
      "Use it to answer 'who edited this?' or 'when did this change?' if something looks unexpected.",
      "You can't add or edit entries here; the log fills in by itself as people work.",
    ],
    tip: "This is a record only, not a way to undo changes. To recover an earlier version of a page or news post, use that item's own version history instead. Only Admins can view the Audit Log.",
  },
  "main-menu": {
    title: "Navigation Menu",
    intro: "This controls the row of links that runs along the top of the website. Each link can also open a little dropdown of extra links underneath it. If you leave this completely empty, the site falls back to its built-in default menu, so you only need to fill it in when you want something custom.",
    steps: [
      "Under \"Menu items\", click \"Add Menu item\" to create each top-level link you want in the header.",
      "For each item, type the wording people will see in the \"Label\" box (e.g. About), then put where it goes in the \"URL\" box: an internal page like /about, or a full web address like https://example.com.",
      "Tick or untick the small \"Visible\" checkbox on the right to show or hide that link without deleting it, handy for things you want to switch on later.",
      "To make a dropdown, open the item and use \"Add Dropdown link\" under \"Children\": each dropdown link needs both a Label and a URL (both are required here).",
      "Reorder anything by dragging the ⠿ handle on the left up or down; the order you see is the order visitors will see.",
      "When you are happy, click Save at the top, then check the live site in a new tab.",
    ],
    tip: "Top-level items can have a URL or be left without one to act purely as a dropdown heading, but every dropdown (child) link must have both a Label and a URL or it will not save.",
  },
  "site-settings": {
    title: "Site Settings",
    intro: "This is the home for your mosque's core details, the contact information, address, opening times, charity number and social links, plus the text for the About page. Lots of these values appear across the whole website (footer, contact page, map), so updating them here changes them everywhere at once.",
    steps: [
      "Fill in the \"Contact\" group with your Phone, Email, Address line 1, City and Postcode so visitors can reach and find you.",
      "In \"Maps query\" put the address you want the map to point at; this is what the embedded map uses to drop its pin.",
      "Use \"Opening times\" for general opening hours and add your registered \"Charity number\" so it shows on the site for transparency.",
      "Under \"Socials\", click Add to create each link: put the platform name in \"Label\" (e.g. Facebook) and the full address in \"URL\".",
      "In the \"About page\" group, set the \"History heading\" (defaults to \"Our story\") and write your story in \"History body\", using one paragraph per line with a blank line between paragraphs.",
      "Add a few \"Facilities\" (e.g. Wudu area, Parking, Wheelchair access) one per row, then click Save.",
    ],
    tip: "Type phone numbers and emails carefully, a small typo here shows up on every page; always click Save and then check the live contact page and footer to confirm it looks right.",
  },
  "jummah-settings": {
    title: "Jummah Times",
    intro: "This sets out the Friday (Jummah) prayer details shown on the website. You can write a short introduction and then list each congregation (jamaa'ah) with its language and timings, useful if you run more than one Friday sitting.",
    steps: [
      "Write a short welcome or note in the \"Intro\" box to appear above the Friday times (e.g. doors open early, please arrive in good time).",
      "Under \"Congregations\", click \"Add Congregation\" for each Friday sitting you hold.",
      "Give each one a \"Name\", for example First Jummah or Second Jummah.",
      "Set the \"Language\" of the khutbah (sermon), such as English or Urdu.",
      "Fill in \"Doors\" (when doors open) and \"Khutbah\" (when the sermon starts) using clear times like 1:15 PM.",
      "Drag the ⠿ handle to put the congregations in the order you want them displayed, then click Save.",
    ],
    tip: "Keep the time wording consistent across all congregations (for example always \"1:15 PM\" rather than mixing in \"13:15\") so the Friday schedule reads cleanly. These are free-text boxes, so remember to update them whenever clocks change.",
  },
  "donation-settings": {
    title: "Donations",
    intro: "This controls the donations page: the heading and message you greet supporters with, your bank/transfer details, and any fundraising campaigns with progress bars. Update it whenever your account details change or you launch a new appeal.",
    steps: [
      "Set the \"Heading\" and write a short \"Body\" message explaining why donations matter and how they help.",
      "Under \"Bank details\", click Add for each line people need: put the field name in \"Label\" (e.g. Account name, Sort code, Account number) and the actual detail in \"Value\".",
      "Under \"Campaigns\", click Add to create an appeal, giving it a \"Title\" (e.g. New Carpet Fund).",
      "Enter the target amount in \"Goal\" and how much has come in so far in \"Raised\" (numbers only, no currency symbols), this drives the progress bar.",
      "Optionally upload an \"Image\" for the campaign and add a \"Link\" to an external donation or JustGiving page.",
      "Use the \"Active\" checkbox to show or hide a campaign, untick it to retire a finished appeal without deleting it, then click Save.",
    ],
    tip: "In \"Goal\" and \"Raised\" type plain numbers only (e.g. 5000, not £5,000 or 5,000), commas or symbols can stop the progress bar working. Double-check bank details before saving, as people will rely on them to send money.",
  },
  "broadcast-settings": {
    title: "Broadcast",
    intro: "This holds the public-facing settings for your community messaging channels, the optional sign-off added to messages and the \"join us\" links for WhatsApp and Telegram. It only stores the public channel targets and join links; the secret login keys and tokens live safely in the server's environment variables, not here, so there is nothing sensitive for you to enter.",
    steps: [
      "In \"Signature\", optionally type a sign-off that gets added to the end of broadcasts, for example \"— Kingston Mosque\".",
      "In \"WhatsApp join URL\", paste the public link or QR target where people can join your WhatsApp updates.",
      "In \"Telegram join URL\", paste the public link to your Telegram channel or group.",
      "Leave any field blank if you do not use that channel, blank links simply will not be shown.",
      "Open the links yourself in a browser first to confirm they actually let someone join, then click Save.",
    ],
    tip: "This page is only for public join links and the sign-off; it does not hold passwords or API keys. If broadcasts stop sending, that is almost certainly a credentials issue in the environment variables (a job for your technical admin), not something you can fix on this screen.",
  },
  "special-schedule": {
    title: "Ramadan & Eid",
    intro: "This manages the special seasonal sections for Ramadan and Eid. Each has its own on/off switch so you can prepare everything in advance and only reveal it when the time comes, then hide it again afterwards.",
    steps: [
      "Open the \"Ramadan\" section and tick \"Show Ramadan section\" when you are ready for it to appear on the site (it is off by default).",
      "Set the \"Ramadan heading\" (defaults to \"Ramadan at Kingston Mosque\") and write a short \"Ramadan intro\".",
      "Under \"Ramadan items\", add rows with a \"Label\" and \"Value\", for example Label: Taraweeh, Value: After Isha; or Label: Iftar, Value: see timetable.",
      "Open the \"Eid\" section and tick \"Show Eid section\" when appropriate, then fill in the \"Eid title\" (e.g. Eid al-Adha) and \"Eid date text\" (e.g. Saturday 28 March (subject to moon sighting)).",
      "Under \"Eid prayers\", add each jamaa'ah with its \"Label\", \"Time\" and \"Location\", and use \"Eid notes\" for any extra guidance such as parking or overflow arrangements.",
      "Click Save, then untick the relevant \"Show\" checkbox once the season has passed to hide that section again.",
    ],
    tip: "Nothing appears on the website until the matching \"Show\" tickbox is on, so if your Ramadan or Eid details are not showing, the most common cause is simply that the section is still switched off.",
  },
};
