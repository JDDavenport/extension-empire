<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class CCS_Banner {

	public function __construct() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		add_action( 'wp_footer', array( $this, 'render_banner' ) );
		add_action( 'wp_ajax_ccs_save_consent', array( $this, 'ajax_save_consent' ) );
		add_action( 'wp_ajax_nopriv_ccs_save_consent', array( $this, 'ajax_save_consent' ) );
	}

	public function enqueue_assets() {
		if ( ! CCS_Geo::should_show_banner() ) {
			return;
		}
		wp_enqueue_style( 'ccs-banner', CCS_PLUGIN_URL . 'assets/css/banner.css', array(), CCS_VERSION );
		wp_enqueue_script( 'ccs-banner', CCS_PLUGIN_URL . 'assets/js/banner.js', array(), CCS_VERSION, true );

		$opts = get_option( 'ccs_settings', array() );
		wp_localize_script( 'ccs-banner', 'ccsConfig', array(
			'ajaxUrl'     => admin_url( 'admin-ajax.php' ),
			'nonce'       => wp_create_nonce( 'ccs_consent_nonce' ),
			'position'    => $opts['banner_position'] ?? 'bottom',
			'style'       => $opts['banner_style'] ?? 'bar',
			'cookieExpiry' => $opts['cookie_expiry'] ?? 365,
			'categories'  => $opts['categories'] ?? array(),
		) );
	}

	public function render_banner() {
		if ( ! CCS_Geo::should_show_banner() ) {
			return;
		}

		$opts = get_option( 'ccs_settings', array() );
		$cats = $opts['categories'] ?? array();
		$position = esc_attr( $opts['banner_position'] ?? 'bottom' );
		$style = esc_attr( $opts['banner_style'] ?? 'bar' );
		?>
		<div id="ccs-banner" class="ccs-banner ccs-position-<?php echo $position; ?> ccs-style-<?php echo $style; ?>" role="dialog" aria-label="<?php esc_attr_e( 'Cookie Consent', 'cookie-consent-shield' ); ?>" style="display:none;background:<?php echo esc_attr( $opts['bg_color'] ?? '#1a1a2e' ); ?>;color:<?php echo esc_attr( $opts['text_color'] ?? '#ffffff' ); ?>;">
			<div class="ccs-banner-inner">
				<div class="ccs-message">
					<?php echo wp_kses_post( $opts['message'] ?? '' ); ?>
					<?php if ( ! empty( $opts['privacy_policy_url'] ) ) : ?>
						<a href="<?php echo esc_url( $opts['privacy_policy_url'] ); ?>" target="_blank" rel="noopener" style="color:<?php echo esc_attr( $opts['text_color'] ?? '#ffffff' ); ?>;"><?php esc_html_e( 'Privacy Policy', 'cookie-consent-shield' ); ?></a>
					<?php endif; ?>
				</div>

				<!-- Category toggles panel (hidden by default) -->
				<div id="ccs-categories" class="ccs-categories" style="display:none;">
					<?php foreach ( $cats as $key => $cat ) : ?>
						<label class="ccs-category">
							<input type="checkbox" name="ccs_cat_<?php echo esc_attr( $key ); ?>" value="1"
								<?php echo ! empty( $cat['required'] ) ? 'checked disabled' : ''; ?>
								data-category="<?php echo esc_attr( $key ); ?>" />
							<?php echo esc_html( $cat['label'] ); ?>
							<?php if ( ! empty( $cat['required'] ) ) : ?>
								<span class="ccs-required"><?php esc_html_e( '(Required)', 'cookie-consent-shield' ); ?></span>
							<?php endif; ?>
						</label>
					<?php endforeach; ?>
				</div>

				<div class="ccs-buttons">
					<button id="ccs-accept-all" class="ccs-btn ccs-btn-accept" style="background:<?php echo esc_attr( $opts['btn_accept_bg'] ?? '#0f3460' ); ?>;color:<?php echo esc_attr( $opts['btn_accept_color'] ?? '#fff' ); ?>;">
						<?php echo esc_html( $opts['accept_text'] ?? __( 'Accept All', 'cookie-consent-shield' ) ); ?>
					</button>
					<button id="ccs-reject" class="ccs-btn ccs-btn-reject" style="background:<?php echo esc_attr( $opts['btn_reject_bg'] ?? '#e94560' ); ?>;color:<?php echo esc_attr( $opts['btn_reject_color'] ?? '#fff' ); ?>;">
						<?php echo esc_html( $opts['reject_text'] ?? __( 'Reject', 'cookie-consent-shield' ) ); ?>
					</button>
					<button id="ccs-settings-btn" class="ccs-btn ccs-btn-settings">
						<?php echo esc_html( $opts['settings_text'] ?? __( 'Cookie Settings', 'cookie-consent-shield' ) ); ?>
					</button>
					<button id="ccs-save-prefs" class="ccs-btn ccs-btn-accept" style="display:none;background:<?php echo esc_attr( $opts['btn_accept_bg'] ?? '#0f3460' ); ?>;color:<?php echo esc_attr( $opts['btn_accept_color'] ?? '#fff' ); ?>;">
						<?php esc_html_e( 'Save Preferences', 'cookie-consent-shield' ); ?>
					</button>
				</div>
			</div>
		</div>
		<?php
	}

	public function ajax_save_consent() {
		check_ajax_referer( 'ccs_consent_nonce', 'nonce' );

		$consent = sanitize_text_field( wp_unslash( $_POST['consent'] ?? '' ) );
		$ip = CCS_Geo::get_visitor_ip();
		$ip_hash = hash( 'sha256', $ip . wp_salt() );
		$geo = CCS_Geo::get_visitor_geo();

		global $wpdb;
		$table = $wpdb->prefix . 'ccs_consent_log';
		$wpdb->insert( $table, array(
			'ip_hash'      => $ip_hash,
			'consent_data' => $consent,
			'geo_region'   => $geo['country'],
			'created_at'   => current_time( 'mysql' ),
		), array( '%s', '%s', '%s', '%s' ) );

		wp_send_json_success();
	}
}
