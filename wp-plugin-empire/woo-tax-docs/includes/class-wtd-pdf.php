<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * PDF generation stub. Free version generates HTML invoices.
 * Pro version adds true PDF generation via TCPDF/DOMPDF.
 */
class WTD_PDF {

	/**
	 * Check if PDF generation is available (Pro feature).
	 */
	public static function is_available() {
		return apply_filters( 'wtd_pdf_available', false );
	}

	/**
	 * Generate PDF from invoice HTML. Pro feature stub.
	 */
	public static function generate( $invoice_id ) {
		if ( ! self::is_available() ) {
			return new WP_Error(
				'wtd_pro_required',
				__( 'PDF export requires WooCommerce Tax Doc Generator Pro. Upgrade at wootaxdocs.com/pro', 'woo-tax-docs' )
			);
		}

		return apply_filters( 'wtd_generate_pdf', null, $invoice_id );
	}

	/**
	 * Bulk export PDFs. Pro feature stub.
	 */
	public static function bulk_export( $invoice_ids ) {
		if ( ! self::is_available() ) {
			return new WP_Error(
				'wtd_pro_required',
				__( 'Bulk PDF export requires WooCommerce Tax Doc Generator Pro.', 'woo-tax-docs' )
			);
		}

		return apply_filters( 'wtd_bulk_export_pdf', null, $invoice_ids );
	}
}
