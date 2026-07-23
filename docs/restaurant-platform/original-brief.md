# Original Product Brief — Modular QR-Based Restaurant Ordering, Payment and Management Platform

> Source of truth: the full requirements as provided by the product owner (July 2026).
> The phased plan in this folder references these sections by number. Wording is preserved;
> only formatting has been normalised.

Build a complete, modern restaurant ordering and management platform that allows customers
to scan a QR code at their table, view the restaurant's digital menu, place orders, share a
table session, split payments, pay securely, and receive digital receipts.

The platform must also include a comprehensive restaurant administration system, kitchen
display system, waiter interface, table and floor management, CRM, CMS, marketing,
reservations, reporting, printing, payment management, and future third-party delivery
integrations.

The architecture must be modular, scalable and flexible. It should work for a small
independent restaurant with a few tables, but it must also be capable of scaling to large
restaurants, multiple floors, multiple kitchens, multiple branches and restaurant groups.

The UX/UI is extremely important. Customer ordering must feel effortless on any mobile
device. Kitchen and waiter screens must be designed for large touchscreen displays, with
clear colours, large touch targets, timers, status indicators and minimal unnecessary
interaction.

## 1. Platform Architecture

Create the platform using a modular architecture in which each major business capability is
built as an independent module.

The initial modules should include:

- Customer ordering
- Digital menu
- Table sessions
- Shared ordering
- Payment and bill splitting
- Restaurant floor and table management
- Kitchen display system
- Waiter operations
- Product and menu management
- CMS and media library
- CRM and customer accounts
- Marketing and promotions
- Reservations and bookings
- Reporting and analytics
- User administration and permissions
- Restaurant settings
- QR code generation
- Printer management
- Screen and workstation management
- Notification management
- Website management
- Integration management
- Audit logs and security
- Multi-location and multi-branch support

Each module should have clear APIs and defined responsibilities so it can be changed,
replaced, upgraded or expanded without affecting the entire platform.

The system should support:

- A single restaurant
- Multiple branches
- Restaurant groups
- Franchises
- Multiple brands operating from one kitchen
- Multiple kitchens or preparation stations
- Multiple currencies
- Multiple languages
- Different tax rules
- Different service charge rules
- Different operating hours by branch
- Cloud deployment
- Real-time updates across customer, kitchen and waiter screens

Avoid tightly coupling the menu, ordering, kitchen, CRM and payment components.

## 2. Customer Website and Mobile Ordering Experience

Create a responsive website and progressive web application that works on iPhone, Android
phones, tablets, desktop browsers, and any modern web browser. Customers should not be
required to install an app.

When a customer scans a QR code, the system should automatically identify:

- Restaurant
- Branch
- Floor
- Table
- Current table session
- Available menu
- Available ordering options
- Supported payment methods

The customer should land directly on a beautifully designed digital menu for that
restaurant and table.

The customer must be able to:

- Continue as a guest
- Create an account
- Log in
- Join an existing table session
- Create a new table session
- View what has already been ordered at the table
- Add their name or nickname to the table
- Browse the complete menu
- Search for products
- Filter products
- View dietary information
- View allergen information
- View product images
- View product descriptions
- View prices
- View preparation times where applicable
- Select product options
- Add extras
- Remove ingredients
- Add cooking instructions
- Add notes for the kitchen
- Select quantities
- Add products to their own personal basket
- Add products to a shared table basket
- Submit orders separately or together
- Add additional drinks or food later
- View live order progress
- Request waiter assistance
- Request the bill
- Pay immediately or pay later
- Leave a tip
- Receive a receipt
- Rate the experience
- Provide feedback

The interface must be extremely easy to use, fast, accessible and suitable for customers
with limited technical knowledge.

## 3. Table Sessions and Shared Ordering

Each table should have a shared digital session. For example, if four people are sitting at
Table 4, all four customers should be able to scan the same QR code and join the Table 4
session.

The system should support:

- Shared table ordering
- Individual customer profiles within the table session
- Guest names or nicknames
- Individual baskets
- Shared baskets
- Individual order histories
- Shared order history
- Joining a table through QR code
- Joining through a shared link
- Inviting someone to the table session
- Showing who ordered each item
- Showing unpaid and paid items
- Preventing duplicate submissions
- Allowing more items to be added after the first order
- Table session expiry
- Table session closure
- Staff-controlled reopening
- Customer departure before the rest of the table
- Moving customers or orders to another table
- Merging tables
- Splitting tables
- Transferring a complete table session

