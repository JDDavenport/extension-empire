<?php
/**
 * Plugin Name: Accessibility Checker Lite
 * Plugin URI: https://accessibilitycheckerlite.com
 * Description: Scans pages for WCAG 2.1 AA violations. Highlights alt text, heading structure, and color contrast issues right in the admin bar.
 * Version: 1.0.0
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Author: A11y Check Labs
 * Author URI: https://a11ychecklabs.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: accessibility-checker-lite
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'ACL_VERSION', '1.0.0' );
define( 'ACL_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'ACL_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'ACL_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

require_once ACL_PLUGIN_DIR . 'includes/class-acl-settings.php';
require_once ACL_PLUGIN_DIR . 'includes/class-acl-scanner.php';
require_once ACL_PLUGIN_DIR . 'includes/class-acl-admin-bar.php';
require_once ACL_PLUGIN_DIR . 'includes/class-acl-ajax.php';

final class Accessibility_Checker_Lite {

	private static $instance = null;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'plugins_loaded', array( $this, 'load_textdomain' ) );
		add_action( 'init', array( $this, 'init' ) );
		register_activation_hook( __FILE__, array( $this, 'activate' ) );
	}

	public function load_textdomain() {
	}

	public function init() {
		new ACL_Settings();
		new ACL_Admin_Bar();
		new ACL_Ajax();
	}

	public function activate() {
		$defaults = array(
			'enabled'              => 1,
			'check_alt_text'       => 1,
			'check_headings'       => 1,
			'check_color_contrast' => 1,
			'check_link_text'      => 1,
			'check_form_labels'    => 1,
			'check_aria'           => 0, // Pro
			'check_tables'         => 0, // Pro
			'check_media'          => 0, // Pro
			'highlight_issues'     => 1,
			'admin_bar_summary'    => 1,
			'post_types'           => array( 'post', 'page' ),
		);
		if ( ! get_option( 'acl_settings' ) ) {
			add_option( 'acl_settings', $defaults );
		}

		// Create results table
		global $wpdb;
		$table = $wpdb->prefix . 'acl_scan_results';
		$charset = $wpdb->get_charset_collate();
		$sql = "CREATE TABLE IF NOT EXISTS $table (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			post_id bigint(20) unsigned NOT NULL,
			url varchar(500) NOT NULL,
			issue_type varchar(50) NOT NULL,
			severity varchar(20) NOT NULL DEFAULT 'warning',
			element text NOT NULL,
			message text NOT NULL,
			wcag_ref varchar(20) DEFAULT '',
			scanned_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			KEY post_id (post_id),
			KEY issue_type (issue_type)
		) $charset;";
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql );
	}
}

Accessibility_Checker_Lite::instance();
