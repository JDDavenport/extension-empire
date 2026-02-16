<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WTD_Invoice {

	public function __construct() {
		$opts = get_option( 'wtd_settings', array() );

		// Auto-generate on order complete
		if ( ! empty( $opts['auto_generate'] ) ) {
			add_action( 'woocommerce_order_status_completed', array( $this, 'generate_for_order' ) );
		}

		// Add invoice column to orders
		add_filter( 'manage_edit-shop_order_columns', array( $this, 'add_order_column' ) );
		add_action( 'manage_shop_order_posts_custom_column', array( $this, 'render_order_column' ), 10, 2 );

		// Order actions
		add_filter( 'woocommerce_order_actions', array( $this, 'add_order_action' ) );
		add_action( 'woocommerce_order_action_wtd_generate_invoice', array( $this, 'handle_order_action' ) );

		// AJAX handlers
		add_action( 'wp_ajax_wtd_download_pdf', array( $this, 'ajax_download_pdf' ) );
		add_action( 'wp_ajax_wtd_generate_pdf', array( $this, 'ajax_generate_pdf' ) );

		// Add to order emails
		add_action( 'woocommerce_email_after_order_table', array( $this, 'add_to_email' ), 10, 4 );

		// My account downloads
		add_filter( 'woocommerce_my_account_my_orders_actions', array( $this, 'add_my_account_action' ), 10, 2 );
	}

	/**
	 * Generate invoice for an order.
	 */
	public function generate_for_order( $order_id ) {
		$order = wc_get_order( $order_id );
		if ( ! $order ) {
			return false;
		}

		global $wpdb;
		$table = $wpdb->prefix . 'wtd_invoices';

		// Check if already generated
		$existing = $wpdb->get_var( $wpdb->prepare(
			"SELECT id FROM {$table} WHERE order_id = %d", $order_id
		) );
		if ( $existing ) {
			return $existing;
		}

		$jurisdiction = WTD_Tax_Calculator::get_jurisdiction( $order );
		$opts = get_option( 'wtd_settings', array() );

		$invoice_number = ( $opts['invoice_prefix'] ?? 'INV-' ) . ( $opts['next_number'] ?? 1001 );

		// Increment next number
		$opts['next_number'] = ( $opts['next_number'] ?? 1001 ) + 1;
		update_option( 'wtd_settings', $opts );

		$tax_total = (float) $order->get_total_tax();
		$total = (float) $order->get_total();

		$wpdb->insert( $table, array(
			'order_id'       => $order_id,
			'invoice_number' => $invoice_number,
			'jurisdiction'   => $jurisdiction['jurisdiction'],
			'tax_type'       => $jurisdiction['tax_type'],
			'tax_amount'     => $tax_total,
			'total_amount'   => $total,
			'created_at'     => current_time( 'mysql' ),
		), array( '%d', '%s', '%s', '%s', '%f', '%f', '%s' ) );

		$invoice_id = $wpdb->insert_id;

		// Store invoice number on order meta
		$order->update_meta_data( '_wtd_invoice_number', $invoice_number );
		$order->update_meta_data( '_wtd_invoice_id', $invoice_id );
		$order->save();

		// Generate HTML invoice (PDF generation in pro or via class-wtd-pdf.php)
		$this->generate_html_invoice( $invoice_id, $order );

		return $invoice_id;
	}

	/**
	 * Generate HTML invoice file.
	 */
	private function generate_html_invoice( $invoice_id, $order ) {
		global $wpdb;
		$table = $wpdb->prefix . 'wtd_invoices';
		$invoice = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $invoice_id ) );
		if ( ! $invoice ) {
			return;
		}

		$opts = get_option( 'wtd_settings', array() );
		$jurisdiction = WTD_Tax_Calculator::get_jurisdiction( $order );
		$tax_label = WTD_Tax_Calculator::get_tax_label( $jurisdiction['jurisdiction'] );

		ob_start();
		include WTD_PLUGIN_DIR . 'templates/invoice-html.php';
		$html = ob_get_clean();

		$upload_dir = wp_upload_dir();
		$path = $upload_dir['basedir'] . '/woo-tax-docs/' . sanitize_file_name( $invoice->invoice_number ) . '.html';
		file_put_contents( $path, $html );

		$wpdb->update( $table, array( 'pdf_path' => $path ), array( 'id' => $invoice_id ), array( '%s' ), array( '%d' ) );
	}

	public function add_order_column( $columns ) {
		$new = array();
		foreach ( $columns as $key => $val ) {
			$new[ $key ] = $val;
			if ( 'order_total' === $key ) {
				$new['wtd_invoice'] = __( 'Invoice', 'woo-tax-docs' );
			}
		}
		return $new;
	}

	public function render_order_column( $column, $post_id ) {
		if ( 'wtd_invoice' !== $column ) {
			return;
		}
		$order = wc_get_order( $post_id );
		if ( ! $order ) {
			return;
		}
		$inv_num = $order->get_meta( '_wtd_invoice_number' );
		if ( $inv_num ) {
			echo '<span class="wtd-invoice-badge">' . esc_html( $inv_num ) . '</span>';
		} else {
			echo '<span style="color:#999;">—</span>';
		}
	}

	public function add_order_action( $actions ) {
		$actions['wtd_generate_invoice'] = __( 'Generate Tax Invoice', 'woo-tax-docs' );
		return $actions;
	}

	public function handle_order_action( $order ) {
		$this->generate_for_order( $order->get_id() );
	}

	public function add_to_email( $order, $sent_to_admin, $plain_text, $email ) {
		if ( 'customer_completed_order' !== $email->id ) {
			return;
		}
		$inv_num = $order->get_meta( '_wtd_invoice_number' );
		if ( ! $inv_num ) {
			return;
		}
		if ( $plain_text ) {
			echo "\n" . sprintf( esc_html__( 'Your tax invoice number: %s', 'woo-tax-docs' ), $inv_num ) . "\n";
		} else {
			echo '<p style="margin-top:15px;"><strong>' . sprintf( esc_html__( 'Tax Invoice: %s', 'woo-tax-docs' ), esc_html( $inv_num ) ) . '</strong></p>';
		}
	}

	public function add_my_account_action( $actions, $order ) {
		$inv_id = $order->get_meta( '_wtd_invoice_id' );
		if ( $inv_id ) {
			$actions['wtd_invoice'] = array(
				'url'  => wp_nonce_url( admin_url( 'admin-ajax.php?action=wtd_download_pdf&invoice_id=' . $inv_id ), 'wtd_download_' . $inv_id ),
				'name' => __( 'Invoice', 'woo-tax-docs' ),
			);
		}
		return $actions;
	}

	public function ajax_download_pdf() {
		$invoice_id = absint( $_GET['invoice_id'] ?? 0 );
		check_admin_referer( 'wtd_download_' . $invoice_id );

		if ( ! current_user_can( 'manage_woocommerce' ) && ! $this->user_owns_invoice( $invoice_id ) ) {
			wp_die( esc_html__( 'Unauthorized', 'woo-tax-docs' ) );
		}

		global $wpdb;
		$table = $wpdb->prefix . 'wtd_invoices';
		$invoice = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $invoice_id ) );

		if ( ! $invoice || empty( $invoice->pdf_path ) || ! file_exists( $invoice->pdf_path ) ) {
			wp_die( esc_html__( 'Invoice not found', 'woo-tax-docs' ) );
		}

		$filename = sanitize_file_name( $invoice->invoice_number ) . '.html';
		header( 'Content-Type: text/html' );
		header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
		readfile( $invoice->pdf_path );
		exit;
	}

	public function ajax_generate_pdf() {
		$invoice_id = absint( $_GET['invoice_id'] ?? 0 );
		check_admin_referer( 'wtd_generate_' . $invoice_id );

		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_die( esc_html__( 'Unauthorized', 'woo-tax-docs' ) );
		}

		global $wpdb;
		$table = $wpdb->prefix . 'wtd_invoices';
		$invoice = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $invoice_id ) );
		if ( ! $invoice ) {
			wp_die( esc_html__( 'Invoice not found', 'woo-tax-docs' ) );
		}

		$order = wc_get_order( $invoice->order_id );
		if ( $order ) {
			$this->generate_html_invoice( $invoice_id, $order );
		}

		wp_safe_redirect( admin_url( 'admin.php?page=woo-tax-docs&tab=invoices' ) );
		exit;
	}

	private function user_owns_invoice( $invoice_id ) {
		global $wpdb;
		$table = $wpdb->prefix . 'wtd_invoices';
		$invoice = $wpdb->get_row( $wpdb->prepare( "SELECT order_id FROM {$table} WHERE id = %d", $invoice_id ) );
		if ( ! $invoice ) {
			return false;
		}
		$order = wc_get_order( $invoice->order_id );
		return $order && (int) $order->get_customer_id() === get_current_user_id();
	}
}