Customers should be able to share the table session through WhatsApp, SMS, email, QR code,
copyable link, and supported social sharing options.

## 4. Digital Menu Management

Create a flexible menu structure that supports:

- Menus
- Menu sections
- Categories
- Subcategories
- Sub-subcategories
- Products
- Variants
- Sizes
- Add-ons
- Modifier groups
- Ingredients
- Allergens
- Dietary tags
- Upsell products
- Recommended pairings
- Combo meals
- Meal deals
- Specials
- Limited-time offers
- Seasonal products
- Happy-hour pricing
- Branch-specific products
- Time-specific availability

Example menu categories may include: Starters, Appetisers, Main courses, Side dishes,
Desserts, Children's meals, Hot drinks, Cold drinks, Alcoholic drinks, Non-alcoholic
drinks, Cocktails, Mocktails, Specials.

Administrators must be able to:

- Create and edit menus
- Duplicate menus
- Schedule menus
- Assign menus to selected branches
- Set breakfast, lunch and dinner menus
- Set product availability by time
- Mark products as sold out
- Pause products temporarily
- Schedule specials
- Set different dine-in, takeaway and delivery prices
- Set tax categories
- Set service charges
- Add preparation instructions
- Assign products to preparation stations
- Set estimated preparation time
- Define product SLAs
- Add product images
- Add multiple images
- Configure display order
- Add translations
- Configure allergens and dietary labels
- Create modifier rules
- Set minimum and maximum modifier selections
- Set stock limits where required

## 5. Customer Accounts and Registration

Customers should be able to order as guests or create an account.

Account registration should support:

- Email
- Mobile number
- Password
- Social login where appropriate
- One-time verification code
- Marketing consent
- WhatsApp consent
- Email consent
- SMS consent
- Data privacy consent

The restaurant should be able to offer configurable registration incentives, such as: five
per cent discount, free drink, loyalty points, birthday reward, welcome voucher. The
administration system must allow the restaurant to configure the incentive rather than
hard-coding a five per cent discount.

Customer accounts should include:

- Order history
- Digital receipts
- Favourite products
- Saved dietary preferences
- Saved allergens
- Favourite restaurant or branch
- Loyalty points
- Rewards
- Vouchers
- Saved payment methods, where supported securely
- Booking history
- Marketing preferences
- Personal details
- Account deletion request
- Data export request

## 6. Ordering Workflow

The ordering workflow should support configurable stages such as:

1. Basket
2. Order submitted
3. Payment authorised
4. Order accepted
5. Sent to preparation station
6. Waiting to start
7. Preparing
8. Ready
9. Waiting for collection
10. Collected by waiter
11. Delivered to table
12. Completed
13. Cancelled
14. Refunded

The workflow should be configurable by restaurant and order type.

Orders should update in real time across: customer devices, kitchen screens, dessert
screens, drinks or bar screens, waiter screens, management dashboards, printers.

The system must support:

- Dine-in
- Collection
- Takeaway
- Delivery in a future phase
- Pre-orders
- Scheduled orders
- Reservations with pre-orders
- Orders started by customers
- Orders entered by waiters
- Mixed customer and waiter ordering
- Manual order adjustments by authorised staff

## 7. Payment and Bill Splitting

The payment module must support secure digital payments and flexible bill splitting.

Customers should be able to:

- Pay for the full table
- Pay for their own items
- Select specific items to pay for
- Split the remaining balance equally
- Split the bill by percentage
- Split the bill by custom amounts
- Pay for another person's items
- Pay a fixed contribution
- Pay at different times
- Use multiple payment methods
- Add a tip
- Apply a voucher
- Apply loyalty points
- Apply a promotion
- Request to pay at the counter
- Request a card machine
- Request a printed bill

The system must prevent the same item from being paid for twice.

It should display: total bill, paid amount, remaining balance, service charge, taxes,
discounts, tips, refunded amount, who paid, which items were covered by each payment.

Payment methods may include: Apple Pay, Google Pay, credit cards, debit cards, PayPal
(where enabled), cash, card terminal, gift card, voucher, loyalty credit, other locally
supported payment methods.

