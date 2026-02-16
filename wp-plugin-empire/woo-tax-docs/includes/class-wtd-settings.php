<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WTD_Settings {

	public function __construct() {
		add_action( 'admin_menu', array( $this, 'add_menu' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		add_filter( 'plugin_action_links_' . WTD_PLUGIN_BASENAME, array( $this, 'plugin_links' ) );
	}

	public function plugin_links( $links ) {
		$settings = '<a href="' . esc_url( admin_url( 'admin.php?page=woo-tax-docs' ) ) . '">' . esc_html__( 'Settings', 'woo-tax-docs' ) . '</a>';
		array_unshift( $links, $settings );
		$links[] = '<a href="https://wootaxdocs.com/pro" style="color:#2271b1;font-weight:bold;">' . esc_html__( 'Go Pro', 'woo-tax-docs' ) . '</a>';
		return $links;
	}

	public function add_menu() {
		add_submenu_page(
			'woocommerce',
			__( 'Tax Documents', 'woo-tax-docs' ),
			__( 'Tax Documents', 'woo-tax-docs' ),
			'manage_woocommerce',
			'woo-tax-docs',
			array( $this, 'render_page' )
		);
	}

	public function enqueue_assets( $hook ) {
		if ( 'woocommerce_page_woo-tax-docs' !== $hook ) {
			return;
		}
		wp_enqueue_media();
		wp_enqueue_style( 'wtd-admin', WTD_PLUGIN_URL . 'assets/css/admin.css', array(), WTD_VERSION );
		wp_enqueue_script( 'wtd-admin', WTD_PLUGIN_URL . 'assets/js/admin.js', array( 'jquery' ), WTD_VERSION, true );
	}

	public function register_settings() {
		register_setting( 'wtd_settings_group', 'wtd_settings', array( $this, 'sanitize' ) );
	}

	public function sanitize( $input ) {
		$s = array();
		$s['company_name']    = sanitize_text_field( $input['company_name'] ?? '' );
		$s['company_address'] = sanitize_textarea_field( $input['company_address'] ?? '' );
		$s['company_tax_id']  = sanitize_text_field( $input['company_tax_id'] ?? '' );
		$s['company_logo']    = esc_url_raw( $input['company_logo'] ?? '' );
		$s['invoice_prefix']  = sanitize_text_field( $input['invoice_prefix'] ?? 'INV-' );
		$s['next_number']     = absint( $input['next_number'] ?? 1001 );
		$s['auto_generate']   = ! empty( $input['auto_generate'] ) ? 1 : 0;
		$s['tax_label_us']    = sanitize_text_field( $input['tax_label_us'] ?? 'Sales Tax' );
		$s['tax_label_eu']    = sanitize_text_field( $input['tax_label_eu'] ?? 'VAT' );
		$s['tax_label_uk']    = sanitize_text_field( $input['tax_label_uk'] ?? 'VAT' );
		$s['tax_label_au']    = sanitize_text_field( $input['tax_label_au'] ?? 'GST' );
		$s['footer_text']     = sanitize_textarea_field( $input['footer_text'] ?? '' );
		$s['date_format']     = sanitize_text_field( $input['date_format'] ?? 'Y-m-d' );
		return $s;
	}

	public function render_page() {
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			return;
		}
		$opts = get_option( 'wtd_settings', array() );
		$tab = sanitize_text_field( $_GET['tab'] ?? 'settings' );
		?>
		<div class="wrap wtd-wrap">
			<h1><?php esc_html_e( 'WooCommerce Tax Doc Generator', 'woo-tax-docs' ); ?></h1>

			<div class="wtd-pro-banner">
				<h3>📄 <?php esc_html_e( 'Upgrade to Pro', 'woo-tax-docs' ); ?></h3>
				<p><?php esc_html_e( 'Multi-jurisdiction support, bulk PDF export, custom invoice templates, and priority support.', 'woo-tax-docs' ); ?></p>
				<a href="https://wootaxdocs.com/pro" class="button button-primary" target="_blank"><?php esc_html_e( 'Go Pro — $79/year', 'woo-tax-docs' ); ?></a>
			</div>

			<h2 class="nav-tab-wrapper">
				<a class="nav-tab <?php echo 'settings' === $tab ? 'nav-tab-active' : ''; ?>" href="<?php echo esc_url( admin_url( 'admin.php?page=woo-tax-docs&tab=settings' ) ); ?>"><?php esc_html_e( 'Settings', 'woo-tax-docs' ); ?></a>
				<a class="nav-tab <?php echo 'invoices' === $tab ? 'nav-tab-active' : ''; ?>" href="<?php echo esc_url( admin_url( 'admin.php?page=woo-tax-docs&tab=invoices' ) ); ?>"><?php esc_html_e( 'Invoices', 'woo-tax-docs' ); ?></a>
			</h2>

			<?php if ( 'invoices' === $tab ) : ?>
				<?php $this->render_invoices_tab(); ?>
			<?php else : ?>
				<?php $this->render_settings_tab( $opts ); ?>
			<?php endif; ?>
		</div>
		<?php
	}

	private function render_settings_tab( $opts ) {
		?>
		<form method="post" action="options.php">
			<?php settings_fields( 'wtd_settings_group' ); ?>
			<h3><?php esc_html_e( 'Company Details', 'woo-tax-docs' ); ?></h3>
			<table class="form-table">
				<tr>
					<th><label><?php esc_html_e( 'Company Name', 'woo-tax-docs' ); ?></label></th>
					<td><input type="text" name="wtd_settings[company_name]" value="<?php echo esc_attr( $opts['company_name'] ?? '' ); ?>" class="regular-text" /></td>
				</tr>
				<tr>
					<th><label><?php esc_html_e( 'Company Address', 'woo-tax-docs' ); ?></label></th>
					<td><textarea name="wtd_settings[company_address]" rows="3" class="large-text"><?php echo esc_textarea( $opts['company_address'] ?? '' ); ?></textarea></td>
				</tr>
				<tr>
					<th><label><?php esc_html_e( 'Tax ID / VAT Number', 'woo-tax-docs' ); ?></label></th>
					<td><input type="text" name="wtd_settings[company_tax_id]" value="<?php echo esc_attr( $opts['company_tax_id'] ?? '' ); ?>" class="regular-text" /></td>
				</tr>
				<tr>
					<th><label><?php esc_html_e( 'Company Logo URL', 'woo-tax-docs' ); ?></label></th>
					<td>
						<input type="text" id="wtd_logo" name="wtd_settings[company_logo]" value="<?php echo esc_url( $opts['company_logo'] ?? '' ); ?>" class="regular-text" />
						<button type="button" class="button" id="wtd_upload_logo"><?php esc_html_e( 'Upload', 'woo-tax-docs' ); ?></button>
					</td>
				</tr>
			</table>

			<h3><?php esc_html_e( 'Invoice Settings', 'woo-tax-docs' ); ?></h3>
			<table class="form-table">
				<tr>
					<th><label><?php esc_html_e( 'Invoice Prefix', 'woo-tax-docs' ); ?></label></th>
					<td><input type="text" name="wtd_settings[invoice_prefix]" value="<?php echo esc_attr( $opts['invoice_prefix'] ?? 'INV-' ); ?>" class="small-text" /></td>
				</tr>
				<tr>
					<th><label><?php esc_html_e( 'Next Invoice Number', 'woo-tax-docs' ); ?></label></th>
					<td><input type="number" name="wtd_settings[next_number]" value="<?php echo esc_attr( $opts['next_number'] ?? 1001 ); ?>" min="1" /></td>
				</tr>
				<tr>
					<th><label><?php esc_html_e( 'Auto-Generate on Order Complete', 'woo-tax-docs' ); ?></label></th>
					<td><input type="checkbox" name="wtd_settings[auto_generate]" value="1" <?php checked( $opts['auto_generate'] ?? 1 ); ?> /></td>
				</tr>
				<tr>
					<th><label><?php esc_html_e( 'Date Format', 'woo-tax-docs' ); ?></label></th>
					<td><input type="text" name="wtd_settings[date_format]" value="<?php echo esc_attr( $opts['date_format'] ?? 'Y-m-d' ); ?>" class="small-text" />
					<p class="description"><?php esc_html_e( 'PHP date format. Default: Y-m-d', 'woo-tax-docs' ); ?></p></td>
				</tr>
			</table>

			<h3><?php esc_html_e( 'Tax Labels by Jurisdiction', 'woo-tax-docs' ); ?></h3>
			<table class="form-table">
				<tr>
					<th><label><?php esc_html_e( 'US Tax Label', 'woo-tax-docs' ); ?></label></th>
					<td><input type="text" name="wtd_settings[tax_label_us]" value="<?php echo esc_attr( $opts['tax_label_us'] ?? 'Sales Tax' ); ?>" class="regular-text" /></td>
				</tr>
				<tr>
					<th><label><?php esc_html_e( 'EU Tax Label', 'woo-tax-docs' ); ?></label></th>
					<td><input type="text" name="wtd_settings[tax_label_eu]" value="<?php echo esc_attr( $opts['tax_label_eu'] ?? 'VAT' ); ?>" class="regular-text" /></td>
				</tr>
				<tr>
					<th><label><?php esc_html_e( 'UK Tax Label', 'woo-tax-docs' ); ?></label></th>
					<td><input type="text" name="wtd_settings[tax_label_uk]" value="<?php echo esc_attr( $opts['tax_label_uk'] ?? 'VAT' ); ?>" class="regular-text" /></td>
				</tr>
				<tr>
					<th><label><?php esc_html_e( 'AU Tax Label', 'woo-tax-docs' ); ?></label></th>
					<td><input type="text" name="wtd_settings[tax_label_au]" value="<?php echo esc_attr( $opts['tax_label_au'] ?? 'GST' ); ?>" class="regular-text" /></td>
				</tr>
			</table>

			<h3><?php esc_html_e( 'Footer', 'woo-tax-docs' ); ?></h3>
			<table class="form-table">
				<tr>
					<th><label><?php esc_html_e( 'Invoice Footer Text', 'woo-tax-docs' ); ?></label></th>
					<td><textarea name="wtd_settings[footer_text]" rows="2" class="large-text"><?php echo esc_textarea( $opts['footer_text'] ?? '' ); ?></textarea></td>
				</tr>
			</table>

			<?php submit_button(); ?>
		</form>
		<?php
	}

	private function render_invoices_tab() {
		global $wpdb;
		$table = $wpdb->prefix . 'wtd_invoices';
		$page = max( 1, absint( $_GET['paged'] ?? 1 ) );
		$per_page = 20;
		$offset = ( $page - 1 ) * $per_page;

		$total = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$table}" );
		$invoices = $wpdb->get_results( $wpdb->prepare(
			"SELECT * FROM {$table} ORDER BY created_at DESC LIMIT %d OFFSET %d",
			$per_page, $offset
		) );

		echo '<table class="widefat striped" style="margin-top:15px;">';
		echo '<thead><tr>';
		echo '<th>' . esc_html__( 'Invoice #', 'woo-tax-docs' ) . '</th>';
		echo '<th>' . esc_html__( 'Order', 'woo-tax-docs' ) . '</th>';
		echo '<th>' . esc_html__( 'Jurisdiction', 'woo-tax-docs' ) . '</th>';
		echo '<th>' . esc_html__( 'Tax', 'woo-tax-docs' ) . '</th>';
		echo '<th>' . esc_html__( 'Total', 'woo-tax-docs' ) . '</th>';
		echo '<th>' . esc_html__( 'Date', 'woo-tax-docs' ) . '</th>';
		echo '<th>' . esc_html__( 'PDF', 'woo-tax-docs' ) . '</th>';
		echo '</tr></thead><tbody>';

		if ( empty( $invoices ) ) {
			echo '<tr><td colspan="7">' . esc_html__( 'No invoices generated yet.', 'woo-tax-docs' ) . '</td></tr>';
		}

		foreach ( $invoices as $inv ) {
			$order_url = admin_url( 'post.php?post=' . $inv->order_id . '&action=edit' );
			$pdf_url = '';
			if ( ! empty( $inv->pdf_path ) ) {
				$upload_dir = wp_upload_dir();
				$pdf_url = $upload_dir['baseurl'] . '/woo-tax-docs/' . basename( $inv->pdf_path );
			}
			echo '<tr>';
			echo '<td><strong>' . esc_html( $inv->invoice_number ) . '</strong></td>';
			echo '<td><a href="' . esc_url( $order_url ) . '">#' . esc_html( $inv->order_id ) . '</a></td>';
			echo '<td>' . esc_html( strtoupper( $inv->jurisdiction ) ) . ' — ' . esc_html( $inv->tax_type ) . '</td>';
			echo '<td>' . wc_price( $inv->tax_amount ) . '</td>';
			echo '<td>' . wc_price( $inv->total_amount ) . '</td>';
			echo '<td>' . esc_html( $inv->created_at ) . '</td>';
			echo '<td>';
			if ( $pdf_url ) {
				echo '<a href="' . esc_url( wp_nonce_url( admin_url( 'admin-ajax.php?action=wtd_download_pdf&invoice_id=' . $inv->id ), 'wtd_download_' . $inv->id ) ) . '" class="button button-small">' . esc_html__( 'Download', 'woo-tax-docs' ) . '</a>';
			} else {
				echo '<a href="' . esc_url( wp_nonce_url( admin_url( 'admin-ajax.php?action=wtd_generate_pdf&invoice_id=' . $inv->id ), 'wtd_generate_' . $inv->id ) ) . '" class="button button-small">' . esc_html__( 'Generate PDF', 'woo-tax-docs' ) . '</a>';
			}
			echo '</td>';
			echo '</tr>';
		}
		echo '</tbody></table>';

		// Pagination
		if ( $total > $per_page ) {
			$pages = ceil( $total / $per_page );
			echo '<div class="tablenav"><div class="tablenav-pages">';
			echo paginate_links( array(
				'base'    => add_query_arg( 'paged', '%#%' ),
				'format'  => '',
				'current' => $page,
				'total'   => $pages,
			) );
			echo '</div></div>';
		}
	}
}
