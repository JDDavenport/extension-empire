<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class CCS_Settings {

	private $options;

	public function __construct() {
		$this->options = get_option( 'ccs_settings', array() );
		add_action( 'admin_menu', array( $this, 'add_menu' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
		add_filter( 'plugin_action_links_' . CCS_PLUGIN_BASENAME, array( $this, 'plugin_links' ) );
	}

	public function plugin_links( $links ) {
		$settings_link = '<a href="' . esc_url( admin_url( 'options-general.php?page=cookie-consent-shield' ) ) . '">' . esc_html__( 'Settings', 'cookie-consent-shield' ) . '</a>';
		array_unshift( $links, $settings_link );
		$links[] = '<a href="https://cookieconsentshield.com/pro" style="color:#0f3460;font-weight:bold;">' . esc_html__( 'Go Pro', 'cookie-consent-shield' ) . '</a>';
		return $links;
	}

	public function add_menu() {
		add_options_page(
			__( 'Cookie Consent Shield', 'cookie-consent-shield' ),
			__( 'Cookie Consent', 'cookie-consent-shield' ),
			'manage_options',
			'cookie-consent-shield',
			array( $this, 'render_settings_page' )
		);
	}

	public function enqueue_admin_assets( $hook ) {
		if ( 'settings_page_cookie-consent-shield' !== $hook ) {
			return;
		}
		wp_enqueue_style( 'wp-color-picker' );
		wp_enqueue_script( 'wp-color-picker' );
		wp_enqueue_style( 'ccs-admin', CCS_PLUGIN_URL . 'assets/css/admin.css', array(), CCS_VERSION );
		wp_enqueue_script( 'ccs-admin', CCS_PLUGIN_URL . 'assets/js/admin.js', array( 'jquery', 'wp-color-picker' ), CCS_VERSION, true );
	}

	public function register_settings() {
		register_setting( 'ccs_settings_group', 'ccs_settings', array( $this, 'sanitize_settings' ) );
	}

	public function sanitize_settings( $input ) {
		$sanitized = array();
		$sanitized['enabled']          = ! empty( $input['enabled'] ) ? 1 : 0;
		$sanitized['banner_position']  = sanitize_text_field( $input['banner_position'] ?? 'bottom' );
		$sanitized['banner_style']     = sanitize_text_field( $input['banner_style'] ?? 'bar' );
		$sanitized['bg_color']         = sanitize_hex_color( $input['bg_color'] ?? '#1a1a2e' );
		$sanitized['text_color']       = sanitize_hex_color( $input['text_color'] ?? '#ffffff' );
		$sanitized['btn_accept_color'] = sanitize_hex_color( $input['btn_accept_color'] ?? '#ffffff' );
		$sanitized['btn_accept_bg']    = sanitize_hex_color( $input['btn_accept_bg'] ?? '#0f3460' );
		$sanitized['btn_reject_color'] = sanitize_hex_color( $input['btn_reject_color'] ?? '#ffffff' );
		$sanitized['btn_reject_bg']    = sanitize_hex_color( $input['btn_reject_bg'] ?? '#e94560' );
		$sanitized['message']          = wp_kses_post( $input['message'] ?? '' );
		$sanitized['accept_text']      = sanitize_text_field( $input['accept_text'] ?? 'Accept All' );
		$sanitized['reject_text']      = sanitize_text_field( $input['reject_text'] ?? 'Reject' );
		$sanitized['settings_text']    = sanitize_text_field( $input['settings_text'] ?? 'Cookie Settings' );
		$sanitized['privacy_policy_url'] = esc_url_raw( $input['privacy_policy_url'] ?? '' );
		$sanitized['cookie_expiry']    = absint( $input['cookie_expiry'] ?? 365 );
		$sanitized['geo_detection']    = ! empty( $input['geo_detection'] ) ? 1 : 0;
		$sanitized['show_in_eu']       = ! empty( $input['show_in_eu'] ) ? 1 : 0;
		$sanitized['show_in_us']       = ! empty( $input['show_in_us'] ) ? 1 : 0;
		$sanitized['show_globally']    = ! empty( $input['show_globally'] ) ? 1 : 0;
		$sanitized['blocked_scripts']  = sanitize_textarea_field( $input['blocked_scripts'] ?? '' );

		// Categories stay as default structure
		$sanitized['categories'] = array(
			'necessary'   => array( 'label' => sanitize_text_field( $input['cat_necessary'] ?? 'Necessary' ), 'required' => true ),
			'analytics'   => array( 'label' => sanitize_text_field( $input['cat_analytics'] ?? 'Analytics' ), 'required' => false ),
			'marketing'   => array( 'label' => sanitize_text_field( $input['cat_marketing'] ?? 'Marketing' ), 'required' => false ),
			'preferences' => array( 'label' => sanitize_text_field( $input['cat_preferences'] ?? 'Preferences' ), 'required' => false ),
		);

		return $sanitized;
	}

	public function render_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$opts = get_option( 'ccs_settings', array() );
		?>
		<div class="wrap ccs-settings-wrap">
			<h1><?php esc_html_e( 'Cookie Consent Shield', 'cookie-consent-shield' ); ?></h1>

			<div class="ccs-pro-banner">
				<h3>🛡️ <?php esc_html_e( 'Upgrade to Pro', 'cookie-consent-shield' ); ?></h3>
				<p><?php esc_html_e( 'Get consent analytics, A/B testing, multi-language banners, and priority support.', 'cookie-consent-shield' ); ?></p>
				<a href="https://cookieconsentshield.com/pro" class="button button-primary" target="_blank"><?php esc_html_e( 'Go Pro — $49/year', 'cookie-consent-shield' ); ?></a>
			</div>

			<form method="post" action="options.php">
				<?php settings_fields( 'ccs_settings_group' ); ?>

				<h2 class="nav-tab-wrapper">
					<a class="nav-tab nav-tab-active" href="#general"><?php esc_html_e( 'General', 'cookie-consent-shield' ); ?></a>
					<a class="nav-tab" href="#appearance"><?php esc_html_e( 'Appearance', 'cookie-consent-shield' ); ?></a>
					<a class="nav-tab" href="#geo"><?php esc_html_e( 'Geo & Compliance', 'cookie-consent-shield' ); ?></a>
					<a class="nav-tab" href="#blocking"><?php esc_html_e( 'Script Blocking', 'cookie-consent-shield' ); ?></a>
				</h2>

				<!-- General -->
				<div id="general" class="ccs-tab-panel">
					<table class="form-table">
						<tr>
							<th><label for="ccs_enabled"><?php esc_html_e( 'Enable Banner', 'cookie-consent-shield' ); ?></label></th>
							<td><input type="checkbox" id="ccs_enabled" name="ccs_settings[enabled]" value="1" <?php checked( $opts['enabled'] ?? 1 ); ?> /></td>
						</tr>
						<tr>
							<th><label for="ccs_message"><?php esc_html_e( 'Banner Message', 'cookie-consent-shield' ); ?></label></th>
							<td><textarea id="ccs_message" name="ccs_settings[message]" rows="3" class="large-text"><?php echo esc_textarea( $opts['message'] ?? '' ); ?></textarea></td>
						</tr>
						<tr>
							<th><label><?php esc_html_e( 'Accept Button Text', 'cookie-consent-shield' ); ?></label></th>
							<td><input type="text" name="ccs_settings[accept_text]" value="<?php echo esc_attr( $opts['accept_text'] ?? '' ); ?>" class="regular-text" /></td>
						</tr>
						<tr>
							<th><label><?php esc_html_e( 'Reject Button Text', 'cookie-consent-shield' ); ?></label></th>
							<td><input type="text" name="ccs_settings[reject_text]" value="<?php echo esc_attr( $opts['reject_text'] ?? '' ); ?>" class="regular-text" /></td>
						</tr>
						<tr>
							<th><label><?php esc_html_e( 'Settings Button Text', 'cookie-consent-shield' ); ?></label></th>
							<td><input type="text" name="ccs_settings[settings_text]" value="<?php echo esc_attr( $opts['settings_text'] ?? '' ); ?>" class="regular-text" /></td>
						</tr>
						<tr>
							<th><label><?php esc_html_e( 'Privacy Policy URL', 'cookie-consent-shield' ); ?></label></th>
							<td><input type="url" name="ccs_settings[privacy_policy_url]" value="<?php echo esc_url( $opts['privacy_policy_url'] ?? '' ); ?>" class="regular-text" /></td>
						</tr>
						<tr>
							<th><label><?php esc_html_e( 'Cookie Expiry (days)', 'cookie-consent-shield' ); ?></label></th>
							<td><input type="number" name="ccs_settings[cookie_expiry]" value="<?php echo esc_attr( $opts['cookie_expiry'] ?? 365 ); ?>" min="1" max="730" /></td>
						</tr>
					</table>
				</div>

				<!-- Appearance -->
				<div id="appearance" class="ccs-tab-panel" style="display:none;">
					<table class="form-table">
						<tr>
							<th><label><?php esc_html_e( 'Position', 'cookie-consent-shield' ); ?></label></th>
							<td>
								<select name="ccs_settings[banner_position]">
									<option value="bottom" <?php selected( $opts['banner_position'] ?? '', 'bottom' ); ?>><?php esc_html_e( 'Bottom', 'cookie-consent-shield' ); ?></option>
									<option value="top" <?php selected( $opts['banner_position'] ?? '', 'top' ); ?>><?php esc_html_e( 'Top', 'cookie-consent-shield' ); ?></option>
									<option value="bottom-left" <?php selected( $opts['banner_position'] ?? '', 'bottom-left' ); ?>><?php esc_html_e( 'Bottom Left', 'cookie-consent-shield' ); ?></option>
									<option value="bottom-right" <?php selected( $opts['banner_position'] ?? '', 'bottom-right' ); ?>><?php esc_html_e( 'Bottom Right', 'cookie-consent-shield' ); ?></option>
								</select>
							</td>
						</tr>
						<tr>
							<th><label><?php esc_html_e( 'Style', 'cookie-consent-shield' ); ?></label></th>
							<td>
								<select name="ccs_settings[banner_style]">
									<option value="bar" <?php selected( $opts['banner_style'] ?? '', 'bar' ); ?>><?php esc_html_e( 'Bar', 'cookie-consent-shield' ); ?></option>
									<option value="modal" <?php selected( $opts['banner_style'] ?? '', 'modal' ); ?>><?php esc_html_e( 'Modal', 'cookie-consent-shield' ); ?></option>
									<option value="floating" <?php selected( $opts['banner_style'] ?? '', 'floating' ); ?>><?php esc_html_e( 'Floating Box', 'cookie-consent-shield' ); ?></option>
								</select>
							</td>
						</tr>
						<tr>
							<th><label><?php esc_html_e( 'Background Color', 'cookie-consent-shield' ); ?></label></th>
							<td><input type="text" name="ccs_settings[bg_color]" value="<?php echo esc_attr( $opts['bg_color'] ?? '#1a1a2e' ); ?>" class="ccs-color-picker" /></td>
						</tr>
						<tr>
							<th><label><?php esc_html_e( 'Text Color', 'cookie-consent-shield' ); ?></label></th>
							<td><input type="text" name="ccs_settings[text_color]" value="<?php echo esc_attr( $opts['text_color'] ?? '#ffffff' ); ?>" class="ccs-color-picker" /></td>
						</tr>
						<tr>
							<th><label><?php esc_html_e( 'Accept Button BG', 'cookie-consent-shield' ); ?></label></th>
							<td><input type="text" name="ccs_settings[btn_accept_bg]" value="<?php echo esc_attr( $opts['btn_accept_bg'] ?? '#0f3460' ); ?>" class="ccs-color-picker" /></td>
						</tr>
						<tr>
							<th><label><?php esc_html_e( 'Accept Button Text', 'cookie-consent-shield' ); ?></label></th>
							<td><input type="text" name="ccs_settings[btn_accept_color]" value="<?php echo esc_attr( $opts['btn_accept_color'] ?? '#ffffff' ); ?>" class="ccs-color-picker" /></td>
						</tr>
						<tr>
							<th><label><?php esc_html_e( 'Reject Button BG', 'cookie-consent-shield' ); ?></label></th>
							<td><input type="text" name="ccs_settings[btn_reject_bg]" value="<?php echo esc_attr( $opts['btn_reject_bg'] ?? '#e94560' ); ?>" class="ccs-color-picker" /></td>
						</tr>
						<tr>
							<th><label><?php esc_html_e( 'Reject Button Text', 'cookie-consent-shield' ); ?></label></th>
							<td><input type="text" name="ccs_settings[btn_reject_color]" value="<?php echo esc_attr( $opts['btn_reject_color'] ?? '#ffffff' ); ?>" class="ccs-color-picker" /></td>
						</tr>
					</table>
				</div>

				<!-- Geo -->
				<div id="geo" class="ccs-tab-panel" style="display:none;">
					<table class="form-table">
						<tr>
							<th><label><?php esc_html_e( 'Enable Geo-Detection', 'cookie-consent-shield' ); ?></label></th>
							<td><input type="checkbox" name="ccs_settings[geo_detection]" value="1" <?php checked( $opts['geo_detection'] ?? 1 ); ?> />
							<p class="description"><?php esc_html_e( 'Uses free IP-based geo lookup to determine visitor region.', 'cookie-consent-shield' ); ?></p></td>
						</tr>
						<tr>
							<th><label><?php esc_html_e( 'Show in EU/EEA', 'cookie-consent-shield' ); ?></label></th>
							<td><input type="checkbox" name="ccs_settings[show_in_eu]" value="1" <?php checked( $opts['show_in_eu'] ?? 1 ); ?> /></td>
						</tr>
						<tr>
							<th><label><?php esc_html_e( 'Show in US (CCPA)', 'cookie-consent-shield' ); ?></label></th>
							<td><input type="checkbox" name="ccs_settings[show_in_us]" value="1" <?php checked( $opts['show_in_us'] ?? 1 ); ?> /></td>
						</tr>
						<tr>
							<th><label><?php esc_html_e( 'Show Globally', 'cookie-consent-shield' ); ?></label></th>
							<td><input type="checkbox" name="ccs_settings[show_globally]" value="1" <?php checked( $opts['show_globally'] ?? 0 ); ?> />
							<p class="description"><?php esc_html_e( 'Overrides geo-detection and shows banner to all visitors.', 'cookie-consent-shield' ); ?></p></td>
						</tr>
					</table>
				</div>

				<!-- Script Blocking -->
				<div id="blocking" class="ccs-tab-panel" style="display:none;">
					<table class="form-table">
						<tr>
							<th><label><?php esc_html_e( 'Blocked Script Patterns', 'cookie-consent-shield' ); ?></label></th>
							<td>
								<textarea name="ccs_settings[blocked_scripts]" rows="8" class="large-text code"><?php echo esc_textarea( $opts['blocked_scripts'] ?? '' ); ?></textarea>
								<p class="description"><?php esc_html_e( 'One pattern per line. Scripts matching these strings will be blocked until consent. E.g.: google-analytics.com, facebook.net/en_US/fbevents.js', 'cookie-consent-shield' ); ?></p>
							</td>
						</tr>
					</table>
				</div>

				<?php submit_button( __( 'Save Settings', 'cookie-consent-shield' ) ); ?>
			</form>

			<!-- Consent Log -->
			<h2><?php esc_html_e( 'Recent Consent Log', 'cookie-consent-shield' ); ?></h2>
			<?php $this->render_consent_log(); ?>
		</div>
		<?php
	}

	private function render_consent_log() {
		global $wpdb;
		$table = $wpdb->prefix . 'ccs_consent_log';
		$results = $wpdb->get_results(
			$wpdb->prepare( "SELECT * FROM {$table} ORDER BY created_at DESC LIMIT %d", 20 )
		);
		if ( empty( $results ) ) {
			echo '<p>' . esc_html__( 'No consent records yet.', 'cookie-consent-shield' ) . '</p>';
			return;
		}
		echo '<table class="widefat striped"><thead><tr>';
		echo '<th>' . esc_html__( 'Date', 'cookie-consent-shield' ) . '</th>';
		echo '<th>' . esc_html__( 'IP Hash', 'cookie-consent-shield' ) . '</th>';
		echo '<th>' . esc_html__( 'Region', 'cookie-consent-shield' ) . '</th>';
		echo '<th>' . esc_html__( 'Consent', 'cookie-consent-shield' ) . '</th>';
		echo '</tr></thead><tbody>';
		foreach ( $results as $row ) {
			echo '<tr>';
			echo '<td>' . esc_html( $row->created_at ) . '</td>';
			echo '<td><code>' . esc_html( substr( $row->ip_hash, 0, 12 ) ) . '…</code></td>';
			echo '<td>' . esc_html( $row->geo_region ) . '</td>';
			echo '<td>' . esc_html( $row->consent_data ) . '</td>';
			echo '</tr>';
		}
		echo '</tbody></table>';
	}
}