The platform must use a secure payment provider and must not store raw card details.

It should support:

- Payment authorisation
- Payment capture
- Partial refunds
- Full refunds
- Failed payment recovery
- Payment reconciliation
- Chargeback references
- Digital receipts
- Payment audit trail

## 8. Digital Receipts

Customers should be able to receive receipts through: email, WhatsApp, SMS link,
downloadable PDF, customer account, printed receipt.

Receipts should include: restaurant details, branch details, date and time, table number,
order number, items, quantities, prices, discounts, taxes, service charges, tips, payment
breakdown, refund information, payment method, loyalty points earned, optional promotional
message.

Receipt templates should be configurable by the restaurant.

## 9. Restaurant Floor and Table Management

Create a visual restaurant floor-plan management module.

Administrators should be able to:

- Create multiple floors
- Create different restaurant areas
- Add tables
- Move tables on a visual canvas
- Resize tables
- Select table shapes
- Assign table numbers
- Set seating capacity
- Group tables
- Merge tables
- Split tables
- Mark tables as accessible
- Mark tables as indoor or outdoor
- Mark tables as private rooms
- Mark tables as unavailable
- Assign tables to waiter sections
- Assign QR codes
- View table status in real time

Example table statuses: Available, Reserved, Awaiting guests, Seated, Browsing menu,
Ordering, Order submitted, Food being prepared, Food ready, Eating, Assistance requested,
Bill requested, Partially paid, Paid, Cleaning required, Out of service.

The floor plan should use clear colours and icons, but it must not rely only on colour.
Status labels and accessibility indicators must also be included.

## 10. QR Code Management

Each table should have a unique, secure QR code.

Administrators should be able to:

- Generate a QR code for each table
- Regenerate QR codes
- Disable compromised QR codes
- Print individual QR codes
- Print QR code sheets
- Download QR codes
- Add restaurant branding
- Add table number
- Add short instructions
- Select print size
- Generate QR codes for takeaway counters
- Generate QR codes for hotel rooms or other locations
- Track QR scans
- Track conversion from scan to order
- Assign different menus to different QR codes

QR codes should not expose insecure internal database identifiers.

## 11. Kitchen Display System

Create a real-time kitchen display system designed specifically for large touchscreen
monitors.

The kitchen interface must have:

- Large touch targets
- High readability
- Clear order cards
- Table number
- Order number
- Customer name where available
- Order time
- Time elapsed
- Target preparation time
- SLA status
- Item quantities
- Modifiers
- Allergens
- Special instructions
- Priority indicators
- Course information
- Colour-coded status
- Audio and visual alerts
- Full-screen mode
- Dark mode suitable for kitchens
- Touchscreen interaction
- Offline recovery where possible

Kitchen staff should be able to:

- Accept an order
- Start preparation
- Pause preparation
- Mark individual items as preparing
- Mark individual items as ready
- Mark the full order as ready
- Send an order back for clarification
- Flag missing ingredients
- Mark an item as unavailable
- Request waiter support
- Reprint a ticket
- View previous orders
- Undo an accidental status change, subject to permissions

When preparation starts, the order should visually change status. For example:

- Grey: Waiting to start
- Blue: Preparing
- Amber: Approaching SLA
- Red: SLA exceeded
- Green: Ready
- Purple: Waiting for waiter collection
- Completed state: Delivered or closed

Make these colours configurable. Also include text and icons so users are not dependent on
colour alone.

## 12. Kitchen Stations and Screen Management

The restaurant must be able to create multiple preparation stations, such as: main kitchen,
grill, fry station, pizza station, dessert station, bar, cold drinks, coffee station,
pastry section, collection point.

Each menu item should be assigned to one or more stations.

Administrators must be able to configure each screen to show:

- All orders
- Main courses only
- Desserts only
- Drinks only
- A selected preparation station
- A selected branch
- A selected floor
- Selected order types
- Selected service periods
- Ready orders
- Delayed orders
- Priority orders

Screen settings should include: device name, screen location, assigned station, display
layout, number of columns, font size, sound settings, SLA settings, auto-refresh settings,
full-screen mode, user access, backup station, printer assignment.

## 13. Kitchen Timers and SLA Management

The platform must include configurable preparation timers and SLAs.

Administrators should be able to set:

