=== Cookie Consent Shield ===
Contributors: shieldprivacylabs
Tags: cookie consent, gdpr, ccpa, cookie banner, privacy, compliance
Requires at least: 5.8
Tested up to: 6.9
Stable tag: 1.0.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

GDPR/CCPA compliant cookie consent banner with geo-detection. Auto-blocks scripts until consent. Fully customizable design.

== Description ==

**Cookie Consent Shield** is the easiest way to make your WordPress site compliant with GDPR, CCPA, and other cookie laws.

= Key Features (Free) =

* 🌍 **Geo-Detection** — Automatically shows banner only to visitors from regulated regions (EU, US/California)
* 🚫 **Script Blocking** — Blocks analytics and marketing scripts until the visitor gives consent
* 🎨 **Customizable Design** — Choose colors, position (bar, modal, floating), and button text
* 📋 **Consent Categories** — Let visitors choose between Necessary, Analytics, Marketing, and Preferences
* 📝 **Consent Logging** — Records all consent decisions with hashed IPs for compliance proof
* 🔒 **Privacy First** — No external services required, no data leaves your server
* 🌐 **Translation Ready** — Fully translatable with .po/.mo files

= Pro Features ($49/year) =

* 📊 Consent Analytics Dashboard — See accept/reject rates over time
* 🔄 A/B Testing — Test different banner messages and styles
* 🌍 Multi-Language Banners — Auto-detect visitor language
* 📧 Priority Support
* 🔄 Auto-scanner to detect all cookies on your site

== Installation ==

1. Upload `cookie-consent-shield` to `/wp-content/plugins/`
2. Activate the plugin through the Plugins menu
3. Go to Settings → Cookie Consent to configure
4. Add script patterns to block (e.g., google-analytics.com)
5. The banner will appear automatically for visitors from regulated regions

== Frequently Asked Questions ==

= Does this make my site GDPR compliant? =

This plugin helps with cookie consent requirements, which is one part of GDPR compliance. You should also have a privacy policy and handle personal data properly.

= How does geo-detection work? =

We use a free IP geolocation API to determine visitor country. Results are cached to minimize API calls. No personal data is stored or transmitted.

= Will this slow down my site? =

No. The banner assets are tiny (<5KB) and loaded asynchronously. Geo-detection results are cached.

= Does it work with caching plugins? =

The banner is rendered via JavaScript, so it works with all caching plugins including WP Super Cache, W3 Total Cache, and WP Rocket.

= Can I customize the banner text? =

Yes! Every piece of text is customizable from the settings page, and the plugin is fully translation-ready.

== Screenshots ==

1. Cookie consent banner (bottom bar style)
2. Cookie consent banner (modal style)
3. Category selection panel
4. Admin settings page — General
5. Admin settings page — Appearance with color pickers
6. Consent log viewer

== Changelog ==

= 1.0.0 =
* Initial release
* Cookie consent banner with 4 position options
* Geo-detection for EU and US visitors
* Script blocking by URL pattern
* Consent logging with hashed IPs
* Customizable colors and text
* Category-based consent (Necessary, Analytics, Marketing, Preferences)

== Upgrade Notice ==

= 1.0.0 =
Initial release. Install to make your site cookie-compliant.
