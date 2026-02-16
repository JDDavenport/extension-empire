=== Accessibility Checker Lite ===
Contributors: a11ychecklabs
Tags: accessibility, wcag, a11y, ada, compliance, alt text, headings, color contrast
Requires at least: 5.8
Tested up to: 6.9
Stable tag: 1.0.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Scan pages for WCAG 2.1 AA violations. Check alt text, heading structure, color contrast, link text, and form labels.

== Description ==

**Accessibility Checker Lite** scans your WordPress pages for common accessibility issues and displays results right in the admin bar.

= Free Checks =

* 🖼️ **Alt Text** — Detects missing or empty alt attributes on images (WCAG 1.1.1)
* 📑 **Heading Structure** — Finds skipped heading levels, empty headings, h1 in content (WCAG 1.3.1, 2.4.6)
* 🎨 **Color Contrast** — Checks inline color styles for WCAG AA contrast ratio (4.5:1) (WCAG 1.4.3)
* 🔗 **Link Text** — Flags empty links and non-descriptive text like "click here" (WCAG 2.4.4)
* 📝 **Form Labels** — Verifies form inputs have associated labels or aria-label (WCAG 4.1.2)

= Features =

* ♿ **Admin Bar Summary** — See issue count on every page while logged in
* 🔴 **Visual Highlights** — Issues outlined on frontend for admins (red = error, yellow = warning)
* 📊 **Results Dashboard** — View all issues across your site sorted by severity
* 🔄 **One-Click Scan** — Scan up to 100 pages at once
* 🎯 **Per-Page Scanning** — Re-scan individual pages from the admin bar
* 🔧 **Configurable** — Enable/disable individual checks, choose post types

= Pro Features ($59/year) =

* Full WCAG 2.1 AA + AAA audit
* ARIA role/attribute validation
* Table structure checks
* Media accessibility (video captions, audio descriptions)
* Scheduled automatic scans
* PDF accessibility reports
* Unlimited page scanning
* Priority support

== Installation ==

1. Upload `accessibility-checker-lite` to `/wp-content/plugins/`
2. Activate the plugin
3. Go to Tools → Accessibility Checker to configure
4. Click "Run Scan" to scan your published pages
5. View the admin bar on any page to see issue counts

== Frequently Asked Questions ==

= Does this guarantee ADA/WCAG compliance? =

This tool helps identify common issues but cannot guarantee full compliance. A complete accessibility audit should include manual testing with screen readers and keyboard navigation.

= Will visitors see the issue highlights? =

No. Visual highlights and the admin bar summary are only visible to logged-in administrators.

= How many pages can I scan? =

Free version scans up to 100 published pages per scan. Pro removes this limit.

= Does it check the entire rendered page? =

It checks the post/page content. Theme elements (header, footer, sidebar) are not scanned in the free version.

== Screenshots ==

1. Admin bar showing accessibility issue count
2. Visual highlighting of issues on frontend (admin only)
3. Results dashboard with error/warning summary
4. Detailed issue list for a specific page
5. Settings page with configurable checks
6. One-click bulk scan interface

== Changelog ==

= 1.0.0 =
* Initial release
* Alt text checking (WCAG 1.1.1)
* Heading structure validation (WCAG 1.3.1, 2.4.6)
* Color contrast analysis (WCAG 1.4.3)
* Link text quality checking (WCAG 2.4.4)
* Form label verification (WCAG 4.1.2)
* Admin bar issue summary
* Frontend visual highlighting for admins
* Results dashboard with per-page detail view
* Bulk scan up to 100 pages

== Upgrade Notice ==

= 1.0.0 =
Initial release. Start scanning your site for accessibility issues today.