- Default preparation time
- Product preparation time
- Category preparation time
- Station preparation time
- Course preparation time
- Branch-specific preparation time
- Peak-hour SLAs
- Different weekday and weekend SLAs
- Warning thresholds
- Escalation thresholds

Kitchen staff should be able to start a timer when preparation begins.

The system should show: time since order submission, time since preparation started,
target preparation time, remaining time, time overdue, station delay, full-table
coordination time.

The system should alert relevant users when:

- An order is approaching its SLA
- An order exceeds its SLA
- One station is delaying a complete table order
- Food has been ready too long
- A waiter has not collected a ready order
- A customer has been waiting too long

The platform should record SLA performance for reporting.

## 14. Course and Table Coordination

The platform should support courses, including starters, main courses, desserts, drinks,
and custom courses.

Customers or staff should be able to choose whether items should be:

- Served as soon as ready
- Served together
- Held until all items are ready
- Served by course
- Sent after a selected delay

Kitchen screens should show dependencies between stations. For example, if a main course
includes items from the grill and fryer, the system should help coordinate them so they
are completed at approximately the same time.

## 15. Waiter Interface

Create a waiter interface designed for mobile phones, handheld devices, tablets, and large
waiter station screens.

Waiters should have a holistic view of:

- Assigned tables
- Table status
- New customers seated
- Orders awaiting acceptance
- Orders being prepared
- Items ready for collection
- Items waiting too long
- Tables requesting assistance
- Tables requesting the bill
- Tables with failed payments
- Tables requiring a satisfaction check
- Tables ready for cleaning
- Reservations arriving soon

Waiters should be able to:

- Open a table
- Add guests
- Add an order
- Edit an order
- Add notes
- Send an order to the kitchen
- Move an order
- Merge or split tables
- Mark items as delivered
- Request a re-fire
- Cancel an item with permission
- Apply an authorised discount
- Request manager approval
- Record cash or terminal payment
- Reprint a receipt
- Close a table
- Record customer feedback
- Mark a table as cleaned

## 16. Waiter Check-Back and Service Tasks

The system should automatically create service tasks for waiters. Examples include:

- Greet the table
- Take a drink order
- Check whether food has arrived
- Check satisfaction after delivery
- Offer additional drinks
- Offer dessert
- Request feedback
- Present the bill
- Check whether the table needs cleaning

The restaurant should be able to configure when these tasks appear. For example: check the
table five minutes after food delivery; check again 15 minutes later; offer dessert after
main courses are completed; alert the waiter when drinks may need replenishing.

Waiters should be able to record: completed, customer satisfied, customer reported an
issue, manager required, replacement requested, follow-up required, customer declined
assistance.

Management reporting should show whether required customer check-backs were completed.

## 17. Thermal Printer and Ticket Printing

Support restaurant thermal receipt and kitchen ticket printers rather than A4 printers.

The system should support common printer standards and connectivity methods, including:
ESC/POS-compatible printers, Ethernet printers, Wi-Fi printers, USB printers, Bluetooth
printers where suitable, cloud print gateway, local print agent, network print server.

Printer management should support:

- Printer name
- Printer location
- Branch
- Assigned station
- Assigned menu categories
- Paper width
- Number of copies
- Automatic printing
- Manual reprinting
- Backup printer
- Print failure alerts
- Printer health status
- Test print
- Kitchen ticket template
- Customer receipt template

Orders should be routed automatically to the correct printer. For example: main courses to
the kitchen printer, drinks to the bar printer, desserts to the dessert printer, final
receipts to the front desk printer.

Recommend suitable commercial thermal printer specifications for kitchen use, such as:
80 mm thermal paper, Ethernet connectivity, fast print speed, automatic cutter, ESC/POS
support, splash-resistant kitchen model where required, loud buzzer option, reliable local
network operation.

Keep printer brands configurable rather than building the system around one manufacturer.

## 18. CMS and Media Library

Create a content management system for managing: homepage content, restaurant
descriptions, branch information, opening hours, menu content, product descriptions,
product images, promotional banners, special offers, reservation content, legal pages,
allergen notices, privacy policy, terms and conditions, contact information, social media
links.

The media library should support:

