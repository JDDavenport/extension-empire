<?php
/**
 * Plugin Name: WooCommerce Tax Doc Generator
 * Plugin URI: https://wootaxdocs.com
 * Description: Auto-generates tax invoices and receipts per jurisdiction. Supports US sales tax, EU VAT, UK VAT, AU GST. PDF export.
 * Version: 1.0.0
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Author: Tax Doc Labs
 * Author URI: https://taxdoclabs.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: woo-tax-docs
 * Domain Path: /languages
 * WC requires at least: 6.0
 * WC tested up to: 9.5
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'WTD_VERSION', '1.0.0' );
define( 'WTD_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'WTD_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'WTD_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

/**
 * Check for WooCommerce dependency.
 */
function wtd_check_woocommerce() {
	if ( ! class_exists( 'WooCommerce' ) ) {
		add_action( 'admin_notices', function() {
			echo '<div class="error"><p>' . esc_html__( 'WooCommerce Tax Doc Generator requires WooCommerce to be installed and active.', 'woo-tax-docs' ) . '</p></div>';
		} );
		return false;
	}
	return true;
}

add_action( 'plugins_loaded', 'wtd_init' );

function wtd_init() {
	if ( ! wtd_check_woocommerce() ) {
		return;
	}


	require_once WTD_PLUGIN_DIR . 'includes/class-wtd-settings.php';
	require_once WTD_PLUGIN_DIR . 'includes/class-wtd-invoice.php';
	require_once WTD_PLUGIN_DIR . 'includes/class-wtd-pdf.php';
	require_once WTD_PLUGIN_DIR . 'includes/class-wtd-tax-calculator.php';

	new WTD_Settings();
	new WTD_Invoice();
}

register_activation_hook( __FILE__, 'wtd_activate' );

function wtd_activate() {
	$defaults = array(
		'company_name'    => get_bloginfo( 'name' ),
		'company_address' => '',
		'company_tax_id'  => '',
		'company_logo'    => '',
		'invoice_prefix'  => 'INV-',
		'next_number'     => 1001,
		'auto_generate'   => 1,
		'tax_label_us'    => __( 'Sales Tax', 'woo-tax-docs' ),
		'tax_label_eu'    => __( 'VAT', 'woo-tax-docs' ),
		'tax_label_uk'    => __( 'VAT', 'woo-tax-docs' ),
		'tax_label_au'    => __( 'GST', 'woo-tax-docs' ),
		'footer_text'     => __( 'Thank you for your purchase.', 'woo-tax-docs' ),
		'date_format'     => 'Y-m-d',
	);
	if ( ! get_option( 'wtd_settings' ) ) {
		add_option( 'wtd_settings', $defaults );
	}

	// Create invoices table
	global $wpdb;
	$table = $wpdb->prefix . 'wtd_invoices';
	$charset = $wpdb->get_charset_collate();
	$sql = "CREATE TABLE IF NOT EXISTS $table (
		id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
		order_id bigint(20) unsigned NOT NULL,
		invoice_number varchar(50) NOT NULL,
		jurisdiction varchar(10) NOT NULL DEFAULT '',
		tax_type varchar(20) NOT NULL DEFAULT '',
		tax_amount decimal(10,2) NOT NULL DEFAULT 0,
		total_amount decimal(10,2) NOT NULL DEFAULT 0,
		pdf_path varchar(500) DEFAULT '',
		created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (id),
		KEY order_id (order_id),
		UNIQUE KEY invoice_number (invoice_number)
	) $charset;";
	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	dbDelta( $sql );

	// Create upload directory
	$upload_dir = wp_upload_dir();
	$inv_dir = $upload_dir['basedir'] . '/woo-tax-docs/';
	if ( ! file_exists( $inv_dir ) ) {
		wp_mkdir_p( $inv_dir );
		file_put_contents( $inv_dir . '.htaccess', 'deny from all' );
		file_put_contents( $inv_dir . 'index.php', '<?php // Silence is golden.' );
	}
}

// Declare HPOS compatibility
add_action( 'before_woocommerce_init', function() {
	if ( class_exists( '\Automattic\WooCommerce\Utilities\FeaturesUtil' ) ) {
		\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
	}
} );
