<?php
/**
 * Plugin Name: Cookie Consent Shield
 * Plugin URI: https://cookieconsentshield.com
 * Description: GDPR/CCPA compliant cookie consent banner with geo-detection. Auto-blocks scripts until user consent. Fully customizable.
 * Version: 1.0.0
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Author: Shield Privacy Labs
 * Author URI: https://shieldprivacylabs.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: cookie-consent-shield
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'CCS_VERSION', '1.0.0' );
define( 'CCS_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'CCS_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'CCS_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

require_once CCS_PLUGIN_DIR . 'includes/class-ccs-settings.php';
require_once CCS_PLUGIN_DIR . 'includes/class-ccs-banner.php';
require_once CCS_PLUGIN_DIR . 'includes/class-ccs-geo.php';
require_once CCS_PLUGIN_DIR . 'includes/class-ccs-script-blocker.php';

/**
 * Main plugin class.
 */
final class Cookie_Consent_Shield {

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
		register_deactivation_hook( __FILE__, array( $this, 'deactivate' ) );
	}

	public function load_textdomain() {
	}

	public function init() {
		new CCS_Settings();
		new CCS_Banner();
		new CCS_Script_Blocker();
	}

	public function activate() {
		$defaults = array(
			'enabled'            => 1,
			'banner_position'    => 'bottom',
			'banner_style'       => 'bar',
			'bg_color'           => '#1a1a2e',
			'text_color'         => '#ffffff',
			'btn_accept_color'   => '#16213e',
			'btn_accept_bg'      => '#0f3460',
			'btn_reject_color'   => '#ffffff',
			'btn_reject_bg'      => '#e94560',
			'message'            => __( 'We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.', 'cookie-consent-shield' ),
			'accept_text'        => __( 'Accept All', 'cookie-consent-shield' ),
			'reject_text'        => __( 'Reject Non-Essential', 'cookie-consent-shield' ),
			'settings_text'      => __( 'Cookie Settings', 'cookie-consent-shield' ),
			'privacy_policy_url' => '',
			'cookie_expiry'      => 365,
			'geo_detection'      => 1,
			'show_in_eu'         => 1,
			'show_in_us'         => 1,
			'show_globally'      => 0,
			'blocked_scripts'    => '',
			'categories'         => array(
				'necessary'   => array( 'label' => __( 'Necessary', 'cookie-consent-shield' ), 'required' => true ),
				'analytics'   => array( 'label' => __( 'Analytics', 'cookie-consent-shield' ), 'required' => false ),
				'marketing'   => array( 'label' => __( 'Marketing', 'cookie-consent-shield' ), 'required' => false ),
				'preferences' => array( 'label' => __( 'Preferences', 'cookie-consent-shield' ), 'required' => false ),
			),
		);
		if ( ! get_option( 'ccs_settings' ) ) {
			add_option( 'ccs_settings', $defaults );
		}

		// Create consent log table
		global $wpdb;
		$table = $wpdb->prefix . 'ccs_consent_log';
		$charset = $wpdb->get_charset_collate();
		$sql = "CREATE TABLE IF NOT EXISTS $table (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			ip_hash varchar(64) NOT NULL,
			consent_data text NOT NULL,
			geo_region varchar(10) DEFAULT '',
			created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			KEY ip_hash (ip_hash)
		) $charset;";
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql );
	}

	public function deactivate() {
		// Clean up transients
		delete_transient( 'ccs_geo_cache' );
	}
}

Cookie_Consent_Shield::instance();