- Image upload
- Image cropping
- Image compression
- Multiple image sizes
- Image tags
- Folders
- Search
- Alt text
- Usage tracking
- Duplicate detection
- Video upload or embedding
- Brand assets
- Archived files
- Permission-controlled access

## 19. CRM and Customer Management

Create a CRM module that records customer interactions and behaviour where the customer
has provided appropriate consent.

Customer records may include: name, email address, mobile number, WhatsApp number,
registration date, branch visits, visit frequency, last visit, total spend, average spend,
favourite items, favourite branch, favourite dining time, order history, booking history,
promotions used, loyalty points, feedback, complaints, dietary preferences, communication
preferences, consent records, unsubscribe status.

The CRM should support customer segmentation, including:

- New customers
- Returning customers
- Frequent customers
- High-spending customers
- Inactive customers
- Birthday customers
- Customers who prefer certain products
- Customers who visit selected branches
- Customers who have not returned within a selected period

The platform must follow relevant privacy and data-protection requirements.

## 20. Marketing and Promotions

Create a marketing module that allows restaurants to create and send targeted promotions.

Promotion types should include: percentage discount, fixed discount, free item, buy one
get one free, meal bundle, happy hour, birthday offer, welcome offer, loyalty reward,
branch-specific promotion, time-limited promotion, product-specific promotion,
minimum-spend promotion, customer-segment promotion, referral promotion, voucher code,
QR campaign.

Marketing channels may include: email, WhatsApp, SMS, push notification for registered
users, website banner, customer account, social media link or campaign export.

The system should track: messages sent, messages delivered, messages opened where
available, links clicked, vouchers redeemed, revenue generated, customers returned,
campaign cost, campaign return on investment.

Marketing messages should only be sent to customers with valid consent.

## 21. Loyalty and Rewards

Include an optional loyalty module that supports:

- Points per amount spent
- Points per visit
- Tiered memberships
- Birthday rewards
- Referral rewards
- Product rewards
- Branch-specific rewards
- Digital membership cards
- Voucher generation
- Reward expiry
- Manual adjustments with audit history

The restaurant should be able to enable or disable this module.

## 22. Reservations and Online Booking

Create a reservation module available through the restaurant website.

Customers should be able to:

- Select a branch
- Select a date
- Select a time
- Enter party size
- Choose indoor or outdoor seating
- Add accessibility requirements
- Add dietary notes
- Add celebration details
- Request a high chair
- Request a specific area
- Create an account
- Continue as a guest
- Pay a deposit where required
- Receive confirmation
- Modify a booking
- Cancel a booking
- Join a waiting list
- Receive reminders
- Add the booking to their calendar

The system should support:

- Table availability
- Seating duration
- Buffer time
- Maximum capacity
- Table combinations
- Overbooking rules
- Deposit rules
- Cancellation rules
- No-show tracking
- Waiting lists
- Walk-ins
- Booking sources
- Booking notes
- Automated reminders
- Reservation-to-table conversion
- Pre-ordering for a reservation

Staff should have a visual reservation diary and floor-plan view.

## 23. Restaurant Website

Create a clean, modern and responsive restaurant website. The initial website may be
simple, but the architecture must allow future expansion.

The website should include: homepage, restaurant information, branches, digital menu,
reservations, offers, loyalty registration, customer login, guest ordering, contact page,
opening hours, directions, social media links, allergen information, privacy policy, terms
and conditions.

The website should allow customers to: browse without logging in, create an account, log
in, make a reservation, view menus, view promotions, view loyalty rewards, access previous
receipts, update preferences.

## 24. Reporting and Analytics

Create a comprehensive reporting and analytics module.

The dashboard should show: today's revenue, revenue by hour, revenue by branch, revenue by
floor, revenue by table, revenue by waiter, revenue by order type, revenue by category,
revenue by product, drinks revenue, food revenue, dessert revenue, alcoholic drinks
revenue, non-alcoholic drinks revenue, discounts, promotions, taxes, service charges,
tips, refunds, failed payments, average order value, average spend per guest, table
turnover, number of guests, number of orders, number of bookings, no-shows, customer
registration rate, returning customer rate, promotion redemption rate.

Operational reporting should include: average order acceptance time, average preparation
time, average delivery time, SLA compliance, delayed orders, orders delayed by station,
food waiting for collection, waiter collection time, table check-back completion,
cancelled items, refunded items, re-fired items, sold-out products, printer failures,
screen outages.

