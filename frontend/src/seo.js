export const SITE_URL = 'https://fryly.vercel.app';
export const guides = [
  { path: '/group-management-app', title: 'Group Management App for Friends & Families | Fryly', heading: 'A group management app for everyday plans', description: 'Manage group notes, shared checklists, expenses and member roles. Organise friends, families, roommates and travel groups in one Fryly workspace.', sections: [
    ['Give each group its own workspace', 'Create separate groups for your home, family and travel friends. Add named sections for notes, checklists, payments, links, photos and reminders so a decision or document has a place beyond the chat history.'],
    ['Invite people and choose their role', 'Owners assign Admin, Member or Viewer roles. Admins help manage sections and membership; Members contribute content; Viewers have read-only access. The owner can choose the default role for new members joining through an invite code. Review roles before sharing that code.'],
    ['Start with a useful setup', 'Create a group, invite your people, then add a Plans note, a To do checklist and a Shared expenses payment section. Add more sections when the group needs them. Fryly supports everyday collaboration rather than enterprise staffing or payroll.']
  ] },
  { path: '/split-expenses', title: 'Split Expenses with Friends — Group Bill Splitter | Fryly', heading: 'Split expenses with friends and keep the plan together', description: 'Record shared bills, choose equal or custom splits, view balances and record settlements. Keep expenses alongside group notes and checklists in Fryly.', sections: [
    ['Record who paid and who shares the bill', 'Add a payment section to your group. Enter a description, total and payer, then split the expense across everyone or choose participants and custom amounts. Payer-only entries record personal costs without sharing them.'],
    ['Equal and custom splits', 'For a whole-number total, Everyone distributes the amount across group members. For decimal totals or different shares, use Custom and review each amount before saving. A dinner for three costing 900 gives each person a 300 share; if one person pays it all, the other two each owe 300. This is an example, not live group data.'],
    ['See balances and record settlement', 'Balances show who owes money and who is owed money. History keeps recorded expenses and settlements together. Pay outside Fryly through your chosen payment method, then record it here: recording settlement does not transfer money or verify a bank payment.'],
    ['Keep the context nearby', 'Keep receipt photos in a gallery, booking links in a links section and decisions in notes. Each payment section has a selected currency; Fryly does not promise automatic exchange-rate conversion or bank connections.']
  ] },
  { path: '/group-trip-planner', title: 'Group Trip Planner with Shared Expenses & Lists | Fryly', heading: 'Plan a group trip with notes, packing lists and expenses', description: 'Organise a group trip with shared itinerary notes, packing checklists, booking links, photos and expense splits. Plan together in Fryly.', sections: [
    ['Before the trip: gather the plan', 'Create a trip group and invite your friends. Add an itinerary note for dates, meeting points and accommodation details, a links section for bookings and a packing checklist. Use the calendar for shared events and reminders for preparation tasks.'],
    ['During the trip: record shared costs', 'Log accommodation, meals and transport in a payment section. Select the people sharing each expense rather than assuming everyone joined every activity. Keep receipt photos in a gallery for the group to refer back to.'],
    ['After the trip: review and settle', 'Review balances together, pay each other outside the app and record settlements. Keep photos and notes for the next trip. Fryly organises the plans you enter; it does not automatically generate routes, book travel or import booking emails.']
  ] },
  { path: '/shared-checklist-app', title: 'Shared Checklist App for Packing, Chores & Groceries | Fryly', heading: 'Shared checklists your group can keep together', description: 'Create group checklists for groceries, packing, chores and errands. Keep shared lists alongside notes, reminders and expense splits in Fryly.', sections: [
    ['Create a list around one job', 'Add a checklist section named Weekend packing, Flat groceries or Before we leave. Put one actionable item on each line so group members know what completion means.'],
    ['A packing checklist to start from', 'Try travel documents, chargers, toiletries, medication, weather-appropriate clothing and shared supplies. Adapt it to your destination. Keep personal packing separate from group supplies so completing an item does not imply everyone has packed it.'],
    ['Pair the checklist with context', 'Use a note for decisions, a reminder for a deadline and a payment section for shared purchases. Members can contribute; Viewer roles let someone follow without editing. A shared checklist tracks completion, not a full enterprise task-assignment system.']
  ] },
  { path: '/shared-notes-app', title: 'Shared Notes App for Groups, Families & Travel | Fryly', heading: 'Group notes that stay easy to find', description: 'Keep shared rich-text notes for itineraries, house rules and group decisions. Organise notes with lists, links and expenses in Fryly.', sections: [
    ['Keep one note for each topic', 'Create a Notes section for your itinerary, house rules or meeting decisions. Give it a descriptive title so people can find the current plan without searching a long message thread.'],
    ['Use rich text for readable plans', 'Organise the note with headings, lists and links. Put agreed dates and meeting points near the top. Group members with editing access can contribute; Viewers can read without changing content.'],
    ['Separate plans from actions and bills', 'Keep explanations in notes, completion items in checklists and costs in payment sections. Fryly brings those sections into one workspace. Shared editing does not imply offline conflict resolution or a document version-history feature.']
  ] },
  { path: '/roommate-organizer', title: 'Roommate Organizer for Bills, Groceries & Chores | Fryly', heading: 'Organise roommate bills, groceries and house plans', description: 'Keep flatmate expense splits, grocery checklists, house notes and reminders in one shared group. Organise everyday life with roommates in Fryly.', sections: [
    ['Set up your shared home', 'Create a flat group with a Groceries checklist, House rules note and Bills payment section. Save links for service providers and shared documents in clearly named sections.'],
    ['Track shared costs consistently', 'Record rent, utilities and household purchases with the payer and participating roommates. Use custom amounts when shares differ. Check balances together before paying outside the app and recording settlement.'],
    ['Keep responsibilities visible', 'Use checklists for chores and reminders for bill dates. Agree in a note who handles each responsibility. An Admin can help organise the group, while a Viewer can follow without editing.']
  ] }
];
export const publicPages = [
  { path: '/', title: 'Group Collaboration App & Expense Splitter | Fryly', description: 'Split expenses, share notes and checklists, and plan trips together. Fryly keeps friends, roommates and families organised with flexible group roles.' },
  { path: '/features', title: 'Shared Notes, Checklists, Expenses & Group Roles | Fryly', description: 'Explore Fryly features: notes, checklists, expense splitting, reminders, calendars, galleries and Owner, Admin, Member and Viewer roles.' },
  { path: '/pricing', title: 'Fryly Pricing — Start Your Group for Free', description: 'Start organising your group for free with Fryly. See current pricing information for shared notes, checklists and expenses.' },
  { path: '/faq', title: 'Fryly FAQ — Groups, Expense Splits & Permissions', description: 'Learn how Fryly groups, invitations, shared notes, checklists, expenses and member permissions work.' },
  { path: '/about', title: 'About Fryly — Organisation for Everyday Groups', description: 'Learn about Fryly, a workspace for friends, flatmates and families to organise plans, notes, lists and expenses.' },
  { path: '/contact', title: 'Contact Fryly', description: 'Find contact information for Fryly, the group collaboration app for shared notes, lists and expenses.' },
  ...guides
];
export function getPage(path) { return publicPages.find(page => page.path === path); }
export function schemaFor(page) {
  return { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: 'Fryly', url: `${SITE_URL}/` },
    { '@type': 'WebPage', '@id': `${SITE_URL}${page.path}#page`, url: `${SITE_URL}${page.path}`, name: page.title, description: page.description, isPartOf: { '@id': `${SITE_URL}/#website` } },
    ...(page.path === '/' ? [{ '@type': 'SoftwareApplication', name: 'Fryly', url: `${SITE_URL}/`, applicationCategory: 'ProductivityApplication', operatingSystem: 'Web', description: page.description, featureList: ['Group expense splitting', 'Shared notes and checklists', 'Owner, Admin, Member and Viewer roles'] }] : [])
  ] };
}
