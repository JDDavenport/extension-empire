<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class ACL_Settings {

	public function __construct() {
		add_action( 'admin_menu', array( $this, 'add_menu' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		add_filter( 'plugin_action_links_' . ACL_PLUGIN_BASENAME, array( $this, 'plugin_links' ) );
	}

	public function plugin_links( $links ) {
		$s = '<a href="' . esc_url( admin_url( 'tools.php?page=accessibility-checker' ) ) . '">' . esc_html__( 'Settings', 'accessibility-checker-lite' ) . '</a>';
		array_unshift( $links, $s );
		$links[] = '<a href="https://accessibilitycheckerlite.com/pro" style="color:#00a32a;font-weight:bold;">' . esc_html__( 'Go Pro', 'accessibility-checker-lite' ) . '</a>';
		return $links;
	}

	public function add_menu() {
		add_management_page(
			__( 'Accessibility Checker', 'accessibility-checker-lite' ),
			__( 'Accessibility Checker', 'accessibility-checker-lite' ),
			'manage_options',
			'accessibility-checker',
			array( $this, 'render_page' )
		);
	}

	public function enqueue_assets( $hook ) {
		if ( 'tools_page_accessibility-checker' !== $hook ) {
			return;
		}
		wp_enqueue_style( 'acl-admin', ACL_PLUGIN_URL . 'assets/css/admin.css', array(), ACL_VERSION );
	}

	public function register_settings() {
		register_setting( 'acl_settings_group', 'acl_settings', array( $this, 'sanitize' ) );
	}

	public function sanitize( $input ) {
		$s = array();
		$s['enabled']              = ! empty( $input['enabled'] ) ? 1 : 0;
		$s['check_alt_text']       = ! empty( $input['check_alt_text'] ) ? 1 : 0;
		$s['check_headings']       = ! empty( $input['check_headings'] ) ? 1 : 0;
		$s['check_color_contrast'] = ! empty( $input['check_color_contrast'] ) ? 1 : 0;
		$s['check_link_text']      = ! empty( $input['check_link_text'] ) ? 1 : 0;
		$s['check_form_labels']    = ! empty( $input['check_form_labels'] ) ? 1 : 0;
		$s['check_aria']           = 0; // Pro
		$s['check_tables']         = 0; // Pro
		$s['check_media']          = 0; // Pro
		$s['highlight_issues']     = ! empty( $input['highlight_issues'] ) ? 1 : 0;
		$s['admin_bar_summary']    = ! empty( $input['admin_bar_summary'] ) ? 1 : 0;

		$allowed = get_post_types( array( 'public' => true ) );
		$s['post_types'] = array();
		if ( ! empty( $input['post_types'] ) && is_array( $input['post_types'] ) ) {
			foreach ( $input['post_types'] as $pt ) {
				if ( isset( $allowed[ $pt ] ) ) {
					$s['post_types'][] = $pt;
				}
			}
		}
		return $s;
	}

	public function render_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$opts = get_option( 'acl_settings', array() );
		$tab = sanitize_text_field( $_GET['tab'] ?? 'settings' );
		?>
		<div class="wrap acl-wrap">
			<h1>♿ <?php esc_html_e( 'Accessibility Checker Lite', 'accessibility-checker-lite' ); ?></h1>

			<div class="acl-pro-banner">
				<h3>🔍 <?php esc_html_e( 'Upgrade to Pro', 'accessibility-checker-lite' ); ?></h3>
				<p><?php esc_html_e( 'Full WCAG 2.1 audit, PDF reports, scheduled scans, ARIA validation, table checks, and priority support.', 'accessibility-checker-lite' ); ?></p>
				<a href="https://accessibilitycheckerlite.com/pro" class="button button-primary" target="_blank"><?php esc_html_e( 'Go Pro — $59/year', 'accessibility-checker-lite' ); ?></a>
			</div>

			<h2 class="nav-tab-wrapper">
				<a class="nav-tab <?php echo 'settings' === $tab ? 'nav-tab-active' : ''; ?>" href="<?php echo esc_url( admin_url( 'tools.php?page=accessibility-checker&tab=settings' ) ); ?>"><?php esc_html_e( 'Settings', 'accessibility-checker-lite' ); ?></a>
				<a class="nav-tab <?php echo 'results' === $tab ? 'nav-tab-active' : ''; ?>" href="<?php echo esc_url( admin_url( 'tools.php?page=accessibility-checker&tab=results' ) ); ?>"><?php esc_html_e( 'Scan Results', 'accessibility-checker-lite' ); ?></a>
				<a class="nav-tab <?php echo 'scan' === $tab ? 'nav-tab-active' : ''; ?>" href="<?php echo esc_url( admin_url( 'tools.php?page=accessibility-checker&tab=scan' ) ); ?>"><?php esc_html_e( 'Run Scan', 'accessibility-checker-lite' ); ?></a>
			</h2>

			<?php
			switch ( $tab ) {
				case 'results':
					$this->render_results_tab();
					break;
				case 'scan':
					$this->render_scan_tab();
					break;
				default:
					$this->render_settings_tab( $opts );
					break;
			}
			?>
		</div>
		<?php
	}

	private function render_settings_tab( $opts ) {
		$post_types = get_post_types( array( 'public' => true ), 'objects' );
		?>
		<form method="post" action="options.php">
			<?php settings_fields( 'acl_settings_group' ); ?>

			<h3><?php esc_html_e( 'General', 'accessibility-checker-lite' ); ?></h3>
			<table class="form-table">
				<tr>
					<th><?php esc_html_e( 'Enable Checker', 'accessibility-checker-lite' ); ?></th>
					<td><input type="checkbox" name="acl_settings[enabled]" value="1" <?php checked( $opts['enabled'] ?? 1 ); ?> /></td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'Show in Admin Bar', 'accessibility-checker-lite' ); ?></th>
					<td><input type="checkbox" name="acl_settings[admin_bar_summary]" value="1" <?php checked( $opts['admin_bar_summary'] ?? 1 ); ?> /></td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'Highlight Issues on Frontend', 'accessibility-checker-lite' ); ?></th>
					<td><input type="checkbox" name="acl_settings[highlight_issues]" value="1" <?php checked( $opts['highlight_issues'] ?? 1 ); ?> />
					<p class="description"><?php esc_html_e( 'Only visible to logged-in administrators.', 'accessibility-checker-lite' ); ?></p></td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'Post Types to Scan', 'accessibility-checker-lite' ); ?></th>
					<td>
						<?php foreach ( $post_types as $pt ) : ?>
							<label style="display:block;margin-bottom:4px;">
								<input type="checkbox" name="acl_settings[post_types][]" value="<?php echo esc_attr( $pt->name ); ?>"
									<?php checked( in_array( $pt->name, $opts['post_types'] ?? array(), true ) ); ?> />
								<?php echo esc_html( $pt->labels->singular_name ); ?>
							</label>
						<?php endforeach; ?>
					</td>
				</tr>
			</table>

			<h3><?php esc_html_e( 'Checks (Free)', 'accessibility-checker-lite' ); ?></h3>
			<table class="form-table">
				<tr>
					<th><?php esc_html_e( 'Alt Text', 'accessibility-checker-lite' ); ?></th>
					<td><input type="checkbox" name="acl_settings[check_alt_text]" value="1" <?php checked( $opts['check_alt_text'] ?? 1 ); ?> />
					<span class="description">WCAG 1.1.1</span></td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'Heading Structure', 'accessibility-checker-lite' ); ?></th>
					<td><input type="checkbox" name="acl_settings[check_headings]" value="1" <?php checked( $opts['check_headings'] ?? 1 ); ?> />
					<span class="description">WCAG 1.3.1, 2.4.6</span></td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'Color Contrast', 'accessibility-checker-lite' ); ?></th>
					<td><input type="checkbox" name="acl_settings[check_color_contrast]" value="1" <?php checked( $opts['check_color_contrast'] ?? 1 ); ?> />
					<span class="description">WCAG 1.4.3</span></td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'Link Text', 'accessibility-checker-lite' ); ?></th>
					<td><input type="checkbox" name="acl_settings[check_link_text]" value="1" <?php checked( $opts['check_link_text'] ?? 1 ); ?> />
					<span class="description">WCAG 2.4.4</span></td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'Form Labels', 'accessibility-checker-lite' ); ?></th>
					<td><input type="checkbox" name="acl_settings[check_form_labels]" value="1" <?php checked( $opts['check_form_labels'] ?? 1 ); ?> />
					<span class="description">WCAG 4.1.2</span></td>
				</tr>
			</table>

			<h3><?php esc_html_e( 'Pro Checks', 'accessibility-checker-lite' ); ?> 🔒</h3>
			<table class="form-table acl-pro-checks">
				<tr>
					<th><?php esc_html_e( 'ARIA Validation', 'accessibility-checker-lite' ); ?></th>
					<td><input type="checkbox" disabled /> <span class="acl-pro-badge"><?php esc_html_e( 'Pro', 'accessibility-checker-lite' ); ?></span></td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'Table Structure', 'accessibility-checker-lite' ); ?></th>
					<td><input type="checkbox" disabled /> <span class="acl-pro-badge"><?php esc_html_e( 'Pro', 'accessibility-checker-lite' ); ?></span></td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'Media Accessibility', 'accessibility-checker-lite' ); ?></th>
					<td><input type="checkbox" disabled /> <span class="acl-pro-badge"><?php esc_html_e( 'Pro', 'accessibility-checker-lite' ); ?></span></td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'Scheduled Scans', 'accessibility-checker-lite' ); ?></th>
					<td><input type="checkbox" disabled /> <span class="acl-pro-badge"><?php esc_html_e( 'Pro', 'accessibility-checker-lite' ); ?></span></td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'PDF Reports', 'accessibility-checker-lite' ); ?></th>
					<td><input type="checkbox" disabled /> <span class="acl-pro-badge"><?php esc_html_e( 'Pro', 'accessibility-checker-lite' ); ?></span></td>
				</tr>
			</table>

			<?php submit_button(); ?>
		</form>
		<?php
	}

	private function render_results_tab() {
		global $wpdb;
		$table = $wpdb->prefix . 'acl_scan_results';

		// Summary
		$summary = $wpdb->get_results( "SELECT severity, COUNT(*) as count FROM {$table} GROUP BY severity" );
		$errors = 0;
		$warnings = 0;
		foreach ( $summary as $row ) {
			if ( 'error' === $row->severity ) $errors = (int) $row->count;
			if ( 'warning' === $row->severity ) $warnings = (int) $row->count;
		}

		echo '<div class="acl-summary-cards" style="margin:20px 0;display:flex;gap:15px;">';
		echo '<div class="acl-card acl-card-error"><span class="acl-count">' . esc_html( $errors ) . '</span><span class="acl-label">' . esc_html__( 'Errors', 'accessibility-checker-lite' ) . '</span></div>';
		echo '<div class="acl-card acl-card-warning"><span class="acl-count">' . esc_html( $warnings ) . '</span><span class="acl-label">' . esc_html__( 'Warnings', 'accessibility-checker-lite' ) . '</span></div>';
		echo '<div class="acl-card acl-card-total"><span class="acl-count">' . esc_html( $errors + $warnings ) . '</span><span class="acl-label">' . esc_html__( 'Total Issues', 'accessibility-checker-lite' ) . '</span></div>';
		echo '</div>';

		// Issues by post
		$posts_with_issues = $wpdb->get_results(
			"SELECT post_id, url,
				SUM(CASE WHEN severity='error' THEN 1 ELSE 0 END) as errors,
				SUM(CASE WHEN severity='warning' THEN 1 ELSE 0 END) as warnings,
				MAX(scanned_at) as last_scan
			FROM {$table} GROUP BY post_id, url ORDER BY errors DESC, warnings DESC LIMIT 50"
		);

		echo '<table class="widefat striped"><thead><tr>';
		echo '<th>' . esc_html__( 'Page', 'accessibility-checker-lite' ) . '</th>';
		echo '<th>' . esc_html__( 'Errors', 'accessibility-checker-lite' ) . '</th>';
		echo '<th>' . esc_html__( 'Warnings', 'accessibility-checker-lite' ) . '</th>';
		echo '<th>' . esc_html__( 'Last Scan', 'accessibility-checker-lite' ) . '</th>';
		echo '<th>' . esc_html__( 'Actions', 'accessibility-checker-lite' ) . '</th>';
		echo '</tr></thead><tbody>';

		if ( empty( $posts_with_issues ) ) {
			echo '<tr><td colspan="5">' . esc_html__( 'No scan results yet. Run a scan first.', 'accessibility-checker-lite' ) . '</td></tr>';
		}

		foreach ( $posts_with_issues as $row ) {
			$title = get_the_title( $row->post_id ) ?: '#' . $row->post_id;
			echo '<tr>';
			echo '<td><a href="' . esc_url( get_edit_post_link( $row->post_id ) ) . '">' . esc_html( $title ) . '</a></td>';
			echo '<td><span class="acl-badge-error">' . esc_html( $row->errors ) . '</span></td>';
			echo '<td><span class="acl-badge-warning">' . esc_html( $row->warnings ) . '</span></td>';
			echo '<td>' . esc_html( $row->last_scan ) . '</td>';
			echo '<td><a href="' . esc_url( admin_url( 'tools.php?page=accessibility-checker&tab=results&post_id=' . $row->post_id ) ) . '">' . esc_html__( 'Details', 'accessibility-checker-lite' ) . '</a></td>';
			echo '</tr>';
		}
		echo '</tbody></table>';

		// Detail view for specific post
		$detail_post = absint( $_GET['post_id'] ?? 0 );
		if ( $detail_post ) {
			$issues = ACL_Scanner::get_results( $detail_post );
			if ( $issues ) {
				echo '<h3 style="margin-top:30px;">' . sprintf( esc_html__( 'Issues for: %s', 'accessibility-checker-lite' ), esc_html( get_the_title( $detail_post ) ) ) . '</h3>';
				echo '<table class="widefat striped"><thead><tr>';
				echo '<th>' . esc_html__( 'Severity', 'accessibility-checker-lite' ) . '</th>';
				echo '<th>' . esc_html__( 'Type', 'accessibility-checker-lite' ) . '</th>';
				echo '<th>' . esc_html__( 'WCAG', 'accessibility-checker-lite' ) . '</th>';
				echo '<th>' . esc_html__( 'Message', 'accessibility-checker-lite' ) . '</th>';
				echo '<th>' . esc_html__( 'Element', 'accessibility-checker-lite' ) . '</th>';
				echo '</tr></thead><tbody>';
				foreach ( $issues as $issue ) {
					$sev_class = 'error' === $issue->severity ? 'acl-badge-error' : 'acl-badge-warning';
					echo '<tr>';
					echo '<td><span class="' . esc_attr( $sev_class ) . '">' . esc_html( ucfirst( $issue->severity ) ) . '</span></td>';
					echo '<td>' . esc_html( $issue->issue_type ) . '</td>';
					echo '<td>' . esc_html( $issue->wcag_ref ) . '</td>';
					echo '<td>' . esc_html( $issue->message ) . '</td>';
					echo '<td><code>' . esc_html( $issue->element ) . '</code></td>';
					echo '</tr>';
				}
				echo '</tbody></table>';
			}
		}
	}

	private function render_scan_tab() {
		$opts = get_option( 'acl_settings', array() );
		$post_types = $opts['post_types'] ?? array( 'post', 'page' );

		// Handle scan request
		if ( isset( $_POST['acl_run_scan'] ) && check_admin_referer( 'acl_run_scan' ) ) {
			$scanned = 0;
			$total_issues = 0;

			$posts = get_posts( array(
				'post_type'      => $post_types,
				'post_status'    => 'publish',
				'posts_per_page' => 100,
			) );

			foreach ( $posts as $post ) {
				$issues = ACL_Scanner::scan_post( $post->ID );
				$scanned++;
				$total_issues += count( $issues );
			}

			echo '<div class="notice notice-success"><p>' . sprintf(
				esc_html__( 'Scan complete! Scanned %1$d pages, found %2$d issues.', 'accessibility-checker-lite' ),
				$scanned, $total_issues
			) . ' <a href="' . esc_url( admin_url( 'tools.php?page=accessibility-checker&tab=results' ) ) . '">' . esc_html__( 'View Results', 'accessibility-checker-lite' ) . '</a></p></div>';
		}

		$count = 0;
		foreach ( $post_types as $pt ) {
			$count += wp_count_posts( $pt )->publish ?? 0;
		}
		?>
		<div style="margin-top:20px;">
			<p><?php printf( esc_html__( 'This will scan up to 100 published pages (%d available) for accessibility issues.', 'accessibility-checker-lite' ), $count ); ?></p>
			<p><strong><?php esc_html_e( 'Post types:', 'accessibility-checker-lite' ); ?></strong> <?php echo esc_html( implode( ', ', $post_types ) ); ?></p>
			<p><strong><?php esc_html_e( 'Checks:', 'accessibility-checker-lite' ); ?></strong>
				<?php
				$checks = array();
				if ( ! empty( $opts['check_alt_text'] ) ) $checks[] = __( 'Alt Text', 'accessibility-checker-lite' );
				if ( ! empty( $opts['check_headings'] ) ) $checks[] = __( 'Headings', 'accessibility-checker-lite' );
				if ( ! empty( $opts['check_color_contrast'] ) ) $checks[] = __( 'Color Contrast', 'accessibility-checker-lite' );
				if ( ! empty( $opts['check_link_text'] ) ) $checks[] = __( 'Link Text', 'accessibility-checker-lite' );
				if ( ! empty( $opts['check_form_labels'] ) ) $checks[] = __( 'Form Labels', 'accessibility-checker-lite' );
				echo esc_html( implode( ', ', $checks ) );
				?>
			</p>
			<form method="post">
				<?php wp_nonce_field( 'acl_run_scan' ); ?>
				<button type="submit" name="acl_run_scan" class="button button-primary button-hero">
					🔍 <?php esc_html_e( 'Run Accessibility Scan', 'accessibility-checker-lite' ); ?>
				</button>
			</form>
			<p class="description" style="margin-top:10px;">
				<?php esc_html_e( 'Pro tip: Upgrade to Pro for scheduled automatic scans and scanning unlimited pages.', 'accessibility-checker-lite' ); ?>
			</p>
		</div>
		<?php
	}
}