Reports should support: date filters, branch filters, category filters, product filters,
waiter filters, station filters, comparison with previous periods, export to Excel, export
to CSV, export to PDF, scheduled email reports, role-based dashboard access.

## 25. Administration and Role-Based Access

Create an administration portal with role-based access control.

Example roles may include: platform super administrator, restaurant group administrator,
branch manager, restaurant manager, duty manager, kitchen manager, chef, bar staff,
dessert staff, waiter, host, cashier, marketing user, CRM user, finance user,
reporting-only user, content editor, support user.

Administrators should be able to: create users, assign roles, assign branches, assign
floors, assign stations, set permissions, disable accounts, require password resets, view
login history, review audit logs, configure approval workflows.

Sensitive actions should require additional permissions or manager approval, including:
cancelling paid orders, issuing refunds, applying large discounts, editing completed
orders, deleting customer data, exporting customer data, changing payment settings,
editing tax settings.

## 26. Restaurant Setup Wizard

Create a guided restaurant setup process covering:

1. Restaurant details
2. Branch details
3. Opening hours
4. Taxes
5. Service charges
6. Payment provider
7. Floors and areas
8. Tables
9. QR codes
10. Menus
11. Categories
12. Products
13. Modifiers
14. Preparation stations
15. Kitchen screens
16. Printers
17. Waiter sections
18. Users and roles
19. Reservation settings
20. Receipt templates
21. Branding
22. Marketing consent settings
23. Test order
24. Go-live readiness check

## 27. Notifications and Alerts

The platform should support notifications for: new orders, orders awaiting acceptance,
orders approaching SLA, orders exceeding SLA, food ready, food waiting too long, waiter
collection required, customer assistance request, bill request, payment failure, refund
request, product sold out, printer offline, screen offline, new booking, booking
cancellation, customer arrival, no-show risk, manager approval required.

Notifications may be delivered through: in-app notification, screen alert, audio alert,
email, SMS, WhatsApp, push notification.

Notification rules should be configurable.

## 28. Future Delivery Integrations

Build an integration layer for future connections with third-party delivery platforms such
as Uber Eats, Deliveroo, Just Eat, and other regional delivery providers.

The future integration architecture should support:

- Importing delivery orders
- Mapping third-party products to internal products
- Sending orders to the kitchen
- Updating preparation status
- Updating availability
- Pausing products
- Synchronising prices where supported
- Handling cancellations
- Recording commissions
- Recording delivery-platform revenue
- Reporting by channel

Do not tightly integrate the core platform with one delivery provider. Use adapters or
connectors so new providers can be added later.

## 29. Integration and API Layer

Create a secure and documented API layer for future integration with: payment gateways,
POS systems, accounting platforms, inventory systems, delivery platforms, loyalty
platforms, email providers, SMS providers, WhatsApp providers, social media platforms,
reservation platforms, kitchen hardware, thermal printers, customer displays, digital
signage, business intelligence platforms.

Use webhooks and event-driven processing where appropriate.

## 30. Security and Compliance

Include: secure authentication, multi-factor authentication for administrators, role-based
access control, encrypted communication, encryption of sensitive stored data, secure
session management, rate limiting, audit logs, fraud monitoring, secure payment
tokenisation, privacy and consent management, data retention rules, data deletion tools,
backup and recovery, disaster recovery, monitoring and alerting, environment separation,
secure API keys, protection against common web vulnerabilities.

Do not store raw customer card information.

## 31. Reliability and Offline Behaviour

The restaurant may temporarily lose internet access, so consider limited offline and
recovery behaviour.

The system should: clearly show connection status, retry failed requests safely, avoid
duplicate orders, avoid duplicate payments, cache essential menu information where
appropriate, queue supported kitchen actions, recover screen state after reconnection,
record reconciliation issues, alert management when devices are offline.

Payment processing should only be completed offline where the selected payment provider
and local regulations support it.

## 32. UX/UI Requirements

The UX/UI must be treated as a core requirement rather than an afterthought.

**Customer mobile experience:** fast loading, clear product photography, simple category
navigation, sticky basket access, easy modifier selection, clear allergen warnings,
one-handed usability, minimal typing, large buttons, accessible contrast, clear order
progress, simple bill splitting, transparent pricing, no confusing redirects, consistent
design, responsive layouts.

