=== WooCommerce Tax Doc Generator ===
Contributors: taxdoclabs
Tags: woocommerce, tax, invoice, vat, gst, sales tax, receipt, pdf
Requires at least: 5.8
Tested up to: 6.9
Stable tag: 1.0.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Auto-generate tax invoices and receipts per jurisdiction. Supports US sales tax, EU VAT, UK VAT, and AU GST.

== Description ==

**WooCommerce Tax Doc Generator** automatically creates professional tax invoices for every WooCommerce order, with the correct tax labels and formatting for each jurisdiction.

= Key Features (Free) =

* 🧾 **Auto-Generate Invoices** — Creates tax documents when orders are completed
* 🌍 **Multi-Jurisdiction** — Detects US sales tax, EU VAT, UK VAT, AU GST automatically
* 📋 **Professional Templates** — Clean, printable HTML invoice with your company branding
* 🔢 **Sequential Numbering** — Configurable prefix and auto-incrementing invoice numbers
* 📧 **Email Integration** — Invoice number included in customer completion emails
* 👤 **My Account** — Customers can download invoices from their account page
* 🏢 **Company Branding** — Add your logo, address, and tax ID
* ⚡ **HPOS Compatible** — Works with WooCommerce High-Performance Order Storage

= Pro Features ($79/year) =

* 📄 True PDF Export with DOMPDF/TCPDF
* 📦 Bulk PDF Export — Download all invoices as ZIP
* 🎨 Custom Invoice Templates — Design your own layouts
* 🌐 Multi-jurisdiction tax rate validation
* 🔄 Credit notes / refund documents
* 📊 Tax summary reports by jurisdiction and period
* 📧 Auto-attach PDF to emails
* 📧 Priority Support

== Installation ==

1. Install and activate WooCommerce first
2. Upload `woo-tax-docs` to `/wp-content/plugins/`
3. Activate the plugin
4. Go to WooCommerce → Tax Documents to configure company details
5. Invoices will auto-generate when orders are marked complete

== Frequently Asked Questions ==

= Does this calculate taxes? =

No. This plugin generates tax documents based on the taxes WooCommerce already calculated. Configure your tax rates in WooCommerce → Settings → Tax.

= What format are the invoices? =

Free version generates HTML invoices (printable, saveable). Pro version adds true PDF export.

= Does it work with WooCommerce HPOS? =

Yes! Fully compatible with High-Performance Order Storage.

= Can customers download their invoices? =

Yes, a download link appears in My Account → Orders.

== Screenshots ==

1. Professional HTML tax invoice with jurisdiction detection
2. Admin settings — Company details and invoice configuration
3. Invoice list with download links
4. Order column showing invoice numbers
5. Customer My Account invoice download

== Changelog ==

= 1.0.0 =
* Initial release
* Auto-generate invoices on order completion
* US/EU/UK/AU jurisdiction detection
* HTML invoice template with company branding
* Sequential invoice numbering
* Email integration
* My Account download link
* HPOS compatibility

== Upgrade Notice ==

= 1.0.0 =
Initial release. Configure your company details and start generating tax invoices automatically.