**Kitchen screen experience:** large order cards, large buttons, minimal text entry, high
contrast, glanceable timers, clear table numbers, clear item quantities, clear allergy
warnings, clear modifier instructions, status colours and labels, fast touch interactions,
easy filtering, full-screen use, visibility from a distance.

**Waiter experience:** priority-based task list, table map, ready-order notifications,
assistance requests, bill requests, check-back reminders, minimal navigation, fast status
updates, clear overdue indicators.

Create reusable design components and a consistent design system for all interfaces.

## 33. Accessibility

The platform should support: keyboard navigation, screen readers, adjustable text size,
high-contrast modes, colour-blind-friendly status indicators, text labels alongside icons,
accessible forms, meaningful error messages, touch targets suitable for different users,
multiple languages, right-to-left language support for future use.

## 34. Development Phases

**Phase 1: Core Restaurant MVP** — restaurant setup, branch setup, floor and table
management, QR code generation, digital menu, guest ordering, shared table sessions, basic
payments, basic bill splitting, kitchen display, waiter interface, basic thermal printing,
digital receipts, user roles, basic reporting.

**Phase 2: Enhanced Operations** — advanced kitchen stations, SLA management, course
coordination, advanced bill splitting, reservations, customer accounts, CRM, loyalty, CMS,
marketing, advanced reporting, multi-branch support.

**Phase 3: Integrations and Scale** — third-party delivery integrations, POS integration,
accounting integration, inventory integration, franchise management, advanced analytics,
central restaurant group management, white-labelling, public API, integration marketplace.

## 35. Required Architecture Deliverables

Before developing the complete platform, produce:

1. Product requirements document
2. Recommended technical architecture
3. System context diagram
4. Container or service architecture diagram
5. Module dependency diagram
6. Customer ordering journey
7. Shared table-session journey
8. Bill-splitting workflow
9. Kitchen order workflow
10. Waiter workflow
11. Reservation workflow
12. Payment workflow
13. Data model and entity relationship diagram
14. API structure
15. Event and notification model
16. User roles and permission matrix
17. Screen inventory
18. Wireframes
19. High-fidelity UX/UI designs
20. Development roadmap
21. MVP scope
22. Testing strategy
23. Security model
24. Deployment architecture
25. Scalability strategy
26. Monitoring and support strategy

## 36. Core Data Entities

Design the data model to include entities such as: restaurant group, restaurant, branch,
floor, restaurant area, table, QR code, table session, guest, customer, customer account,
reservation, menu, menu category, product, product variant, modifier group, modifier,
ingredient, allergen, order, order item, course, kitchen station, kitchen screen, printer,
preparation task, waiter task, payment, payment allocation, refund, receipt, promotion,
voucher, loyalty account, loyalty transaction, marketing campaign, consent record, staff
user, role, permission, notification, SLA rule, audit log.

## 37. Testing Requirements

Include automated and manual testing for: QR code scanning, shared table joining,
simultaneous ordering, duplicate order prevention, menu availability, product modifiers,
allergens, order routing, kitchen status changes, touchscreen operation, printer routing,
printer failures, split payments, partial payments, duplicate payment prevention, refunds,
reservation capacity, permissions, CRM consent, marketing opt-out, multi-branch isolation,
high order volume, poor internet connectivity, mobile responsiveness, accessibility,
security, disaster recovery.

Test realistic scenarios where many customers at the same table submit orders or payments
at the same time.

## 38. Final Design Principle

The system should not be designed as one large, tightly connected application. It should
be built as a modular restaurant platform with clearly separated business areas, reusable
APIs, configurable workflows and an event-driven approach where appropriate.

The immediate focus should be: mobile QR ordering, shared table sessions, flexible bill
splitting, secure payment, kitchen preparation screens, waiter service screens, floor and
table management, menu administration, clear reporting.

The architecture must make it easy to introduce additional modules later without
rebuilding the core system.

Before writing production code, review the full scope, identify missing business
scenarios, recommend additional modules, define the MVP, propose the architecture and
present the implementation plan in clear phases. Do not begin by generating random pages
or disconnected features. Start with the platform architecture, data model, module
boundaries, user journeys and UX/UI system. Once these are approved, proceed with
implementation module by module.
